// Monthly Free-Tier Usage Quota Tracker (Sign Document, Split PDF, Add Image / Logo)
// Free Starter users can process up to 5 documents per calendar month before upgrading to Pro.

export const FREE_MONTHLY_DOC_LIMIT = 5;
const STORAGE_KEY = 'isa_monthly_quota_v1';

export type QuotaFeatureType = 'sign' | 'split' | 'image';

interface MonthlyQuotaData {
  monthKey: string; // e.g. "2026-10"
  usedCount: number;
  processedDocTokens: string[];
}

function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function loadQuotaData(): MonthlyQuotaData {
  const currentMonth = getCurrentMonthKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MonthlyQuotaData;
      if (parsed && parsed.monthKey === currentMonth && typeof parsed.usedCount === 'number') {
        return {
          monthKey: currentMonth,
          usedCount: parsed.usedCount,
          processedDocTokens: Array.isArray(parsed.processedDocTokens) ? parsed.processedDocTokens : [],
        };
      }
    }
  } catch (e) {
    // Ignore storage parse errors
  }
  return {
    monthKey: currentMonth,
    usedCount: 0,
    processedDocTokens: [],
  };
}

function saveQuotaData(data: MonthlyQuotaData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // Ignore storage write errors
  }
}

/**
 * Checks if the free user can perform a gated action (Sign, Split, Add Image/Logo).
 * If allowed, records the document usage (counting multiple edits on the same document token as 1 document,
 * or each distinct operation/document up to 5 per month).
 */
export function checkAndConsumeMonthlyQuota(
  isProActive: boolean,
  feature: QuotaFeatureType,
  docIdentifier?: string
): { allowed: boolean; used: number; limit: number; remaining: number } {
  if (isProActive) {
    return { allowed: true, used: 0, limit: FREE_MONTHLY_DOC_LIMIT, remaining: FREE_MONTHLY_DOC_LIMIT };
  }

  const data = loadQuotaData();
  const token = docIdentifier ? `${feature}:${docIdentifier}` : `${feature}:${Date.now()}`;

  // If this exact document was already counted for this feature in the current month, allow additional stamps/signatures on the same document
  if (docIdentifier && data.processedDocTokens.includes(token)) {
    return {
      allowed: true,
      used: data.usedCount,
      limit: FREE_MONTHLY_DOC_LIMIT,
      remaining: Math.max(0, FREE_MONTHLY_DOC_LIMIT - data.usedCount),
    };
  }

  if (data.usedCount >= FREE_MONTHLY_DOC_LIMIT) {
    return {
      allowed: false,
      used: data.usedCount,
      limit: FREE_MONTHLY_DOC_LIMIT,
      remaining: 0,
    };
  }

  data.usedCount += 1;
  if (docIdentifier) {
    data.processedDocTokens.push(token);
  }
  saveQuotaData(data);

  return {
    allowed: true,
    used: data.usedCount,
    limit: FREE_MONTHLY_DOC_LIMIT,
    remaining: Math.max(0, FREE_MONTHLY_DOC_LIMIT - data.usedCount),
  };
}

/**
 * Peek at current monthly usage without incrementing the counter.
 */
export function canUseMonthlyQuotaFeature(
  isProActive: boolean,
  feature: QuotaFeatureType,
  docIdentifier?: string
): boolean {
  if (isProActive) return true;
  const data = loadQuotaData();
  const token = docIdentifier ? `${feature}:${docIdentifier}` : '';
  if (token && data.processedDocTokens.includes(token)) {
    return true;
  }
  return data.usedCount < FREE_MONTHLY_DOC_LIMIT;
}

export function getMonthlyQuotaStatus(): { used: number; limit: number; remaining: number } {
  const data = loadQuotaData();
  return {
    used: data.usedCount,
    limit: FREE_MONTHLY_DOC_LIMIT,
    remaining: Math.max(0, FREE_MONTHLY_DOC_LIMIT - data.usedCount),
  };
}
