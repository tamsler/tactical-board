import { describe, it, expect, beforeEach, vi } from "vitest";
import { StrictMode } from "react";
import { renderHook, act } from "@testing-library/react";
import { useTacticsState } from "../hooks/useTacticsState";
import { useAnimationPlayback } from "./useAnimationPlayback";
import { createFakeClock } from "./testing";

function setup(options: { strict?: boolean } = {}) {
  const fake = createFakeClock();
  const hook = renderHook(
    () => {
      const tactics = useTacticsState();
      const playback = useAnimationPlayback(tactics, fake.clock);
      return { tactics, playback };
    },
    { wrapper: options.strict ? StrictMode : undefined },
  );
  // Two frames; the first player runs 600 units to the right over 1 s.
  act(() => hook.result.current.tactics.addFrame());
  const id = hook.result.current.tactics.state.players[0].id;
  const startX = hook.result.current.tactics.state.players[0].x;
  act(() => hook.result.current.tactics.updatePlayer(id, { x: startX + 600 }));
  act(() =>
    hook.result.current.playback.editFrame(
      hook.result.current.tactics.frames[0].id,
    ),
  );
  const time = () =>
    hook.result.current.playback.controller.getSnapshot().timeMs;
  return { fake, hook, time };
}

describe("useAnimationPlayback", () => {
  beforeEach(() => localStorage.clear());

  it("plays in a read-only preview", () => {
    const { fake, hook, time } = setup();
    act(() => hook.result.current.playback.play());
    expect(hook.result.current.tactics.isPreviewing).toBe(true);
    expect(hook.result.current.tactics.canUndo).toBe(false);

    act(() => fake.advance(500));
    expect(time()).toBe(500);

    const before = hook.result.current.tactics.frames;
    act(() => {
      hook.result.current.tactics.pushState((prev) => ({
        ...prev,
        title: "x",
      }));
      hook.result.current.tactics.addFrame();
      hook.result.current.tactics.undo();
    });
    expect(hook.result.current.tactics.frames).toBe(before);
  });

  it("returns to editing the chosen frame and parks the playhead there", () => {
    const { fake, hook, time } = setup();
    act(() => hook.result.current.playback.play());
    act(() => fake.advance(300));
    act(() =>
      hook.result.current.playback.editFrame(
        hook.result.current.tactics.frames[1].id,
      ),
    );
    expect(hook.result.current.tactics.isPreviewing).toBe(false);
    expect(time()).toBe(1000);
    expect(fake.pending()).toBe(0);
  });

  it("steps to the source or target of the current move", () => {
    const { hook } = setup();
    const [f1, f2] = hook.result.current.tactics.frames;
    act(() => hook.result.current.playback.seek(400));
    act(() => hook.result.current.playback.step(1));
    expect(hook.result.current.tactics.selectedFrameId).toBe(f2.id);
    act(() => hook.result.current.playback.seek(400));
    act(() => hook.result.current.playback.step(-1));
    expect(hook.result.current.tactics.selectedFrameId).toBe(f1.id);
  });

  it("pauses when the tab is hidden and stays paused on return (A11)", () => {
    const { fake, hook, time } = setup();
    act(() => hook.result.current.playback.play());
    act(() => fake.advance(200));
    const visibility = vi.spyOn(document, "visibilityState", "get");
    visibility.mockReturnValue("hidden");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    visibility.mockReturnValue("visible");
    act(() => fake.advance(500));
    expect(hook.result.current.playback.controller.getSnapshot().status).toBe(
      "paused",
    );
    expect(time()).toBe(200);
    visibility.mockRestore();
  });

  it("cancels the frame callback on unmount (A11)", () => {
    const { fake, hook } = setup();
    act(() => hook.result.current.playback.play());
    expect(fake.pending()).toBe(1);
    hook.unmount();
    expect(fake.pending()).toBe(0);
  });

  it("does not double speed under Strict Mode (A11)", () => {
    const { fake, hook, time } = setup({ strict: true });
    act(() => hook.result.current.playback.play());
    act(() => fake.advance(250));
    expect(time()).toBe(250);
    expect(fake.pending()).toBe(1);
  });

  it("writes nothing to storage during playback or scrubbing", () => {
    vi.useFakeTimers();
    try {
      const { fake, hook } = setup();
      act(() => vi.runAllTimers());
      const setItem = vi.spyOn(Storage.prototype, "setItem");
      act(() => hook.result.current.playback.play());
      for (let i = 0; i < 5; i++) {
        act(() => fake.advance(100));
        act(() => vi.advanceTimersByTime(1000));
      }
      act(() => hook.result.current.playback.seek(250));
      act(() => vi.advanceTimersByTime(1000));
      expect(setItem).not.toHaveBeenCalled();
      setItem.mockRestore();
    } finally {
      vi.useRealTimers();
    }
  });

  it("disables play for a single frame with no hold", () => {
    const fake = createFakeClock();
    const { result } = renderHook(() =>
      useAnimationPlayback(useTacticsState(), fake.clock),
    );
    expect(result.current.canPlay).toBe(false);
    act(() => result.current.play());
    expect(fake.pending()).toBe(0);
  });
});
