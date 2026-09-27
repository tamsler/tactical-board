export const PROJECT_EXTENSION = ".tacticalboard";
export const PROJECT_MIME = "application/vnd.tacticalboard+json";
/** For file inputs: new project files plus legacy `.json` boards. */
export const PROJECT_ACCEPT = `${PROJECT_EXTENSION},.json,application/json`;

type PickerTypes = {
  description: string;
  accept: Record<string, string[]>;
}[];

const SAVE_TYPES: PickerTypes = [
  {
    description: "Tactical Board project",
    accept: { [PROJECT_MIME]: [PROJECT_EXTENSION] },
  },
];

const OPEN_TYPES: PickerTypes = [
  {
    description: "Tactical Board project",
    accept: {
      [PROJECT_MIME]: [PROJECT_EXTENSION],
      "application/json": [".json"],
    },
  },
];

interface FilePickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName?: string;
    types?: PickerTypes;
  }) => Promise<FileSystemFileHandle>;
  showOpenFilePicker?: (options: {
    types?: PickerTypes;
    multiple?: boolean;
  }) => Promise<FileSystemFileHandle[]>;
}

const pickerWindow = () =>
  (typeof window === "undefined" ? {} : window) as FilePickerWindow;

export function supportsFileSystemAccess(): boolean {
  const w = pickerWindow();
  return (
    typeof w.showSaveFilePicker === "function" &&
    typeof w.showOpenFilePicker === "function"
  );
}

const isAbort = (e: unknown) =>
  e instanceof DOMException && e.name === "AbortError";

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Returns null when the user cancels the picker. */
export async function pickSaveFile(
  suggestedName: string,
): Promise<FileSystemFileHandle | null> {
  try {
    return (await pickerWindow().showSaveFilePicker!({
      suggestedName,
      types: SAVE_TYPES,
    })) as FileSystemFileHandle;
  } catch (e) {
    if (isAbort(e)) return null;
    throw e;
  }
}

/** Returns null when the user cancels the picker. */
export async function pickOpenFile(): Promise<{
  handle: FileSystemFileHandle;
  file: File;
} | null> {
  try {
    const [handle] = await pickerWindow().showOpenFilePicker!({
      types: OPEN_TYPES,
      multiple: false,
    });
    return { handle, file: await handle.getFile() };
  } catch (e) {
    if (isAbort(e)) return null;
    throw e;
  }
}

export async function writeFile(
  handle: FileSystemFileHandle,
  contents: string,
): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(contents);
  await writable.close();
}

export function slugify(title: string, fallback: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}
