import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useEffect } from "react";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import { useTacticsState } from "../../hooks/useTacticsState";
import { useAnimationPlayback } from "../../animation/useAnimationPlayback";
import { createFakeClock, V3_DOCUMENT } from "../../animation/testing";
import { parseProjectJSON } from "../../animation/migrate";
import { recordEvents, stopRecording } from "../../utils/analyticsRecorder";
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

  describe("move pacing", () => {
    const NATURAL = "Natural (speeds up, then slows)";
    const pacing = () =>
      screen.getByLabelText("Move pacing") as HTMLSelectElement;
    const addFrames = (n: number) => {
      for (let i = 0; i < n; i++) {
        fireEvent.click(screen.getByRole("button", { name: /add frame/i }));
      }
    };
    const choose = (easing: "linear" | "easeInOut") =>
      fireEvent.change(pacing(), { target: { value: easing } });
    const marker = (i: number) =>
      chips()[i].querySelector("[data-pacing-marker]");

    it("offers steady and natural pacing, except on the last frame", () => {
      render(<Harness />);
      expect(screen.queryByLabelText("Move pacing")).toBeNull();
      addFrames(1);
      expect(screen.queryByLabelText("Move pacing")).toBeNull();

      fireEvent.click(chips()[0]);
      expect(pacing().value).toBe("linear");
      expect(
        within(pacing())
          .getAllByRole("option")
          .map((o) => o.textContent),
      ).toEqual(["Steady speed", NATURAL]);
    });

    it("changes only the selected frame and shows the stored choice again", () => {
      render(<Harness />);
      addFrames(3);
      fireEvent.click(chips()[1]);
      choose("easeInOut");
      expect(latest.frames.map((f) => f.easing)).toEqual([
        undefined,
        "easeInOut",
        undefined,
        undefined,
      ]);

      fireEvent.click(chips()[2]);
      expect(pacing().value).toBe("linear");
      fireEvent.click(chips()[1]);
      expect(pacing().value).toBe("easeInOut");
    });

    it("is one undo step back to steady speed", () => {
      render(<Harness />);
      addFrames(1);
      fireEvent.click(chips()[0]);
      choose("easeInOut");
      act(() => latest.undo());
      expect(latest.frames).toHaveLength(2);
      expect(pacing().value).toBe("linear");
    });

    it("marks a frame with natural pacing on its chip", () => {
      render(<Harness />);
      addFrames(2);
      fireEvent.click(chips()[1]);
      const steadyLabel = chips()[1].getAttribute("aria-label");
      expect(steadyLabel).toBe(
        "Frame 2, hold 0.00 seconds, then move for 1.00 seconds",
      );
      expect(marker(1)).toBeNull();

      choose("easeInOut");
      expect(marker(1)).not.toBeNull();
      expect(marker(1)!.getAttribute("aria-hidden")).toBe("true");
      expect(chips()[1].getAttribute("aria-label")).toBe(
        `${steadyLabel}, natural pacing`,
      );
      expect(marker(0)).toBeNull();
      expect(chips()[0].getAttribute("aria-label")).not.toMatch(/pacing/);

      act(() => latest.undo());
      expect(marker(1)).toBeNull();
      expect(chips()[1].getAttribute("aria-label")).toBe(steadyLabel);
    });

    it("shows no marker once the frame is the last one", () => {
      render(<Harness />);
      addFrames(1);
      fireEvent.click(chips()[0]);
      choose("easeInOut");
      expect(marker(0)).not.toBeNull();

      fireEvent.click(screen.getByRole("button", { name: /move .*later/i }));
      expect(latest.frames[1].easing).toBe("easeInOut");
      expect(marker(1)).toBeNull();
      expect(chips()[1].getAttribute("aria-label")).not.toMatch(/pacing/);
    });

    describe("usage event", () => {
      let events: ReturnType<typeof recordEvents>;
      const sent = () =>
        events.filter((e) => e.name === "frame_pacing_changed");
      beforeEach(() => {
        events = recordEvents();
      });
      afterEach(() => stopRecording());

      it("reports the new value and the frame count, never the label", () => {
        render(<Harness />);
        addFrames(3);
        fireEvent.click(chips()[1]);
        act(() =>
          latest.renameFrame(latest.selectedFrameId, "Press their number 6"),
        );

        choose("easeInOut");
        expect(sent()).toEqual([
          {
            name: "frame_pacing_changed",
            params: { easing: "easeInOut", frames: 4 },
          },
        ]);
        choose("linear");
        expect(sent()[1].params).toEqual({ easing: "linear", frames: 4 });
        expect(JSON.stringify(sent())).not.toMatch(/Press|number 6/);
      });

      it("reports nothing when the value is already set", () => {
        render(<Harness />);
        addFrames(1);
        fireEvent.click(chips()[0]);
        choose("linear");
        expect(sent()).toEqual([]);
        expect(latest.canUndo).toBe(true); // only the added frame
        act(() => latest.undo());
        expect(latest.canUndo).toBe(false);
      });

      it("reports nothing for undo and redo", () => {
        render(<Harness />);
        addFrames(1);
        fireEvent.click(chips()[0]);
        choose("easeInOut");
        act(() => latest.undo());
        act(() => latest.redo());
        expect(latest.frames[0].easing).toBe("easeInOut");
        expect(sent()).toHaveLength(1);
      });

      it("reports nothing when a board with eased frames is opened", () => {
        render(<Harness />);
        const eased = {
          ...V3_DOCUMENT,
          schemaVersion: 4,
          frames: V3_DOCUMENT.frames.map((f) => ({
            ...f,
            easing: "easeInOut",
          })),
        };
        const project = parseProjectJSON(JSON.stringify(eased));
        if (!project.ok) throw new Error(project.error);
        act(() => latest.importProject(project.value));
        expect(latest.frames[0].easing).toBe("easeInOut");
        expect(sent()).toEqual([]);
      });
    });
  });
});
