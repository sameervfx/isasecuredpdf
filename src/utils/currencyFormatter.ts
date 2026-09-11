// Currency and Pricing Localization Utility for Google Play & Global App Stores Compliance

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
  // Exact USD Equivalent amounts for Helcim USD Merchant Gateway
  usdMonthlyNum: number;
  usdAnnualNum: number;
  usdLifetimeNum: number;
  usdMonthlyFormatted: string;
  usdAnnualFormatted: string;
  usdLifetimeFormatted: string;
  // Optional original (crossed-out) prices & discount badges
  originalMonthly?: string;
  originalAnnual?: string;
  originalLifetime?: string;
  monthlyDiscountPercent?: string;
  annualDiscountPercent?: string;
  lifetimeDiscountPercent?: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'USD ($) - United States',
    country: 'United States & Global',
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
  },
  CAD: {
    code: 'CAD',
    symbol: '$',
    name: 'CAD ($) - Canada',
    country: 'Canada',
    monthly: '$3.99',
    annual: '$39.99',
    lifetime: '$129.99',
    monthlyNum: 3.99,
    annualNum: 39.99,
    lifetimeNum: 129.99,
    usdMonthlyNum: 2.95,
    usdAnnualNum: 29.50,
    usdLifetimeNum: 96.00,
    usdMonthlyFormatted: '$2.95 USD',
    usdAnnualFormatted: '$29.50 USD',
    usdLifetimeFormatted: '$96.00 USD',
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
    usdMonthlyNum: 3.47,
    usdAnnualNum: 34.70,
    usdLifetimeNum: 104.40,
    usdMonthlyFormatted: '$3.47 USD',
    usdAnnualFormatted: '$34.70 USD',
    usdLifetimeFormatted: '$104.40 USD',
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
    usdMonthlyNum: 3.26,
    usdAnnualNum: 32.70,
    usdLifetimeNum: 104.75,
    usdMonthlyFormatted: '$3.26 USD',
    usdAnnualFormatted: '$32.70 USD',
    usdLifetimeFormatted: '$104.75 USD',
  },
  AUD: {
    code: 'AUD',
    symbol: '$',
    name: 'AUD ($) - Australia',
    country: 'Australia & New Zealand',
    monthly: '$4.49',
    annual: '$44.99',
    lifetime: '$149.99',
    monthlyNum: 4.49,
    annualNum: 44.99,
    lifetimeNum: 149.99,
    usdMonthlyNum: 2.99,
    usdAnnualNum: 29.99,
    usdLifetimeNum: 99.99,
    usdMonthlyFormatted: '$2.99 USD',
    usdAnnualFormatted: '$29.99 USD',
    usdLifetimeFormatted: '$99.99 USD',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'INR (₹) - India',
    country: 'India',
    monthly: '₹199',
    annual: '₹1,999',
    lifetime: '₹4,999',
    monthlyNum: 199,
    annualNum: 1999,
    lifetimeNum: 4999,
    usdMonthlyNum: 2.38,
    usdAnnualNum: 23.90,
    usdLifetimeNum: 59.90,
    usdMonthlyFormatted: '$2.38 USD',
    usdAnnualFormatted: '$23.90 USD',
    usdLifetimeFormatted: '$59.90 USD',
    originalMonthly: '₹299',
    originalAnnual: '₹2,999',
    originalLifetime: '₹7,999',
    monthlyDiscountPercent: '33% OFF',
    annualDiscountPercent: '33% OFF',
    lifetimeDiscountPercent: '38% OFF',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'JPY (¥) - Japan',
    country: 'Japan',
    monthly: '¥450',
    annual: '¥4,500',
    lifetime: '¥14,800',
    monthlyNum: 450,
    annualNum: 4500,
    lifetimeNum: 14800,
    usdMonthlyNum: 3.10,
    usdAnnualNum: 31.00,
    usdLifetimeNum: 102.00,
    usdMonthlyFormatted: '$3.10 USD',
    usdAnnualFormatted: '$31.00 USD',
    usdLifetimeFormatted: '$102.00 USD',
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'BRL (R$) - Brazil',
    country: 'Brazil',
    monthly: 'R$14.90',
    annual: 'R$149.90',
    lifetime: 'R$499.90',
    monthlyNum: 14.90,
    annualNum: 149.90,
    lifetimeNum: 499.90,
    usdMonthlyNum: 2.71,
    usdAnnualNum: 27.20,
    usdLifetimeNum: 90.90,
    usdMonthlyFormatted: '$2.71 USD',
    usdAnnualFormatted: '$27.20 USD',
    usdLifetimeFormatted: '$90.90 USD',
  },
  MXN: {
    code: 'MXN',
    symbol: '$',
    name: 'MXN ($) - Mexico',
    country: 'Mexico',
    monthly: '$59',
    annual: '$599',
    lifetime: '$1,999',
    monthlyNum: 59,
    annualNum: 599,
    lifetimeNum: 1999,
    usdMonthlyNum: 3.03,
    usdAnnualNum: 30.70,
    usdLifetimeNum: 102.50,
    usdMonthlyFormatted: '$3.03 USD',
    usdAnnualFormatted: '$30.70 USD',
    usdLifetimeFormatted: '$102.50 USD',
  },
  AED: {
    code: 'AED',
    symbol: 'AED ',
    name: 'AED - United Arab Emirates',
    country: 'UAE & Gulf States',
    monthly: 'AED 11',
    annual: 'AED 110',
    lifetime: 'AED 399.99',
    monthlyNum: 11,
    annualNum: 110,
    lifetimeNum: 399.99,
    usdMonthlyNum: 2.99,
    usdAnnualNum: 29.90,
    usdLifetimeNum: 108.90,
    usdMonthlyFormatted: '$2.99 USD',
    usdAnnualFormatted: '$29.90 USD',
    usdLifetimeFormatted: '$108.90 USD',
  },
};

/**
 * Automatically detects the user's local currency based on browser language and timezone,
 * or retrieves saved currency preference from localStorage.
 */
export function detectUserCurrency(): string {
  try {
    // 0. Check URL query param override first (e.g. ?currency=USD or ?curr=USD)
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCurr = (urlParams.get('currency') || urlParams.get('curr') || '').toUpperCase();
      if (urlCurr && SUPPORTED_CURRENCIES[urlCurr]) {
        return urlCurr;
      }
    }

    // 1. Check saved currency preference in localStorage
    const saved = localStorage.getItem('isa_user_currency');
    if (saved && SUPPORTED_CURRENCIES[saved]) {
      return saved;
    }

    const lang = (navigator.language || '').toLowerCase();
    const timeZone = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();

    // 2. Comprehensive Canadian detection
    if (
      lang.includes('-ca') ||
      lang.startsWith('ca-') ||
      timeZone.includes('canada') ||
      timeZone.includes('toronto') ||
      timeZone.includes('vancouver') ||
      timeZone.includes('edmonton') ||
      timeZone.includes('winnipeg') ||
      timeZone.includes('halifax') ||
      timeZone.includes('regina') ||
      timeZone.includes('st_johns') ||
      timeZone.includes('moncton')
    ) {
      return 'CAD';
    }

    // 3. United Kingdom
    if (lang.includes('gb') || timeZone.includes('london') || timeZone.includes('belfast')) {
      return 'GBP';
    }

    // 4. European Union
    if (
      lang.includes('de') ||
      lang.includes('fr') ||
      lang.includes('es') ||
      lang.includes('it') ||
      lang.includes('nl') ||
      timeZone.includes('europe') ||
      timeZone.includes('berlin') ||
      timeZone.includes('paris') ||
      timeZone.includes('madrid') ||
      timeZone.includes('rome') ||
      timeZone.includes('amsterdam')
    ) {
      return 'EUR';
    }

    // 5. Australia & New Zealand
    if (
      lang.includes('au') ||
      lang.includes('nz') ||
      timeZone.includes('sydney') ||
      timeZone.includes('melbourne') ||
      timeZone.includes('brisbane') ||
      timeZone.includes('perth') ||
      timeZone.includes('auckland')
    ) {
      return 'AUD';
    }

    // 6. India
    if (lang.includes('in') || timeZone.includes('kolkata') || timeZone.includes('calcutta') || timeZone.includes('asia/kolkata')) {
      return 'INR';
    }

    // 7. Japan
    if (lang.includes('ja') || timeZone.includes('tokyo')) {
      return 'JPY';
    }

    // 8. Brazil
    if (lang.includes('pt-br') || timeZone.includes('sao_paulo')) {
      return 'BRL';
    }

    // 9. Mexico
    if (lang.includes('es-mx') || timeZone.includes('mexico')) {
      return 'MXN';
    }

    // 10. UAE & Gulf
    if (lang.includes('ar') || timeZone.includes('dubai') || timeZone.includes('riyadh')) {
      return 'AED';
    }
  } catch (e) {
    console.warn('Currency detection fallback to USD:', e);
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
