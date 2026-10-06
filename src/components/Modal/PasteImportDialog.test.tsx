import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PasteImportDialog } from "./PasteImportDialog";
import { recordEvents, stopRecording } from "../../utils/analyticsRecorder";

const example = Object.values(
  import.meta.glob<string>(
    "../../../docs/agent/examples/minimal-wall-pass.tacticalboard",
    { query: "?raw", import: "default", eager: true },
  ),
)[0];

const paste = (text: string) =>
  fireEvent.change(screen.getByLabelText("Drill from the assistant"), {
    target: { value: text },
  });
const openButton = () =>
  screen.getByRole("button", { name: "Open on board" }) as HTMLButtonElement;

describe("PasteImportDialog", () => {
  it("opens a valid pasted drill", () => {
    const onImport = vi.fn();
    render(<PasteImportDialog onImport={onImport} onClose={() => {}} />);
    expect(openButton().disabled).toBe(true);

    paste(`Here you go:\n\`\`\`json\n${example}\n\`\`\``);
    expect(screen.getByRole("status").textContent).toContain("Wall pass");
    expect(screen.queryByText(/copy feedback/i)).toBeNull();

    fireEvent.click(openButton());
    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onImport.mock.calls[0][0].sequence.frames).toHaveLength(3);
  });

  it("blocks an invalid drill and offers feedback to copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const onImport = vi.fn();
    render(<PasteImportDialog onImport={onImport} onClose={() => {}} />);

    const doc = JSON.parse(example);
    doc.frames[2].balls = [];
    paste(JSON.stringify(doc));
    expect(screen.getByRole("alert").textContent).toContain(
      "every frame must contain the same players and balls",
    );
    expect(openButton().disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /copy feedback/i }));
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("every frame must contain"),
    );
    expect(await screen.findByText("Copied")).toBeTruthy();
  });

  it("shows warnings but still lets the drill be opened", () => {
    render(<PasteImportDialog onImport={() => {}} onClose={() => {}} />);
    const doc = JSON.parse(example);
    doc.frames[0].players[0].y = 900;
    paste(JSON.stringify(doc));
    expect(screen.getByText(/1 warning/)).toBeTruthy();
    expect(screen.getByText(/off the pitch at \(300, 900\)/)).toBeTruthy();
    expect(openButton().disabled).toBe(false);
  });

  describe("usage events", () => {
    afterEach(stopRecording);

    const withWarning = () => {
      const doc = JSON.parse(example);
      doc.frames[0].players[0].y = 900;
      return JSON.stringify(doc);
    };
    const rejected = () => {
      const doc = JSON.parse(example);
      doc.frames[2].balls = [];
      return JSON.stringify(doc);
    };
    const opened = { name: "ai_paste_opened", params: undefined };

    it("reports the dialog opening once, and nothing while typing", () => {
      const events = recordEvents();
      const { rerender } = render(
        <PasteImportDialog onImport={() => {}} onClose={() => {}} />,
      );
      paste("{");
      paste(rejected());
      paste(example);
      rerender(<PasteImportDialog onImport={() => {}} onClose={() => {}} />);

      expect(events).toEqual([opened]);
    });

    it("passes the warning count when a board is opened, and reports no abandon", () => {
      const events = recordEvents();
      const onImport = vi.fn();
      render(<PasteImportDialog onImport={onImport} onClose={() => {}} />);

      paste(example);
      fireEvent.click(openButton());
      expect(onImport.mock.calls[0][1]).toBe(0);

      paste(withWarning());
      fireEvent.click(openButton());
      expect(onImport.mock.calls[1][1]).toBe(1);

      expect(events).toEqual([opened]);
    });

    it("reports copied feedback for a rejected drill", async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });
      const events = recordEvents();
      render(<PasteImportDialog onImport={() => {}} onClose={() => {}} />);

      paste(rejected());
      fireEvent.click(screen.getByRole("button", { name: /copy feedback/i }));

      await waitFor(() =>
        expect(events).toEqual([
          opened,
          {
            name: "ai_paste_feedback_copied",
            params: { result: "invalid", warnings: 0 },
          },
        ]),
      );
    });

    it("reports copied feedback for a drill with warnings", async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });
      const events = recordEvents();
      render(<PasteImportDialog onImport={() => {}} onClose={() => {}} />);

      paste(withWarning());
      fireEvent.click(screen.getByRole("button", { name: /copy feedback/i }));

      await waitFor(() =>
        expect(events[1]).toEqual({
          name: "ai_paste_feedback_copied",
          params: { result: "warnings", warnings: 1 },
        }),
      );
    });

    it("reports no feedback event when the copy is refused", async () => {
      const writeText = vi.fn().mockRejectedValue(new Error("denied"));
      Object.assign(navigator, { clipboard: { writeText } });
      const events = recordEvents();
      render(<PasteImportDialog onImport={() => {}} onClose={() => {}} />);

      paste(rejected());
      fireEvent.click(screen.getByRole("button", { name: /copy feedback/i }));

      await waitFor(() => expect(writeText).toHaveBeenCalled());
      expect(events).toEqual([opened]);
    });

    it.each([
      ["empty", () => {}],
      ["invalid", () => paste(rejected())],
      ["warnings", () => paste(withWarning())],
      ["valid", () => paste(example)],
    ])("reports leaving with a result of %s", (result, fill) => {
      const events = recordEvents();
      const onClose = vi.fn();
      render(<PasteImportDialog onImport={() => {}} onClose={onClose} />);

      fill();
      fireEvent.keyDown(document, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(events).toEqual([
        opened,
        { name: "ai_paste_abandoned", params: { result } },
      ]);
    });

    it("reports leaving through the close button and the backdrop", () => {
      const events = recordEvents();
      const first = render(
        <PasteImportDialog onImport={() => {}} onClose={() => {}} />,
      );
      fireEvent.click(screen.getByRole("dialog").parentElement!);
      first.unmount();

      render(<PasteImportDialog onImport={() => {}} onClose={() => {}} />);
      fireEvent.click(screen.getByRole("button", { name: /close/i }));

      expect(events.filter((e) => e.name === "ai_paste_abandoned")).toEqual([
        { name: "ai_paste_abandoned", params: { result: "empty" } },
        { name: "ai_paste_abandoned", params: { result: "empty" } },
      ]);
    });
  });
});
