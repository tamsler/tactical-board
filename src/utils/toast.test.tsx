import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { dismissToast, showToast, toastStore } from "./toast";
import { Toaster } from "../components/Toast/Toaster";

describe("toasts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    toastStore.getSnapshot().forEach((t) => dismissToast(t.id));
  });
  afterEach(() => vi.useRealTimers());

  it("shows a confirmation and hides it after 4 seconds", () => {
    render(<Toaster />);
    act(() => showToast("Exported press-plan.png"));
    expect(screen.getByRole("status").textContent).toContain(
      "Exported press-plan.png",
    );
    act(() => vi.advanceTimersByTime(3999));
    expect(screen.queryByText("Exported press-plan.png")).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("Exported press-plan.png")).toBeNull();
  });

  it("keeps errors longer and can be dismissed", () => {
    render(<Toaster />);
    act(() => showToast("Couldn't export the PDF.", "error"));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByText("Couldn't export the PDF.")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByText("Couldn't export the PDF.")).toBeNull();
  });

  it("shows at most three at once", () => {
    ["a", "b", "c", "d"].forEach((m) => showToast(m));
    expect(toastStore.getSnapshot().map((t) => t.message)).toEqual([
      "b",
      "c",
      "d",
    ]);
  });
});
