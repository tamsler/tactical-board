import { useCallback, useEffect, useState } from "react";
import type { useTacticsState } from "./useTacticsState";
import { LIMITS } from "../animation/model";
import { parseProjectJSON } from "../animation/migrate";
import {
  PROJECT_EXTENSION,
  PROJECT_MIME,
  downloadBlob,
  pickOpenFile,
  pickSaveFile,
  slugify,
  supportsFileSystemAccess,
  writeFile,
} from "../utils/fileAccess";
import { track } from "../utils/analytics";
import { showToast } from "../utils/toast";

type Tactics = ReturnType<typeof useTacticsState>;

interface LaunchWindow {
  launchQueue?: {
    setConsumer(
      consumer: (params: { files?: FileSystemFileHandle[] }) => void,
    ): void;
  };
}

// Opened legacy .json boards are never overwritten; the next Save asks for a .tacticalboard file.
const isProjectFile = (handle: FileSystemFileHandle) =>
  handle.name.toLowerCase().endsWith(PROJECT_EXTENSION);

/**
 * Save / Save As / Open for project files. Uses the File System Access API
 * where available and falls back to download and file-input upload.
 */
export function useProjectFile(tactics: Tactics) {
  const { projectDocument, importProject, isPreviewing } = tactics;
  const [handle, setHandle] = useState<FileSystemFileHandle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canPick = supportsFileSystemAccess();

  const contents = useCallback(
    () => JSON.stringify(projectDocument, null, 2),
    [projectDocument],
  );
  const suggestedName = `${slugify(projectDocument.title, "tactics")}${PROJECT_EXTENSION}`;

  const saveAs = useCallback(async () => {
    setError(null);
    if (!canPick) {
      downloadBlob(
        new Blob([contents()], { type: PROJECT_MIME }),
        suggestedName,
      );
      track("export", { format: "json" });
      showToast(`Saved ${suggestedName}`);
      return;
    }
    try {
      const picked = await pickSaveFile(suggestedName);
      if (!picked) return;
      await writeFile(picked, contents());
      setHandle(picked);
      track("export", { format: "json" });
      showToast(`Saved to ${picked.name}`);
    } catch (e) {
      setError(`Could not save the file. ${(e as Error).message ?? ""}`.trim());
    }
  }, [canPick, contents, suggestedName]);

  const save = useCallback(async () => {
    if (!handle) return saveAs();
    setError(null);
    try {
      await writeFile(handle, contents());
      showToast(`Saved to ${handle.name}`);
    } catch (e) {
      setError(`Could not save the file. ${(e as Error).message ?? ""}`.trim());
    }
  }, [handle, contents, saveAs]);

  /** Validates and imports a project file; returns an error message or null. */
  const importFile = useCallback(
    async (file: File): Promise<string | null> => {
      if (isPreviewing) return "Select a frame to edit before opening a file.";
      if (file.size > LIMITS.maxImportBytes) {
        return "This file is too large to be a tactics file.";
      }
      const result = parseProjectJSON(await file.text());
      if (!result.ok) return `Invalid tactics file. ${result.error}`;
      importProject(result.value);
      track("import_tactics", {
        source: "file",
        players: result.value.sequence.frames[0].players.length,
        frames: result.value.sequence.frames.length,
      });
      return null;
    },
    [importProject, isPreviewing],
  );

  /** Returns false when the caller should fall back to a file input. */
  const open = useCallback(async (): Promise<boolean> => {
    if (!canPick) return false;
    setError(null);
    try {
      const picked = await pickOpenFile();
      if (!picked) return true;
      const message = await importFile(picked.file);
      if (message) setError(message);
      else {
        setHandle(isProjectFile(picked.handle) ? picked.handle : null);
        showToast(`Opened ${picked.file.name}`);
      }
    } catch (e) {
      setError(`Could not open the file. ${(e as Error).message ?? ""}`.trim());
    }
    return true;
  }, [canPick, importFile]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (e.shiftKey) void saveAs();
        else void save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save, saveAs]);

  // Files opened from the OS (double-click) when the site is installed as an app.
  useEffect(() => {
    const queue = (window as LaunchWindow).launchQueue;
    if (!queue) return;
    queue.setConsumer(async ({ files }) => {
      const launched = files?.[0];
      if (!launched) return;
      const message = await importFile(await launched.getFile());
      if (message) setError(message);
      else {
        setHandle(canPick && isProjectFile(launched) ? launched : null);
        showToast(`Opened ${launched.name}`);
      }
    });
  }, [importFile, canPick]);

  return {
    fileName: handle?.name ?? null,
    canPick,
    error,
    clearError: () => setError(null),
    save,
    saveAs,
    open,
    importFile,
  };
}
