import { useEffect } from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useTacticsState } from "../../hooks/useTacticsState";
import { PropertiesPanel } from "./PropertiesPanel";

type Tactics = ReturnType<typeof useTacticsState>;
type SelectedType = NonNullable<Tactics["selectedType"]>;

let tactics: Tactics;

function Harness() {
  const current = useTacticsState();
  useEffect(() => {
    tactics = current;
  });
  return <PropertiesPanel tactics={current} />;
}

const select = (id: string, type: SelectedType) =>
  act(() => {
    tactics.setSelectedId(id);
    tactics.setSelectedType(type);
  });

const addToBoard = (items: Partial<Tactics["state"]>) =>
  act(() => tactics.pushState((prev) => ({ ...prev, ...items })));

const line = {
  id: "l1",
  type: "straight" as const,
  points: [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
  ],
  color: "#ffffff",
  width: 3,
  style: "solid" as const,
};

const shape = {
  id: "s1",
  type: "rectangle" as const,
  x: 100,
  y: 100,
  width: 200,
  height: 100,
  color: "#ffffff",
  fillOpacity: 0.2,
  strokeColor: "#ffffff",
  strokeWidth: 2,
};

const text = {
  id: "t1",
  x: 100,
  y: 100,
  text: "Press high",
  fontSize: 13,
  color: "#ffffff",
};

describe("PropertiesPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    render(<Harness />);
  });

  it("says nothing is selected", () => {
    expect(screen.getByText("Nothing Selected")).toBeTruthy();
  });

  describe("player", () => {
    const selectFirstPlayer = () => {
      const id = tactics.state.players[0].id;
      select(id, "player");
      return () => tactics.state.players.find((p) => p.id === id);
    };

    it("edits the number and name, and each edit can be undone", () => {
      const player = selectFirstPlayer();
      const before = player()!;

      fireEvent.change(screen.getByDisplayValue(before.number), {
        target: { value: "23" },
      });
      expect(player()!.number).toBe("23");

      fireEvent.change(screen.getByPlaceholderText("e.g. RW / Messi"), {
        target: { value: "Kante" },
      });
      expect(player()!.name).toBe("Kante");

      act(() => tactics.undo());
      expect(player()).toMatchObject({ number: "23", name: before.name });
      act(() => tactics.undo());
      expect(player()!.number).toBe(before.number);
    });

    it("leaves position and other players alone when editing", () => {
      const player = selectFirstPlayer();
      const before = player()!;
      const others = tactics.state.players.slice(1);

      fireEvent.change(screen.getByDisplayValue(before.number), {
        target: { value: "23" },
      });

      expect(player()).toMatchObject({ x: before.x, y: before.y });
      expect(tactics.state.players.slice(1)).toEqual(others);
    });

    it("toggles goalkeeper styling and the vision cone", () => {
      const player = selectFirstPlayer();
      const wasGoalkeeper = !!player()!.isGoalkeeper;

      fireEvent.click(screen.getByLabelText("Goalkeeper Styling"));
      expect(!!player()!.isGoalkeeper).toBe(!wasGoalkeeper);

      fireEvent.click(screen.getByLabelText("Vision Cone / Body Angle"));
      expect(player()!.showVisionCone).toBe(true);
    });

    it("deletes the player and clears the selection", () => {
      const player = selectFirstPlayer();
      const count = tactics.state.players.length;

      fireEvent.click(screen.getByTitle("Delete Player"));

      expect(player()).toBeUndefined();
      expect(tactics.state.players).toHaveLength(count - 1);
      expect(tactics.selectedId).toBeNull();
      expect(screen.getByText("Nothing Selected")).toBeTruthy();
    });

    it("changes the name in every frame of an animation", () => {
      act(() => tactics.addFrame());
      act(() => tactics.selectFrame(tactics.frames[0].id));
      const id = tactics.state.players[0].id;
      select(id, "player");

      fireEvent.change(screen.getByPlaceholderText("e.g. RW / Messi"), {
        target: { value: "Kante" },
      });

      expect(
        tactics.frames.map((f) => f.players.find((p) => p.id === id)!.name),
      ).toEqual(["Kante", "Kante"]);
    });

    it("deletes the player from every frame of an animation", () => {
      act(() => tactics.addFrame());
      const id = tactics.state.players[0].id;
      select(id, "player");

      fireEvent.click(screen.getByTitle("Delete Player from all frames"));

      expect(
        tactics.frames.map((f) => f.players.some((p) => p.id === id)),
      ).toEqual([false, false]);
    });
  });

  describe("line", () => {
    beforeEach(() => {
      addToBoard({ lines: [line] });
      select("l1", "line");
    });

    it("edits the label and width", () => {
      fireEvent.change(
        screen.getByPlaceholderText("e.g. Overlap run, Key pass"),
        { target: { value: "Overlap" } },
      );
      expect(tactics.state.lines[0].label).toBe("Overlap");

      fireEvent.change(screen.getByRole("slider"), { target: { value: "6" } });
      expect(tactics.state.lines[0].width).toBe(6);
      expect(tactics.state.lines[0].points).toEqual(line.points);
    });

    it("deletes the line", () => {
      fireEvent.click(screen.getByTitle("Delete Line"));
      expect(tactics.state.lines).toHaveLength(0);
      expect(tactics.selectedId).toBeNull();
    });
  });

  describe("zone", () => {
    beforeEach(() => {
      addToBoard({ shapes: [shape] });
      select("s1", "shape");
    });

    it("edits the label and fill opacity", () => {
      fireEvent.change(
        screen.getByPlaceholderText("e.g. Pressing Trap, Half-space"),
        { target: { value: "Trap" } },
      );
      expect(tactics.state.shapes[0].label).toBe("Trap");

      fireEvent.change(screen.getByRole("slider"), {
        target: { value: "0.5" },
      });
      expect(tactics.state.shapes[0].fillOpacity).toBe(0.5);
      expect(tactics.state.shapes[0]).toMatchObject({ width: 200, height: 100 });
    });

    it("deletes the zone", () => {
      fireEvent.click(screen.getByTitle("Delete Zone"));
      expect(tactics.state.shapes).toHaveLength(0);
    });
  });

  describe("text", () => {
    beforeEach(() => {
      addToBoard({ texts: [text] });
      select("t1", "text");
    });

    it("edits the text", () => {
      fireEvent.change(screen.getByDisplayValue("Press high"), {
        target: { value: "Drop off" },
      });
      expect(tactics.state.texts[0].text).toBe("Drop off");
    });

    it("sets the alignment", () => {
      fireEvent.click(screen.getByTitle("Align Center"));
      expect(tactics.state.texts[0].align).toBe("center");
      fireEvent.click(screen.getByTitle("Align Right"));
      expect(tactics.state.texts[0].align).toBe("right");
    });

    it("wraps the selected words in bold markers", () => {
      const textarea = screen.getByDisplayValue(
        "Press high",
      ) as HTMLTextAreaElement;
      textarea.setSelectionRange(0, 5);

      fireEvent.click(screen.getByTitle(/Toggle Bold/));

      expect(tactics.state.texts[0].text).toBe("**Press** high");
    });

    it("deletes the text", () => {
      fireEvent.click(screen.getByTitle("Delete Text"));
      expect(tactics.state.texts).toHaveLength(0);
    });
  });

  it("shows nothing for a selection that no longer exists", () => {
    select("gone", "player");
    expect(screen.queryByText("Nothing Selected")).toBeNull();
    expect(screen.queryByTitle("Delete Player")).toBeNull();
  });
});
