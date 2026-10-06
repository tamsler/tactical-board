import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTacticsState } from "./useTacticsState";
import { useProjectFile } from "./useProjectFile";
import { recordEvents, stopRecording } from "../utils/analyticsRecorder";

const legacyBoard = {
  players: [
    {
      id: "p1",
      team: "A",
      number: "9",
      x: 10,
      y: 20,
      color: "#f00",
      textColor: "#fff",
    },
  ],
  balls: [],
  title: "Old corner",
};

function setup() {
  return renderHook(() => {
    const tactics = useTacticsState();
    const file = useProjectFile(tactics);
    return { tactics, file };
  });
}

describe("useProjectFile", () => {
  let downloads: { name: string; type: string }[];

  beforeEach(() => {
    localStorage.clear();
    downloads = [];
    let lastBlob: Blob | null = null;
    vi.spyOn(URL, "createObjectURL").mockImplementation((b) => {
      lastBlob = b as Blob;
      return "blob:test";
    });
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloads.push({ name: this.download, type: lastBlob?.type ?? "" });
    });
  });

  afterEach(() => {
    stopRecording();
    vi.restoreAllMocks();
    delete (window as { launchQueue?: unknown }).launchQueue;
  });

  it("saves projects as .tacticalboard files", async () => {
    const { result } = setup();
    act(() =>
      result.current.tactics.pushState((p) => ({ ...p, title: "Press Plan" })),
    );
    await act(() => result.current.file.saveAs());
    expect(downloads).toEqual([
      {
        name: "press-plan.tacticalboard",
        type: "application/vnd.tacticalboard+json",
      },
    ]);
  });

  it("opens legacy .json boards and new .tacticalboard files", async () => {
    const { result } = setup();
    let message: string | null = "unset";
    await act(async () => {
      message = await result.current.file.importFile(
        new File([JSON.stringify(legacyBoard)], "old-corner.json"),
      );
    });
    expect(message).toBeNull();
    expect(result.current.tactics.state.title).toBe("Old corner");

    const project = JSON.stringify(result.current.tactics.projectDocument);
    await act(async () => {
      message = await result.current.file.importFile(
        new File([project], "saved.tacticalboard"),
      );
    });
    expect(message).toBeNull();
  });

  it("imports a file launched from the operating system", async () => {
    let consumer: ((p: { files?: FileSystemFileHandle[] }) => void) | undefined;
    (window as { launchQueue?: unknown }).launchQueue = {
      setConsumer: (c: typeof consumer) => {
        consumer = c;
      },
    };
    const { result } = setup();
    const handle = {
      name: "old-corner.tacticalboard",
      getFile: async () =>
        new File([JSON.stringify(legacyBoard)], "old-corner.tacticalboard"),
    } as unknown as FileSystemFileHandle;
    await act(async () => {
      consumer?.({ files: [handle] });
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.tactics.state.title).toBe("Old corner");
  });

  describe("usage events", () => {
    const imports = (events: ReturnType<typeof recordEvents>) =>
      events.filter((e) => e.name === "import_tactics");

    it("reports a legacy board as one frame opened from a file", async () => {
      const { result } = setup();
      const events = recordEvents();
      await act(async () => {
        await result.current.file.importFile(
          new File([JSON.stringify(legacyBoard)], "old-corner.json"),
        );
      });
      expect(imports(events)).toEqual([
        {
          name: "import_tactics",
          params: { source: "file", players: 1, frames: 1 },
        },
      ]);
    });

    it("reports the frame and player counts of a project file", async () => {
      const { result } = setup();
      act(() => result.current.tactics.addFrame());
      act(() => result.current.tactics.addFrame());
      const project = JSON.stringify(result.current.tactics.projectDocument);
      const events = recordEvents();

      await act(async () => {
        await result.current.file.importFile(
          new File([project], "plan.tacticalboard"),
        );
      });

      expect(imports(events)).toEqual([
        {
          name: "import_tactics",
          params: { source: "file", players: 22, frames: 3 },
        },
      ]);
    });

    it("reports nothing for a rejected file", async () => {
      const { result } = setup();
      const events = recordEvents();
      let message: string | null = null;
      await act(async () => {
        message = await result.current.file.importFile(
          new File(["not a board"], "notes.json"),
        );
      });
      expect(message).toContain("Invalid tactics file");
      expect(events).toEqual([]);
    });
  });
});
