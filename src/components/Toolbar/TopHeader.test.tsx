import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useTacticsState } from "../../hooks/useTacticsState";
import { dismissToast, toastStore } from "../../utils/toast";
import { TopHeader } from "./TopHeader";

function Harness() {
  const tactics = useTacticsState();
  return (
    <TopHeader
      tactics={tactics}
      boardRef={createRef<SVGSVGElement>()}
      onShare={() => {}}
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
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("offers project saving, sharing and Ctrl/Cmd+S", () => {
    render(<Harness />);
    openMenu();
    expect(screen.getByText("Save (Ctrl/Cmd+S)")).toBeTruthy();
    expect(screen.getByText(/all frames/i)).toBeTruthy();
    expect(screen.getByText(/share link/i)).toBeTruthy();
    expect(screen.getByText(/legacy json/i)).toBeTruthy();
    expect(screen.queryByText("Save Project File (JSON)")).toBeNull();
    expect(ctrlS()).toBe(true);
  });

  it("names the legacy export tactics-frame.json when the title is empty", () => {
    toastStore.getSnapshot().forEach((t) => dismissToast(t.id));
    render(<Harness />);
    fireEvent.change(screen.getByPlaceholderText("Tactics Title..."), {
      target: { value: "" },
    });
    openMenu();
    fireEvent.click(screen.getByText(/legacy json/i));
    expect(toastStore.getSnapshot().map((t) => t.message)).toContain(
      "Exported tactics-frame.json",
    );
  });
});
