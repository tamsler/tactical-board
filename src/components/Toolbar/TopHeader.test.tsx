import { describe, it, expect, beforeEach } from "vitest";
import { createRef, useEffect } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useTacticsState } from "../../hooks/useTacticsState";
import { TopHeader } from "./TopHeader";

type Tactics = ReturnType<typeof useTacticsState>;
const ref: { current: Tactics | null } = { current: null };

function Harness({ animationEnabled }: { animationEnabled: boolean }) {
  const tactics = useTacticsState();
  useEffect(() => {
    ref.current = tactics;
  });
  return (
    <TopHeader
      tactics={tactics}
      boardRef={createRef<SVGSVGElement>()}
      animationEnabled={animationEnabled}
      onShare={animationEnabled ? () => {} : undefined}
    />
  );
}

const openMenu = () =>
  fireEvent.click(screen.getByRole("button", { name: /save \/ export/i }));

const ctrlS = () => {
  const event = new KeyboardEvent("keydown", {
    key: "s",
    ctrlKey: true,
    cancelable: true,
  });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};

describe("TopHeader file menu", () => {
  beforeEach(() => localStorage.clear());

  it("keeps the original single-board save without the flag", () => {
    render(<Harness animationEnabled={false} />);
    openMenu();
    expect(screen.getByText("Save Project File (JSON)")).toBeTruthy();
    expect(screen.queryByText(/share link/i)).toBeNull();
    expect(screen.queryByText(/save as/i)).toBeNull();
    expect(screen.queryByText(/legacy json/i)).toBeNull();
    expect(ctrlS()).toBe(false);
  });

  it("offers project saving, sharing and Ctrl/Cmd+S with the flag", () => {
    render(<Harness animationEnabled />);
    openMenu();
    expect(screen.getByText("Save (Ctrl/Cmd+S)")).toBeTruthy();
    expect(screen.getByText(/share link/i)).toBeTruthy();
    expect(screen.getByText(/legacy json/i)).toBeTruthy();
    expect(ctrlS()).toBe(true);
  });

  it("saves every frame of an animated board even without the flag", () => {
    render(<Harness animationEnabled={false} />);
    act(() => ref.current!.addFrame());
    openMenu();
    expect(screen.getByText("Save Project File")).toBeTruthy();
    expect(screen.getByText(/all frames/i)).toBeTruthy();
    expect(screen.queryByText(/share link/i)).toBeNull();
  });
});
