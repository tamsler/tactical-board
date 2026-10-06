import { StrictMode } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "../App";
import { createShareLink } from "../animation/shareLink";
import { parseProjectJSON, toDocument } from "../animation/migrate";
import { VideoExportDialog } from "../components/Modal/VideoExportDialog";
import type { VideoView } from "../animation/videoExport";
import { recordEvents, stopRecording } from "./analyticsRecorder";

// openspec/specs/usage-analytics: events carry counts and fixed categories,
// never board content. This drives a board full of marker strings through
// every feature that reports and checks none of them leaves the app.

const exporter = vi.hoisted(() => {
  class VideoExportUnsupportedError extends Error {}
  return { VideoExportUnsupportedError, exportAnimationVideo: vi.fn() };
});
vi.mock("../animation/videoExport", () => exporter);

const example = Object.values(
  import.meta.glob<string>(
    "../../docs/agent/examples/minimal-wall-pass.tacticalboard",
    { query: "?raw", import: "default", eager: true },
  ),
)[0];

const MARKERS = {
  title: "Zebra-Title",
  notes: "Zebra-Notes",
  frame: "Zebra-Frame",
  player: "Zebra-Player",
  caption: "Zebra-Caption",
  pasted: "Zebra-Pasted",
  error: "Zebra-Error",
};

function secretDocument() {
  const doc = JSON.parse(example);
  doc.title = MARKERS.title;
  for (const frame of doc.frames) {
    frame.title = MARKERS.frame;
    frame.notes = MARKERS.notes;
    frame.players[0].name = MARKERS.player;
    frame.texts = [
      {
        id: "caption-1",
        x: 48,
        y: 21,
        text: MARKERS.caption,
        fontSize: 13,
        color: "#ffffff",
      },
    ];
  }
  return doc;
}

const secretJSON = JSON.stringify(secretDocument());

describe("usage events never carry board content", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    stopRecording();
    vi.restoreAllMocks();
    window.location.hash = "";
  });

  it("through share links, files, Paste from AI and video export", async () => {
    const events = recordEvents();
    const names = () => events.map((e) => e.name);
    const title = () =>
      (screen.getByPlaceholderText("Tactics Title...") as HTMLInputElement)
        .value;

    // 1. Open the board from a share link.
    const parsed = parseProjectJSON(secretJSON);
    if (!parsed.ok) throw new Error(parsed.error);
    const link = await createShareLink(
      toDocument(parsed.value.sequence, parsed.value.settings!),
      "http://localhost/",
    );
    window.location.hash = link.slice(link.indexOf("#"));
    const { container } = render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    await waitFor(() => expect(title()).toBe(MARKERS.title));

    // 2. Copy a share link for it.
    fireEvent.click(screen.getByRole("button", { name: /save \/ export/i }));
    fireEvent.click(screen.getByText("Share Link…"));
    await waitFor(() =>
      expect(
        (screen.getByRole("textbox", { name: "Share link" }) as HTMLInputElement)
          .value,
      ).toContain("#share="),
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(names()).toContain("share_link_copied"));
    fireEvent.keyDown(document, { key: "Escape" });

    // 3. Paste from AI: a rejected answer, feedback copied, dialog closed.
    const pasteButton = () =>
      screen.getByRole("button", { name: "Paste from AI" });
    const paste = (text: string) =>
      fireEvent.change(screen.getByLabelText("Drill from the assistant"), {
        target: { value: text },
      });
    fireEvent.click(pasteButton());
    paste(`${MARKERS.pasted} {"kind": "${MARKERS.pasted}"}`);
    fireEvent.click(screen.getByRole("button", { name: /copy feedback/i }));
    await waitFor(() => expect(names()).toContain("ai_paste_feedback_copied"));
    fireEvent.keyDown(document, { key: "Escape" });

    // 4. Paste from AI: a valid answer, opened on the board.
    fireEvent.click(pasteButton());
    paste(secretJSON);
    fireEvent.click(screen.getByRole("button", { name: "Open on board" }));

    // 5. Open the same board from a file.
    const fileInput = container.querySelector<HTMLInputElement>(
      'input[type="file"]',
    )!;
    fireEvent.change(fileInput, {
      target: {
        files: [new File([secretJSON], `${MARKERS.title}.tacticalboard`)],
      },
    });
    await waitFor(() =>
      expect(
        events.filter(
          (e) => e.name === "import_tactics" && e.params?.source === "file",
        ),
      ).toHaveLength(1),
    );

    // 6. A video export that fails with a message naming the board.
    exporter.exportAnimationVideo.mockRejectedValue(
      new Error(`${MARKERS.error} while encoding ${MARKERS.title}`),
    );
    render(
      <VideoExportDialog
        format="mp4"
        frames={[]}
        view={{} as VideoView}
        title={MARKERS.title}
        onClose={() => {}}
      />,
    );
    await waitFor(() => expect(names()).toContain("video_export_failed"));

    // Every reporting path ran, in order, exactly once each.
    expect(
      events.map((e) =>
        e.name === "import_tactics" ? `import:${e.params?.source}` : e.name,
      ),
    ).toEqual([
      "import:share_link",
      "share_link_copied",
      "ai_paste_opened",
      "ai_paste_feedback_copied",
      "ai_paste_abandoned",
      "ai_paste_opened",
      "import:ai_paste",
      "import:file",
      "video_export_failed",
    ]);
    expect(
      events.find((e) => e.params?.source === "ai_paste")?.params,
    ).toMatchObject({ frames: 3, warnings: expect.any(Number) });

    const sent = JSON.stringify(events);
    for (const marker of Object.values(MARKERS)) {
      expect(sent).not.toContain(marker);
    }
    expect(sent).not.toMatch(/zebra/i);
  });
});
