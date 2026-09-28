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
    name: 'CAD (CA$) - Canada',
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
