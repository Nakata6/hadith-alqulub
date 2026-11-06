// All device storage is best-effort. Never prevent play when storage is unavailable.
const memory = new Map<string, string | null>();
export const STORAGE_WARNING_EVENT = "hadith-storage-unavailable";
export const localStore = {
  flush(): boolean {
    for (const [key, value] of Array.from(memory.entries())) {
      if (value === null ? !this.removeItem(key) : !this.setItem(key, value)) return false;
    }
    return true;
  },
  getItem(key: string): string | null {
    if (memory.has(key)) return memory.get(key) ?? null;
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  setItem(key: string, value: string, bufferOnFailure = true): boolean {
    try { window.localStorage.setItem(key, value); memory.delete(key); return true; }
    catch { if (bufferOnFailure) memory.set(key, value); window.dispatchEvent(new Event(STORAGE_WARNING_EVENT)); return false; }
  },
  removeItem(key: string, bufferOnFailure = true): boolean {
    try { window.localStorage.removeItem(key); memory.delete(key); return true; }
    catch { if (bufferOnFailure) memory.set(key, null); window.dispatchEvent(new Event(STORAGE_WARNING_EVENT)); return false; }
  },
};
