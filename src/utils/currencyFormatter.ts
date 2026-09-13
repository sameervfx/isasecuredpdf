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
};

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: {
    ...STANDARD_USD_CONFIG,
    name: 'USD ($) - United States',
    country: 'United States & Global',
  },
  CAD: {
    ...STANDARD_USD_CONFIG,
    name: 'USD ($) - Canada',
    country: 'Canada',
  },
  EUR: {
    ...STANDARD_USD_CONFIG,
    name: 'USD ($) - European Union',
    country: 'European Union',
  },
  GBP: {
    ...STANDARD_USD_CONFIG,
    name: 'USD ($) - United Kingdom',
    country: 'United Kingdom',
  },
  AUD: {
    ...STANDARD_USD_CONFIG,
    name: 'USD ($) - Australia',
    country: 'Australia & New Zealand',
  },
  INR: {
    ...STANDARD_USD_CONFIG,
    name: 'USD ($) - India',
    country: 'India',
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
 * Automatically detects the user's local currency based on browser language and timezone,
 * or retrieves saved currency preference from localStorage.
 */
export function detectUserCurrency(): string {
  // Enforce USD globally to comply with Google Play Subscriptions Policy (display price must match cart price)
  return 'USD';
}

/**
 * Saves user currency choice to localStorage
 */
export function saveUserCurrency(currencyCode: string): void {
  if (SUPPORTED_CURRENCIES[currencyCode]) {
    localStorage.setItem('isa_user_currency', 'USD');
  }
}

/**
 * Gets pricing details for a given plan and currency code
 */
export function getLocalizedPricing(plan: 'monthly' | 'annual' | 'lifetime', currencyCode: string = 'USD') {
  const currency = SUPPORTED_CURRENCIES.USD;
  const planKey = plan.charAt(0).toUpperCase() + plan.slice(1);
  return {
    formatted: currency[plan],
    symbol: currency.symbol,
    code: currency.code,
    amountNum: currency[`${plan}Num` as keyof CurrencyConfig] as number,
    usdAmountNum: currency[`usd${planKey}Num` as keyof CurrencyConfig] as number,
    usdFormatted: currency[`usd${planKey}Formatted` as keyof CurrencyConfig] as string,
    originalFormatted: undefined,
    discountPercent: undefined,
  };
}
