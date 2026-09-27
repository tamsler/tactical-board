import { useEffect, useRef } from "react";
import type { useTacticsState } from "./useTacticsState";
import { hasShareFragment, parseShareFragment } from "../animation/shareLink";
import { track } from "../utils/analytics";

type Tactics = ReturnType<typeof useTacticsState>;

function clearFragment() {
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", pathname + search);
}

/** Offers to open a board shared via `#share=` once, on page load. */
export function useShareLinkImport(tactics: Tactics) {
  const handled = useRef(false);
  const { importProject } = tactics;

  useEffect(() => {
    if (handled.current || !hasShareFragment(window.location.hash)) return;
    handled.current = true;
    const hash = window.location.hash;
    void parseShareFragment(hash).then((result) => {
      clearFragment();
      if (!result.ok) {
        alert(`This share link could not be opened.\n\n${result.error}`);
        return;
      }
      if (
        !confirm(
          "Open the shared board? This replaces your current board; you can undo.",
        )
      ) {
        return;
      }
      const doc = result.value;
      importProject({
        sequence: { title: doc.title, frames: doc.frames },
        settings: doc.settings,
      });
      track("import_tactics", { players: doc.frames[0].players.length });
    });
  }, [importProject]);
}
