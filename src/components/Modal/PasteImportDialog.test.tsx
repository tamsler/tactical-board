import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PasteImportDialog } from "./PasteImportDialog";

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
});
