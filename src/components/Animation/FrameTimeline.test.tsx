import { describe, it, expect, beforeEach } from "vitest";
import { useEffect } from "react";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import { useTacticsState } from "../../hooks/useTacticsState";
import { useAnimationPlayback } from "../../animation/useAnimationPlayback";
import { createFakeClock } from "../../animation/testing";
import { FrameTimeline } from "./FrameTimeline";

type Tactics = ReturnType<typeof useTacticsState>;
const ref: { current: Tactics | null } = { current: null };
// Always reads the most recently rendered hook value.
const latest = new Proxy({} as Tactics, {
  get: (_target, key) => ref.current![key as keyof Tactics],
});
let fake = createFakeClock();

function Harness() {
  const tactics = useTacticsState();
  const playback = useAnimationPlayback(tactics, fake.clock);
  useEffect(() => {
    ref.current = tactics;
  });
  return (
    <FrameTimeline tactics={tactics} playback={playback} onClose={() => {}} />
  );
}

const chips = () => within(screen.getByRole("list")).getAllByRole("button");

describe("FrameTimeline", () => {
  beforeEach(() => {
    localStorage.clear();
    fake = createFakeClock();
  });

  it("plays in read-only preview and returns to editing on frame select", () => {
    render(<Harness />);
    const playButton = () =>
      screen.getByRole("button", { name: /^(play|pause)$/i });
    expect((playButton() as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /add frame/i }));
    fireEvent.click(chips()[0]);
    fireEvent.click(playButton());
    expect(latest.isPreviewing).toBe(true);
    expect(screen.getByText(/select a frame to edit it/i)).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: /add frame/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    act(() => fake.advance(400));
    const slider = screen.getByRole("slider", { name: /playback position/i });
    expect((slider as HTMLInputElement).value).toBe("400");

    fireEvent.click(chips()[1]);
    expect(latest.isPreviewing).toBe(false);
    expect(fake.pending()).toBe(0);
    expect((slider as HTMLInputElement).value).toBe("1000");
  });

  it("authors a three-frame sequence with isolated edits", () => {
    render(<Harness />);
    expect(chips()).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /add frame/i }));
    fireEvent.click(screen.getByRole("button", { name: /add frame/i }));
    expect(chips()).toHaveLength(3);
    expect(chips()[2].getAttribute("aria-current")).toBe("true");

    const playerId = latest.state.players[0].id;
    const originalX = latest.state.players[0].x;
    fireEvent.click(chips()[1]);
    expect(chips()[1].getAttribute("aria-current")).toBe("true");
    // Drag in Frame 2 only
    act(() => latest.beginDrag());
    act(() =>
      latest.updateDrag((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === playerId ? { ...p, x: 800 } : p,
        ),
      })),
    );
    act(() => latest.commitDrag());

    const xs = latest.frames.map(
      (f) => f.players.find((p) => p.id === playerId)!.x,
    );
    expect(xs).toEqual([originalX, 800, originalX]);
  });

  it("rejects out-of-range timing with an inline message", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /add frame/i }));
    fireEvent.click(chips()[0]);

    const duration = screen.getByLabelText(/move to next frame/i);
    fireEvent.change(duration, { target: { value: "0.01" } });
    fireEvent.blur(duration);
    expect(screen.getByText(/duration must be between/i)).toBeTruthy();
    expect(latest.frames[0].durationMs).toBe(1000);

    const hold = screen.getByLabelText(/hold this frame/i);
    fireEvent.change(hold, { target: { value: "0.5" } });
    fireEvent.blur(hold);
    expect(latest.frames[0].holdMs).toBe(500);
  });

  it("labels the overlay toggle in coaching terms with frame-aware hints", () => {
    render(<Harness />);
    const toggle = screen.getByRole("button", { name: /show moves/i });
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/their next positions/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /add frame/i }));
    expect(screen.getByText(/drag the dot on an arrow/i)).toBeTruthy();
    fireEvent.click(chips()[0]);
    expect(screen.getByText(/moves appear from frame 2/i)).toBeTruthy();

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByText(/moves appear from frame 2/i)).toBeNull();
  });

  it("hides the outgoing duration on the last frame", () => {
    render(<Harness />);
    expect(screen.queryByLabelText(/move to next frame/i)).toBeNull();
    expect(screen.getByText(/last frame/i)).toBeTruthy();
  });

  it("offers undo after deleting a frame", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /add frame/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete frame/i }));
    expect(chips()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /^undo$/i }));
    expect(chips()).toHaveLength(2);
  });

  it("reorders frames with the move buttons", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /add frame/i }));
    const secondId = latest.selectedFrameId;
    fireEvent.click(
      screen.getByRole("button", { name: /move frame earlier/i }),
    );
    expect(latest.frames[0].id).toBe(secondId);
    expect(
      (
        screen.getByRole("button", {
          name: /move frame earlier/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
