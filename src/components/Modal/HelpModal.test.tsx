import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HelpModal } from "./HelpModal";

describe("HelpModal", () => {
  it("lists arrow-key nudging among the shortcuts", () => {
    render(<HelpModal isOpen onClose={() => {}} />);
    expect(screen.getByText("Nudge Selected")).toBeTruthy();
    expect(screen.getByText("Nudge 10×")).toBeTruthy();
    expect(screen.getByText("Shift + Arrows")).toBeTruthy();
  });
});
