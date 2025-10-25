export const storage = {
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('[storage] set failed', key, e);
    }
  },
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('[storage] get failed', key, e);
      return null;
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('[storage] remove failed', key, e);
    }
  },
  setJSON(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[storage] setJSON failed', key, e);
    }
  },
  getJSON<T>(key: string): T | null {
    try {
      const val = localStorage.getItem(key);
      return val ? (JSON.parse(val) as T) : null;
    } catch (e) {
      console.warn('[storage] getJSON failed', key, e);
      return null;
    }
  },
};
