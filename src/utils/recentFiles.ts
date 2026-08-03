export interface RecentFileItem {
  id: string;
  name: string;
  timestamp: number;
  dataUrl?: string; // Small base64 snippet or key if small
}

const RECENT_FILES_KEY = 'isa_pdf_recent_files_v1';
const MAX_RECENT_FILES = 5;

export const getRecentFiles = (): RecentFileItem[] => {
  try {
    const raw = localStorage.getItem(RECENT_FILES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load recent files history:', e);
    return [];
  }
};

export const addRecentFile = (name: string, dataUrl?: string) => {
  try {
    const current = getRecentFiles();
    const filtered = current.filter((f) => f.name !== name);
    const newItem: RecentFileItem = {
      id: Date.now().toString(),
      name,
      timestamp: Date.now(),
      dataUrl: dataUrl && dataUrl.length < 500000 ? dataUrl : undefined,
    };
    const updated = [newItem, ...filtered].slice(0, MAX_RECENT_FILES);
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save recent file:', e);
    return [];
  }
};

export const clearRecentFiles = () => {
  try {
    localStorage.removeItem(RECENT_FILES_KEY);
  } catch (e) {
    console.error('Failed to clear recent files:', e);
  }
};
