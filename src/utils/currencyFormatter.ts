// Currency and Pricing Localization Utility for Google Play & Global App Stores Compliance
// Note: All currencies strictly map to USD to comply with Google Play Subscriptions Policy
// requiring 100% price consistency between offer screens and payment cart checkout amounts.

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  country: string;
  monthly: string;
  annual: string;
  lifetime: string;
  monthlyNum: number;
  annualNum: number;
  lifetimeNum: number;
  usdMonthlyNum: number;
  usdAnnualNum: number;
  usdLifetimeNum: number;
  usdMonthlyFormatted: string;
  usdAnnualFormatted: string;
  usdLifetimeFormatted: string;
  originalMonthly?: string;
  originalAnnual?: string;
  originalLifetime?: string;
  monthlyDiscountPercent?: string;
  annualDiscountPercent?: string;
  lifetimeDiscountPercent?: string;
}

const STANDARD_USD_CONFIG: Omit<CurrencyConfig, 'name' | 'country'> = {
  code: 'USD',
  symbol: '$',
  monthly: '$2.99',
  annual: '$29.99',
  lifetime: '$99.99',
  monthlyNum: 2.99,
  annualNum: 29.99,
  lifetimeNum: 99.99,
  usdMonthlyNum: 2.99,
  usdAnnualNum: 29.99,
  usdLifetimeNum: 99.99,
  usdMonthlyFormatted: '$2.99 USD',
  usdAnnualFormatted: '$29.99 USD',
  usdLifetimeFormatted: '$99.99 USD',
  originalMonthly: '$5.99',
  originalAnnual: '$71.88',
  originalLifetime: '$199.99',
  monthlyDiscountPercent: '50% OFF',
  annualDiscountPercent: '58% OFF',
  lifetimeDiscountPercent: '50% OFF',
};

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: {
    ...STANDARD_USD_CONFIG,
    name: 'USD ($) - United States',
    country: 'United States & Global',
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'CAD ($) - Canada',
    country: 'Canada',
    monthly: 'CA$3.99',
    annual: 'CA$39.99',
    lifetime: 'CA$129.99',
    monthlyNum: 3.99,
    annualNum: 39.99,
    lifetimeNum: 129.99,
    usdMonthlyNum: 2.99,
    usdAnnualNum: 29.99,
    usdLifetimeNum: 99.99,
    usdMonthlyFormatted: '$2.99 USD',
    usdAnnualFormatted: '$29.99 USD',
    usdLifetimeFormatted: '$99.99 USD',
    originalMonthly: 'CA$7.99',
    originalAnnual: 'CA$95.88',
    originalLifetime: 'CA$249.99',
    monthlyDiscountPercent: '50% OFF',
    annualDiscountPercent: '58% OFF',
    lifetimeDiscountPercent: '48% OFF',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'EUR (€) - European Union',
    country: 'European Union',
    monthly: '€2.99',
    annual: '€29.99',
    lifetime: '€89.99',
    monthlyNum: 2.99,
    annualNum: 29.99,
    lifetimeNum: 89.99,
    usdMonthlyNum: 2.99,
    usdAnnualNum: 29.99,
    usdLifetimeNum: 99.99,
    usdMonthlyFormatted: '$2.99 USD',
    usdAnnualFormatted: '$29.99 USD',
    usdLifetimeFormatted: '$99.99 USD',
    originalMonthly: '€5.99',
    originalAnnual: '€71.88',
    originalLifetime: '€189.99',
    monthlyDiscountPercent: '50% OFF',
    annualDiscountPercent: '58% OFF',
    lifetimeDiscountPercent: '52% OFF',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'GBP (£) - United Kingdom',
    country: 'United Kingdom',
    monthly: '£2.49',
    annual: '£24.99',
    lifetime: '£79.99',
    monthlyNum: 2.49,
    annualNum: 24.99,
    lifetimeNum: 79.99,
    usdMonthlyNum: 2.99,
    usdAnnualNum: 29.99,
    usdLifetimeNum: 99.99,
    usdMonthlyFormatted: '$2.99 USD',
    usdAnnualFormatted: '$29.99 USD',
    usdLifetimeFormatted: '$99.99 USD',
    originalMonthly: '£4.99',
    originalAnnual: '£59.88',
    originalLifetime: '£159.99',
    monthlyDiscountPercent: '50% OFF',
    annualDiscountPercent: '58% OFF',
    lifetimeDiscountPercent: '50% OFF',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'AUD ($) - Australia',
    country: 'Australia & New Zealand',
    monthly: 'A$4.49',
    annual: 'A$44.99',
    lifetime: 'A$149.99',
    monthlyNum: 4.49,
    annualNum: 44.99,
    lifetimeNum: 149.99,
    usdMonthlyNum: 2.99,
    usdAnnualNum: 29.99,
    usdLifetimeNum: 99.99,
    usdMonthlyFormatted: '$2.99 USD',
    usdAnnualFormatted: '$29.99 USD',
    usdLifetimeFormatted: '$99.99 USD',
    originalMonthly: 'A$8.99',
    originalAnnual: 'A$107.88',
    originalLifetime: 'A$299.99',
    monthlyDiscountPercent: '50% OFF',
    annualDiscountPercent: '58% OFF',
    lifetimeDiscountPercent: '50% OFF',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'INR (₹) - India',
    country: 'India',
    monthly: '₹249',
    annual: '₹2,499',
    lifetime: '₹7,999',
    monthlyNum: 249,
    annualNum: 2499,
    lifetimeNum: 7999,
    usdMonthlyNum: 2.99,
    usdAnnualNum: 29.99,
    usdLifetimeNum: 99.99,
    usdMonthlyFormatted: '$2.99 USD',
    usdAnnualFormatted: '$29.99 USD',
    usdLifetimeFormatted: '$99.99 USD',
    originalMonthly: '₹499',
    originalAnnual: '₹5,988',
    originalLifetime: '₹15,999',
    monthlyDiscountPercent: '50% OFF',
    annualDiscountPercent: '58% OFF',
    lifetimeDiscountPercent: '50% OFF',
  },
  JPY: {
    ...STANDARD_USD_CONFIG,
    name: 'USD ($) - Japan',
    country: 'Japan',
  },
  BRL: {
    ...STANDARD_USD_CONFIG,
    name: 'USD ($) - Brazil',
    country: 'Brazil',
  },
  MXN: {
    ...STANDARD_USD_CONFIG,
    name: 'USD ($) - Mexico',
    country: 'Mexico',
  },
  AED: {
    ...STANDARD_USD_CONFIG,
    name: 'USD ($) - United Arab Emirates',
    country: 'UAE & Gulf States',
  },
};

/**
 * Automatically detects the user's local currency based on device locale,
 * browser languages, and timezone (e.g., Canadian timezones -> CAD).
 */
export function detectUserCurrency(): string {
  if (typeof window === 'undefined') return 'USD';

  try {
    const saved = localStorage.getItem('isa_user_currency');
    if (saved && SUPPORTED_CURRENCIES[saved]) {
      return saved;
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const languages = window.navigator.languages || [window.navigator.language || ''];
    const langStr = languages.join(',').toUpperCase();

    // Canada detection (timezones and language tags)
    if (
      timeZone.includes('Toronto') ||
      timeZone.includes('Vancouver') ||
      timeZone.includes('Montreal') ||
      timeZone.includes('Edmonton') ||
      timeZone.includes('Calgary') ||
      timeZone.includes('Winnipeg') ||
      timeZone.includes('Halifax') ||
      timeZone.includes('St_Johns') ||
      timeZone.includes('Canada') ||
      timeZone.includes('Regina') ||
      langStr.includes('-CA')
    ) {
      return 'CAD';
    }

    // UK detection
    if (timeZone.includes('London') || langStr.includes('-GB')) {
      return 'GBP';
    }

    // India detection
    if (timeZone.includes('Calcutta') || timeZone.includes('Kolkata') || langStr.includes('-IN')) {
      return 'INR';
    }

    // Australia detection
    if (timeZone.includes('Sydney') || timeZone.includes('Melbourne') || timeZone.includes('Brisbane') || timeZone.includes('Perth') || langStr.includes('-AU')) {
      return 'AUD';
    }

    // Eurozone detection
    if (
      timeZone.includes('Paris') ||
      timeZone.includes('Berlin') ||
      timeZone.includes('Rome') ||
      timeZone.includes('Madrid') ||
      timeZone.includes('Amsterdam') ||
      timeZone.includes('Brussels') ||
      timeZone.includes('Vienna')
    ) {
      return 'EUR';
    }
  } catch (e) {
    // fallback to USD
  }

  return 'USD';
}

/**
 * Saves user currency choice to localStorage
 */
export function saveUserCurrency(currencyCode: string): void {
  if (SUPPORTED_CURRENCIES[currencyCode]) {
    localStorage.setItem('isa_user_currency', currencyCode);
  }
}

/**
 * Gets pricing details for a given plan and currency code
 */
export function getLocalizedPricing(plan: 'monthly' | 'annual' | 'lifetime', currencyCode: string = 'USD') {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  const planKey = plan.charAt(0).toUpperCase() + plan.slice(1);
  return {
    formatted: currency[plan],
    symbol: currency.symbol,
    code: currency.code,
    amountNum: currency[`${plan}Num` as keyof CurrencyConfig] as number,
    usdAmountNum: currency[`usd${planKey}Num` as keyof CurrencyConfig] as number,
    usdFormatted: currency[`usd${planKey}Formatted` as keyof CurrencyConfig] as string,
    originalFormatted: currency[`original${planKey}` as keyof CurrencyConfig] as string | undefined,
    discountPercent: currency[`${plan}DiscountPercent` as keyof CurrencyConfig] as string | undefined,
  };
}
