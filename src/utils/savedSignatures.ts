export interface SavedSignature {
  id: string;
  dataUrl: string;
  createdAt: number;
}

const STORAGE_KEY = 'isa_saved_signatures_v1';

export function getSavedSignatures(): SavedSignature[] {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json);
  } catch (e) {
    console.warn('Failed to parse saved signatures:', e);
    return [];
  }
}

export function saveSignatureToStorage(dataUrl: string): SavedSignature[] {
  try {
    const list = getSavedSignatures();
    // Don't add duplicate dataUrl
    if (list.some((s) => s.dataUrl === dataUrl)) return list;

    const newItem: SavedSignature = {
      id: `saved_sig_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dataUrl,
      createdAt: Date.now(),
    };

    const updated = [newItem, ...list].slice(0, 10); // Keep top 10
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to save signature to storage:', e);
    return getSavedSignatures();
  }
}

export function deleteSavedSignature(id: string): SavedSignature[] {
  try {
    const list = getSavedSignatures();
    const updated = list.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to delete saved signature:', e);
    return getSavedSignatures();
  }
}
