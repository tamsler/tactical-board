import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { parseProjectJSON, toDocument } from "../animation/migrate";
import { createShareLink } from "../animation/shareLink";
import { recordEvents, stopRecording } from "../utils/analyticsRecorder";
import { dismissToast, toastStore } from "../utils/toast";
import { useShareLinkImport } from "./useShareLinkImport";
import { useTacticsState } from "./useTacticsState";

const example = Object.values(
  import.meta.glob<string>(
    "../../docs/agent/examples/minimal-wall-pass.tacticalboard",
    { query: "?raw", import: "default", eager: true },
  ),
)[0];

const parsed = parseProjectJSON(example);
if (!parsed.ok) throw new Error(parsed.error);
const doc = toDocument(parsed.value.sequence, parsed.value.settings!);

async function openLink() {
  const link = await createShareLink(doc, "http://localhost/");
  window.location.hash = link.slice(link.indexOf("#"));
  return renderHook(() => {
    const tactics = useTacticsState();
    useShareLinkImport(tactics);
    return tactics;
  });
}

describe("useShareLinkImport", () => {
  beforeEach(() => {
    localStorage.clear();
    toastStore.getSnapshot().forEach((t) => dismissToast(t.id));
  });

  afterEach(() => {
    stopRecording();
    vi.restoreAllMocks();
    window.location.hash = "";
  });

  it("reports an accepted share link with its source and counts", async () => {
    const events = recordEvents();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const { result } = await openLink();

    await waitFor(() => expect(result.current.state.title).toBe(doc.title));
    expect(events).toEqual([
      {
        name: "import_tactics",
        params: {
          source: "share_link",
          players: doc.frames[0].players.length,
          frames: doc.frames.length,
        },
      },
    ]);
  });

  it("reports nothing when the coach declines", async () => {
    const events = recordEvents();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    const { result } = await openLink();

    await waitFor(() => expect(confirm).toHaveBeenCalled());
    expect(result.current.state.title).not.toBe(doc.title);
    expect(events).toEqual([]);
  });
});
