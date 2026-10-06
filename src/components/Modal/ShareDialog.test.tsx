import { describe, it, expect, afterEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { parseProjectJSON, toDocument } from "../../animation/migrate";
import { recordEvents, stopRecording } from "../../utils/analyticsRecorder";
import { ShareDialog } from "./ShareDialog";

const example = Object.values(
  import.meta.glob<string>(
    "../../../docs/agent/examples/minimal-wall-pass.tacticalboard",
    { query: "?raw", import: "default", eager: true },
  ),
)[0];

const parsed = parseProjectJSON(example);
if (!parsed.ok) throw new Error(parsed.error);
const doc = toDocument(parsed.value.sequence, parsed.value.settings!);

// The link is created asynchronously; Copy is disabled until it exists.
const copyButton = async () => {
  await waitFor(() =>
    expect(
      (
        screen.getByRole("textbox", {
          name: "Share link",
        }) as HTMLInputElement
      ).value,
    ).toContain("#share="),
  );
  return screen.getByRole("button", { name: "Copy" });
};

describe("ShareDialog", () => {
  afterEach(stopRecording);

  it("reports a copied link with the number of frames", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const events = recordEvents();
    render(<ShareDialog document={doc} onClose={() => {}} />);

    fireEvent.click(await copyButton());

    await waitFor(() =>
      expect(events).toEqual([
        { name: "share_link_copied", params: { frames: doc.frames.length } },
      ]),
    );
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("#share="));
  });

  it("reports nothing when the dialog is closed without copying", async () => {
    const events = recordEvents();
    const onClose = vi.fn();
    render(<ShareDialog document={doc} onClose={onClose} />);
    await copyButton();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
    expect(events).toEqual([]);
  });

  it("reports nothing when the browser refuses the copy", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.assign(navigator, { clipboard: { writeText } });
    const events = recordEvents();
    render(<ShareDialog document={doc} onClose={() => {}} />);

    fireEvent.click(await copyButton());

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(events).toEqual([]);
  });
});
