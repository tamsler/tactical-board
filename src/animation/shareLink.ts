import { LIMITS, type TacticsDocument } from "./model";
import { parseDocument, type Result } from "./validate";

const PREFIX = "#share=";
const LINK_VERSION = "1";
const MAX_LINK_LENGTH = 2 * 1024 * 1024;
/** Some messaging apps truncate links longer than this. */
export const LONG_LINK_WARNING = 8000;

export function supportsShareLinks(): boolean {
  return (
    typeof CompressionStream === "function" &&
    typeof DecompressionStream === "function"
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return null;
  try {
    const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

async function compress(text: string): Promise<Uint8Array> {
  const stream = new Response(text).body!.pipeThrough(
    new CompressionStream("deflate-raw"),
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// Stops reading once the output exceeds `maxBytes`, so a tiny link cannot expand into a huge document.
async function decompress(
  bytes: Uint8Array,
  maxBytes: number,
): Promise<string | null> {
  const reader = new Response(bytes as BodyInit)
    .body!.pipeThrough(new DecompressionStream("deflate-raw"))
    .getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(out);
}

/** The current page without its fragment or the retired `?animate=1` beta flag. */
function currentPageUrl(): string {
  const url = new URL(window.location.href);
  url.hash = "";
  url.searchParams.delete("animate");
  return url.toString();
}

export async function createShareLink(
  doc: TacticsDocument,
  baseUrl: string = currentPageUrl(),
): Promise<string> {
  const payload = toBase64Url(await compress(JSON.stringify(doc)));
  return `${baseUrl}${PREFIX}${LINK_VERSION}.${payload}`;
}

export function hasShareFragment(hash: string): boolean {
  return hash.startsWith(PREFIX);
}

export async function parseShareFragment(
  hash: string,
): Promise<Result<TacticsDocument>> {
  const invalid = (error: string) => ({ ok: false as const, error });
  if (!hasShareFragment(hash)) return invalid("Not a share link.");
  if (hash.length > MAX_LINK_LENGTH)
    return invalid("This share link is too long.");
  const body = hash.slice(PREFIX.length);
  const dot = body.indexOf(".");
  const version = dot === -1 ? "" : body.slice(0, dot);
  if (version !== LINK_VERSION) {
    return invalid(
      "This share link was made by a different version of the app.",
    );
  }
  const bytes = fromBase64Url(body.slice(dot + 1));
  if (!bytes) return invalid("This share link is damaged.");
  if (!supportsShareLinks())
    return invalid("This browser cannot open share links.");
  const text = await decompress(bytes, LIMITS.maxImportBytes);
  if (text === null) return invalid("This share link is damaged or too large.");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return invalid("This share link is damaged.");
  }
  return parseDocument(raw);
}
