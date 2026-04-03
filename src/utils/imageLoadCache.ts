/**
 * Lightweight in-memory cache of image URLs that have already loaded.
 * Used to avoid showing skeleton again when the same image is shown later (e.g. back navigation).
 * Size-limited to avoid unbounded memory growth.
 */

const MAX_ENTRIES = 80;
const urlOrder: string[] = [];
const loaded = new Set<string>();

export function hasLoaded(url: string): boolean {
  if (!url?.trim()) return false;
  return loaded.has(url.trim());
}

export function markLoaded(url: string): void {
  const u = url?.trim();
  if (!u) return;
  if (loaded.has(u)) {
    // Move to end (most recently used)
    const i = urlOrder.indexOf(u);
    if (i !== -1) {
      urlOrder.splice(i, 1);
      urlOrder.push(u);
    }
    return;
  }
  if (urlOrder.length >= MAX_ENTRIES) {
    const oldest = urlOrder.shift();
    if (oldest) loaded.delete(oldest);
  }
  urlOrder.push(u);
  loaded.add(u);
}
