import { useCallback, useEffect, useState } from "react";
import type { useTacticsState } from "./useTacticsState";
import { LIMITS } from "../animation/model";
import { parseProjectJSON } from "../animation/migrate";
import {
  downloadBlob,
  pickOpenFile,
  pickSaveFile,
  slugify,
  supportsFileSystemAccess,
  writeFile,
} from "../utils/fileAccess";
import { track } from "../utils/analytics";

type Tactics = ReturnType<typeof useTacticsState>;

/**
 * Save / Save As / Open for project files. Uses the File System Access API
 * where available and falls back to download and file-input upload.
 * With `enabled: false` there is no file picker and no Ctrl/Cmd+S shortcut.
 */
export function useProjectFile(
  tactics: Tactics,
  { enabled }: { enabled: boolean },
) {
  const { projectDocument, importProject, isPreviewing } = tactics;
  const [handle, setHandle] = useState<FileSystemFileHandle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canPick = enabled && supportsFileSystemAccess();

  const contents = useCallback(
    () => JSON.stringify(projectDocument, null, 2),
    [projectDocument],
  );
  const suggestedName = `${slugify(projectDocument.title, "tactics")}.json`;

  const saveAs = useCallback(async () => {
    setError(null);
    if (!canPick) {
      downloadBlob(
        new Blob([contents()], { type: "application/json" }),
        suggestedName,
      );
      track("export", { format: "json" });
      return;
    }
    try {
      const picked = await pickSaveFile(suggestedName);
      if (!picked) return;
      await writeFile(picked, contents());
      setHandle(picked);
      track("export", { format: "json" });
    } catch (e) {
      setError(`Could not save the file. ${(e as Error).message ?? ""}`.trim());
    }
  }, [canPick, contents, suggestedName]);

  const save = useCallback(async () => {
    if (!handle) return saveAs();
    setError(null);
    try {
      await writeFile(handle, contents());
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
        players: result.value.sequence.frames[0].players.length,
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
      else setHandle(picked.handle);
    } catch (e) {
      setError(`Could not open the file. ${(e as Error).message ?? ""}`.trim());
    }
    return true;
  }, [canPick, importFile]);

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (e.shiftKey) void saveAs();
        else void save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, save, saveAs]);

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
