export interface SavedWatermark {
  id: string;
  name: string;
  type: 'text' | 'image';
  dataUrl?: string;
  text?: string;
  color?: string;
  opacity: number;
  rotation: number;
  createdAt: number;
}

const STORAGE_KEY = 'isa_saved_watermarks_v1';

export function getSavedWatermarks(): SavedWatermark[] {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json);
  } catch (e) {
    console.warn('Failed to parse saved watermarks:', e);
    return [];
  }
}

export function saveWatermarkToStorage(wm: Omit<SavedWatermark, 'id' | 'createdAt'>): SavedWatermark[] {
  try {
    const list = getSavedWatermarks();
    const newItem: SavedWatermark = {
      ...wm,
      id: `wm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };
    const updated = [newItem, ...list].slice(0, 15);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to save watermark to storage:', e);
    return getSavedWatermarks();
  }
}

export function deleteSavedWatermark(id: string): SavedWatermark[] {
  try {
    const list = getSavedWatermarks();
    const updated = list.filter((w) => w.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to delete saved watermark:', e);
    return getSavedWatermarks();
  }
}
