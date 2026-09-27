export function randomToken(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  // randomUUID is unavailable outside secure contexts (e.g. LAN dev over http).
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function createId(prefix: string): string {
  return `${prefix}-${randomToken()}`;
}
