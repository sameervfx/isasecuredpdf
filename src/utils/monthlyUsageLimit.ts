// Usage Quota Tracker (Save, Export, Sign, Split, Add Image / Logo, Scanner)
// Free Starter users can process up to 5 documents per 3-month period (90 days) before upgrading to Pro.

export const FREE_DOC_LIMIT_PER_PERIOD = 5;
export const FREE_MONTHLY_DOC_LIMIT = 5; // Retained for backwards compatibility
const STORAGE_KEY = 'isa_usage_quota_v2';
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

export type QuotaFeatureType = 'sign' | 'split' | 'image' | 'save' | 'scan_export' | 'export';

interface QuotaData {
  periodStart: number; // Timestamp when the 3-month window started
  usedCount: number;
  processedDocTokens: string[];
}

function loadQuotaData(): QuotaData {
  const now = Date.now();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as QuotaData;
      // Check if current 90-day (3 months) period is still active
      if (parsed && typeof parsed.periodStart === 'number' && (now - parsed.periodStart) < NINETY_DAYS_MS) {
        return {
          periodStart: parsed.periodStart,
          usedCount: typeof parsed.usedCount === 'number' ? parsed.usedCount : 0,
          processedDocTokens: Array.isArray(parsed.processedDocTokens) ? parsed.processedDocTokens : [],
        };
      }
    }
  } catch (e) {
    // Ignore storage parse errors
  }

  // Brand new or refreshed 3-month period
  return {
    periodStart: now,
    usedCount: 0,
    processedDocTokens: [],
  };
}

function saveQuotaData(data: QuotaData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // Ignore storage write errors
  }
}

/**
 * Checks if the free user can perform a gated action (Sign, Split, Add Image/Logo, Save, Scan Export).
 * If allowed, records document usage (5 documents per 3 months).
 */
export function checkAndConsumeMonthlyQuota(
  isProActive: boolean,
  feature: QuotaFeatureType,
  docIdentifier?: string
): { allowed: boolean; used: number; limit: number; remaining: number } {
  if (isProActive) {
    return { allowed: true, used: 0, limit: FREE_DOC_LIMIT_PER_PERIOD, remaining: FREE_DOC_LIMIT_PER_PERIOD };
  }

  const data = loadQuotaData();
  const token = docIdentifier ? `doc:${docIdentifier}` : `${feature}:${Date.now()}`;

  // If this exact document was already counted in the current 3-month period, allow edits/stamps on it
  if (docIdentifier && data.processedDocTokens.includes(token)) {
    return {
      allowed: true,
      used: data.usedCount,
      limit: FREE_DOC_LIMIT_PER_PERIOD,
      remaining: Math.max(0, FREE_DOC_LIMIT_PER_PERIOD - data.usedCount),
    };
  }

  if (data.usedCount >= FREE_DOC_LIMIT_PER_PERIOD) {
    return {
      allowed: false,
      used: data.usedCount,
      limit: FREE_DOC_LIMIT_PER_PERIOD,
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
    limit: FREE_DOC_LIMIT_PER_PERIOD,
    remaining: Math.max(0, FREE_DOC_LIMIT_PER_PERIOD - data.usedCount),
  };
}

/**
 * Peek at current 3-month usage without incrementing the counter.
 */
export function canUseMonthlyQuotaFeature(
  isProActive: boolean,
  feature: QuotaFeatureType,
  docIdentifier?: string
): boolean {
  if (isProActive) return true;
  const data = loadQuotaData();
  const token = docIdentifier ? `doc:${docIdentifier}` : '';
  if (token && data.processedDocTokens.includes(token)) {
    return true;
  }
  return data.usedCount < FREE_DOC_LIMIT_PER_PERIOD;
}

export function getMonthlyQuotaStatus(): { used: number; limit: number; remaining: number; daysRemaining: number } {
  const data = loadQuotaData();
  const elapsed = Date.now() - data.periodStart;
  const daysRemaining = Math.max(1, Math.ceil((NINETY_DAYS_MS - elapsed) / (24 * 60 * 60 * 1000)));
  return {
    used: data.usedCount,
    limit: FREE_DOC_LIMIT_PER_PERIOD,
    remaining: Math.max(0, FREE_DOC_LIMIT_PER_PERIOD - data.usedCount),
    daysRemaining,
  };
}
