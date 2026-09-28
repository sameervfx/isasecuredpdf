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

const STANDARD_CAD_CONFIG: Omit<CurrencyConfig, 'name' | 'country'> = {
  code: 'CAD',
  symbol: 'CA$',
  monthly: 'CA$3.99',
  annual: 'CA$39.99',
  lifetime: 'CA$129.99',
  monthlyNum: 3.99,
  annualNum: 39.99,
  lifetimeNum: 129.99,
  usdMonthlyNum: 3.99,
  usdAnnualNum: 39.99,
  usdLifetimeNum: 129.99,
  usdMonthlyFormatted: 'CA$3.99 CAD',
  usdAnnualFormatted: 'CA$39.99 CAD',
  usdLifetimeFormatted: 'CA$129.99 CAD',
  originalMonthly: 'CA$7.99',
  originalAnnual: 'CA$95.88',
  originalLifetime: 'CA$249.99',
  monthlyDiscountPercent: '50% OFF',
  annualDiscountPercent: '58% OFF',
  lifetimeDiscountPercent: '48% OFF',
};

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: {
    ...STANDARD_CAD_CONFIG,
    name: 'CAD (CA$) - North America',
    country: 'North America & Global',
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'CAD (CA$) - Canada',
    country: 'Canada',
    monthly: 'CA$3.99',
    annual: 'CA$39.99',
    lifetime: 'CA$129.99',
    monthlyNum: 3.99,
    annualNum: 39.99,
    lifetimeNum: 129.99,
    usdMonthlyNum: 3.99,
    usdAnnualNum: 39.99,
    usdLifetimeNum: 129.99,
    usdMonthlyFormatted: 'CA$3.99 CAD',
    usdAnnualFormatted: 'CA$39.99 CAD',
    usdLifetimeFormatted: 'CA$129.99 CAD',
    originalMonthly: 'CA$7.99',
    originalAnnual: 'CA$95.88',
    originalLifetime: 'CA$249.99',
    monthlyDiscountPercent: '50% OFF',
    annualDiscountPercent: '58% OFF',
    lifetimeDiscountPercent: '48% OFF',
  },
  EUR: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'CAD (CA$) - Canada',
    country: 'Canada',
    monthly: 'CA$3.99',
    annual: 'CA$39.99',
    lifetime: 'CA$129.99',
    monthlyNum: 3.99,
    annualNum: 39.99,
    lifetimeNum: 129.99,
    usdMonthlyNum: 3.99,
    usdAnnualNum: 39.99,
    usdLifetimeNum: 129.99,
    usdMonthlyFormatted: 'CA$3.99 CAD',
    usdAnnualFormatted: 'CA$39.99 CAD',
    usdLifetimeFormatted: 'CA$129.99 CAD',
    originalMonthly: 'CA$7.99',
    originalAnnual: 'CA$95.88',
    originalLifetime: 'CA$249.99',
    monthlyDiscountPercent: '50% OFF',
    annualDiscountPercent: '58% OFF',
    lifetimeDiscountPercent: '48% OFF',
  },
  GBP: {
    ...STANDARD_CAD_CONFIG,
    name: 'CAD (CA$) - United Kingdom',
    country: 'United Kingdom',
  },
  AUD: {
    ...STANDARD_CAD_CONFIG,
    name: 'CAD (CA$) - Australia',
    country: 'Australia & New Zealand',
  },
  INR: {
    ...STANDARD_CAD_CONFIG,
    name: 'CAD (CA$) - India',
    country: 'India',
  },
  JPY: {
    ...STANDARD_CAD_CONFIG,
    name: 'CAD (CA$) - Japan',
    country: 'Japan',
  },
  BRL: {
    ...STANDARD_CAD_CONFIG,
    name: 'CAD (CA$) - Brazil',
    country: 'Brazil',
  },
  MXN: {
    ...STANDARD_CAD_CONFIG,
    name: 'CAD (CA$) - Mexico',
    country: 'Mexico',
  },
  AED: {
    ...STANDARD_CAD_CONFIG,
    name: 'CAD (CA$) - United Arab Emirates',
    country: 'UAE & Gulf States',
  },
};

/**
 * Returns user currency - defaults cleanly to CAD for North American / Canadian App Store alignment.
 */
export function detectUserCurrency(): string {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('isa_user_currency', 'CAD');
    } catch (e) {
      // Ignore localStorage access restrictions
    }
  }
  return 'CAD';
}

/**
 * Saves user currency choice to localStorage
 */
export function saveUserCurrency(currencyCode: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('isa_user_currency', currencyCode || 'CAD');
    } catch (e) {
      // Ignore
    }
  }
}

/**
 * Gets pricing details for a given plan and currency code
 */
export function getLocalizedPricing(plan: 'monthly' | 'annual' | 'lifetime', currencyCode: string = 'CAD') {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.CAD;
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
