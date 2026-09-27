const JSON_TYPES = [
  {
    description: "Tactical board project",
    accept: { "application/json": [".json"] },
  },
];

interface FilePickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName?: string;
    types?: typeof JSON_TYPES;
  }) => Promise<FileSystemFileHandle>;
  showOpenFilePicker?: (options: {
    types?: typeof JSON_TYPES;
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
      types: JSON_TYPES,
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
      types: JSON_TYPES,
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
