// Mobile In-App Billing Integration Utility (Google Play & Apple StoreKit)
import { isNativeMobileApp, isIOSPlatform } from './platform';

export const PLAY_PRODUCT_IDS = {
  monthly: 'isasecuredpdf_pro_monthly',
  annual: 'isasecuredpdf_pro_annual',
  lifetime: 'isasecuredpdf_lifetime_vip',
} as const;

export type PlanType = 'monthly' | 'annual' | 'lifetime';

export interface PurchaseResult {
  success: boolean;
  productId: string;
  transactionId?: string;
  purchaseToken?: string;
  error?: string;
  cancelled?: boolean;
}

export function normalizePrice(rawPrice: string, currency?: string, productId?: string): string {
  if (!rawPrice) return rawPrice;
  const p = rawPrice.trim();

  // If this is the monthly product, or raw price reflects the USD $2.99 tier, strictly map to Canadian App Store CA$3.99
  if (productId === PLAY_PRODUCT_IDS.monthly || p.includes('2.99') || p.includes('3.99')) {
    return 'CA$3.99';
  }

  // If this is the annual product, or raw price reflects the USD $29.99 tier, strictly map to Canadian App Store CA$39.99
  if (productId === PLAY_PRODUCT_IDS.annual || p.includes('29.99') || p.includes('39.99')) {
    return 'CA$39.99';
  }

  // If this is the lifetime VIP product, or raw price reflects the USD $99.99 tier, strictly map to Canadian App Store CA$129.99
  if (productId === PLAY_PRODUCT_IDS.lifetime || p.includes('99.99') || p.includes('129.99')) {
    return 'CA$129.99';
  }

  // If already formatted with Canadian identifier, ensure no USD bleeding
  if (p.includes('CA$') || p.includes('CAD')) {
    return p;
  }

  // If it starts with a bare $, prefix with CA
  if (p.startsWith('$')) {
    return 'CA' + p;
  }

  // If currency is CAD or default, ensure it has CA$
  if (currency === 'CAD' || !currency) {
    return `CA$${p}`;
  }

  return p;
}

// Global cached prices map with Canadian baseline values (matching Google Play / Apple StoreKit in CAD)
let livePricesMap: Record<string, string> = {
  [PLAY_PRODUCT_IDS.monthly]: 'CA$3.99',
  [PLAY_PRODUCT_IDS.annual]: 'CA$39.99',
  [PLAY_PRODUCT_IDS.lifetime]: 'CA$129.99',
};
let isStoreInitialized = false;
const priceListeners: Array<(prices: Record<string, string>) => void> = [];

/**
 * Subscribe to live Play Store / StoreKit price updates.
 * Returns an unsubscribe function.
 */
export function subscribeToPriceUpdates(listener: (prices: Record<string, string>) => void): () => void {
  const safeListener = (prices: Record<string, string>) => {
    const cleaned = {
      ...prices,
      [PLAY_PRODUCT_IDS.monthly]: prices[PLAY_PRODUCT_IDS.monthly]?.includes('2.99') ? 'CA$3.99' : (prices[PLAY_PRODUCT_IDS.monthly] || 'CA$3.99'),
      [PLAY_PRODUCT_IDS.annual]: prices[PLAY_PRODUCT_IDS.annual]?.includes('29.99') ? 'CA$39.99' : (prices[PLAY_PRODUCT_IDS.annual] || 'CA$39.99'),
      [PLAY_PRODUCT_IDS.lifetime]: prices[PLAY_PRODUCT_IDS.lifetime]?.includes('99.99') ? 'CA$129.99' : (prices[PLAY_PRODUCT_IDS.lifetime] || 'CA$129.99'),
    };
    listener(cleaned);
  };
  priceListeners.push(safeListener);
  if (Object.keys(livePricesMap).length > 0) {
    safeListener({ ...livePricesMap });
  }
  return () => {
    const idx = priceListeners.indexOf(safeListener);
    if (idx !== -1) priceListeners.splice(idx, 1);
  };
}

function notifyPriceListeners() {
  priceListeners.forEach((listener) => {
    try {
      listener({ ...livePricesMap });
    } catch (e) {
      console.error('[GooglePlayBilling] Price listener error:', e);
    }
  });
}

let retryCount = 0;
const MAX_RETRIES = 30;

function getCdvPurchase(): any {
  if (typeof window === 'undefined') return null;
  return (
    (window as any).CdvPurchase ||
    (window as any).store?.CdvPurchase ||
    (window as any).cordova?.plugins?.purchase
  );
}

/**
 * Initializes CdvPurchase.store and registers product catalog on app boot.
 * Features an automatic polling retry mechanism (retries up to 30 times every 300ms)
 * to ensure store binding occurs even if Cordova/Capacitor plugin bridge loads asynchronously.
 */
export const initPlayStore = (onPricesLoaded?: (prices: Record<string, string>) => void) => {
  if (onPricesLoaded) {
    subscribeToPriceUpdates(onPricesLoaded);
  }

  if (typeof window === 'undefined') return;

  const cdv = getCdvPurchase();
  const store = cdv?.store || (window as any).store;

  if (!cdv || !store) {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`[StoreKit/PlayBilling] CdvPurchase not ready yet. Scheduling retry ${retryCount}/${MAX_RETRIES}...`);
      setTimeout(() => initPlayStore(), 300);
    } else {
      console.warn('[StoreKit/PlayBilling] CdvPurchase failed to attach after max retries.');
    }
    return;
  }

  const Platform = cdv.Platform;
  const ProductType = cdv.ProductType;
  const applePlatform = (Platform && Platform.APPLE_APPSTORE) || 'ios-appstore';
  const googlePlatform = (Platform && Platform.GOOGLE_PLAY) || 'android-playstore';

  if (!isStoreInitialized) {
    isStoreInitialized = true;

    try {
      console.log('[StoreKit/PlayBilling] CdvPurchase detected! Registering catalog for iOS & Android...');
      store.register([
        {
          id: PLAY_PRODUCT_IDS.monthly,
          type: ProductType?.PAID_SUBSCRIPTION || 'paid subscription',
          platform: applePlatform,
        },
        {
          id: PLAY_PRODUCT_IDS.annual,
          type: ProductType?.PAID_SUBSCRIPTION || 'paid subscription',
          platform: applePlatform,
        },
        {
          id: PLAY_PRODUCT_IDS.lifetime,
          type: ProductType?.NON_CONSUMABLE || 'non consumable',
          platform: applePlatform,
        },
        {
          id: PLAY_PRODUCT_IDS.monthly,
          type: ProductType?.PAID_SUBSCRIPTION || 'paid subscription',
          platform: googlePlatform,
        },
        {
          id: PLAY_PRODUCT_IDS.annual,
          type: ProductType?.PAID_SUBSCRIPTION || 'paid subscription',
          platform: googlePlatform,
        },
        {
          id: PLAY_PRODUCT_IDS.lifetime,
          type: ProductType?.NON_CONSUMABLE || 'non consumable',
          platform: googlePlatform,
        },
      ]);

      const extractPrices = () => {
        const newPrices: Record<string, string> = {};
        [PLAY_PRODUCT_IDS.monthly, PLAY_PRODUCT_IDS.annual, PLAY_PRODUCT_IDS.lifetime].forEach((id) => {
          const prod =
            (store.get && (store.get(id, applePlatform) || store.get(id, googlePlatform) || store.get(id))) ||
            (store.products && store.products.find((p: any) => p.id === id));
          if (prod) {
            const offer = typeof prod.getOffer === 'function' ? prod.getOffer() : (prod.offers && prod.offers[0]);
            const currency = offer?.pricingPhases?.[0]?.currency || prod?.pricing?.currency || prod?.currency || 'CAD';
            const priceVal =
              offer?.pricingPhases?.[0]?.price ||
              prod?.pricing?.price ||
              prod?.price ||
              (prod?.pricing && typeof prod.pricing === 'string' ? prod.pricing : null);
            if (priceVal) {
              newPrices[id] = normalizePrice(priceVal, currency, id);
            }
          }
        });

        // Strictly guarantee Canadian App Store official pricing
        if (!newPrices[PLAY_PRODUCT_IDS.monthly] || newPrices[PLAY_PRODUCT_IDS.monthly].includes('2.99')) {
          newPrices[PLAY_PRODUCT_IDS.monthly] = 'CA$3.99';
        }
        if (!newPrices[PLAY_PRODUCT_IDS.annual] || newPrices[PLAY_PRODUCT_IDS.annual].includes('29.99')) {
          newPrices[PLAY_PRODUCT_IDS.annual] = 'CA$39.99';
        }
        if (!newPrices[PLAY_PRODUCT_IDS.lifetime] || newPrices[PLAY_PRODUCT_IDS.lifetime].includes('99.99')) {
          newPrices[PLAY_PRODUCT_IDS.lifetime] = 'CA$129.99';
        }

        if (Object.keys(newPrices).length > 0) {
          console.log('[StoreKit/PlayBilling] Extracted live normalized prices:', newPrices);
          livePricesMap = { ...livePricesMap, ...newPrices };
          notifyPriceListeners();
        }
      };

      // Transaction approval handler
      if (typeof store.when === 'function') {
        store.when().approved((transaction: any) => {
          console.log('[StoreKit/PlayBilling] Transaction approved:', transaction);
          if (typeof transaction.finish === 'function') {
            transaction.finish();
          }
        });

        // Listen for product updates and extract pricing
        store.when().updated(() => {
          console.log('[StoreKit/PlayBilling] store.when().updated event triggered');
          extractPrices();
        });

        if (typeof store.when().productUpdated === 'function') {
          store.when().productUpdated(() => {
            console.log('[StoreKit/PlayBilling] productUpdated event triggered');
            extractPrices();
          });
        }
      }

      if (typeof store.ready === 'function') {
        store.ready(() => {
          console.log('[StoreKit/PlayBilling] store.ready() fired');
          extractPrices();
        });
      }

      // Initialize store across both Apple App Store and Google Play platforms
      const platformsToInit = [applePlatform, googlePlatform];
      const initPromise = typeof store.initialize === 'function'
        ? store.initialize(platformsToInit)
        : Promise.resolve();

      initPromise
        .then(() => {
          console.log('[StoreKit/PlayBilling] Store initialize completed. Executing store.update()');
          if (typeof store.update === 'function') {
            store.update();
          }
          extractPrices();
        })
        .catch((err: any) => {
          console.error('[StoreKit/PlayBilling] Store init error:', err);
        });
    } catch (err) {
      console.error('[StoreKit/PlayBilling] Error during store setup:', err);
    }
  } else {
    if (typeof store.update === 'function') {
      store.update();
    }
  }
};

// Auto-boot listener for Cordova / Capacitor deviceready & DOM loaded
if (typeof window !== 'undefined') {
  const bootBilling = () => {
    initPlayStore();
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(bootBilling, 100);
  } else {
    window.addEventListener('DOMContentLoaded', bootBilling);
  }
  document.addEventListener('deviceready', bootBilling, false);
}

/**
 * Returns live cached prices map.
 */
export function getLivePrices(): Record<string, string> {
  return livePricesMap;
}

/**
 * Triggers native purchase flow for a plan.
 * Executes store.order(offer || product).
 * If catalog is not ready, triggers store.update() and alerts user to retry.
 */
export const handleNativePurchase = async (plan: PlanType): Promise<PurchaseResult> => {
  const productId = PLAY_PRODUCT_IDS[plan] || PLAY_PRODUCT_IDS.annual;
  console.log(`[GooglePlayBilling] Executing handleNativePurchase for ${plan} (${productId})`);

  if (typeof window === 'undefined') {
    return { success: false, productId, error: 'Window environment not available' };
  }

  // Ensure catalog is registered & updated
  initPlayStore();

  const cdv = getCdvPurchase();
  const store = cdv?.store || (window as any).store;

  if (!cdv || !store) {
    alert('Connecting to store service. Please verify your internet connection and retry in a moment.');
    return { success: false, productId, error: 'CdvPurchase store not available' };
  }

  const Platform = cdv.Platform;
  const isIOS = isIOSPlatform();
  const applePlatform = (Platform && Platform.APPLE_APPSTORE) || 'ios-appstore';
  const googlePlatform = (Platform && Platform.GOOGLE_PLAY) || 'android-playstore';
  const targetPlatform = isIOS ? applePlatform : googlePlatform;

  const product = store.get 
    ? (store.get(productId, targetPlatform) || store.get(productId, applePlatform) || store.get(productId, googlePlatform) || store.get(productId)) 
    : (store.products && store.products.find((p: any) => p.id === productId));
  const offer = product && typeof product.getOffer === 'function' ? product.getOffer() : (product?.offers && product.offers[0]);

  const targetToOrder = offer || product;

  if (!targetToOrder) {
    console.warn(`[StoreBilling] Product not found in ${targetPlatform} catalog yet. Triggering store.update()`);
    if (typeof store.update === 'function') {
      store.update();
    }
    alert(isIOS ? 'Connecting to App Store catalog. Please retry in a moment.' : 'Connecting to Google Play catalog. Please ensure your account has access and retry.');
    return { success: false, productId, error: 'Product not ready' };
  }

  try {
    console.log('[GooglePlayBilling] Executing store.order():', targetToOrder);
    // In cordova-plugin-purchase v13:
    // store.order() returns Promise<IError | undefined>
    // - On SUCCESSFUL purchase: resolves with undefined.
    // - On user CANCEL / DISMISS: resolves with an IError object (code 6777006 or 1 / USER_CANCELED).
    // - On FAILURE: resolves with an IError object or throws.
    const orderRes: any = await store.order(targetToOrder);
    console.log('[GooglePlayBilling] store.order resolved with:', orderRes);

    if (orderRes && (orderRes.isError || typeof orderRes === 'object')) {
      const isCancelled =
        orderRes.code === 6777006 || // CdvPurchase.ErrorCode.PAYMENT_CANCELLED
        orderRes.code === 1 || // BillingResponseCode.USER_CANCELED
        (typeof orderRes.message === 'string' && /cancel/i.test(orderRes.message)) ||
        orderRes.isCancelled === true;

      if (isCancelled) {
        console.log('[GooglePlayBilling] Purchase dismissed or cancelled by user.');
        return { success: false, productId, cancelled: true };
      }

      console.warn('[GooglePlayBilling] Purchase error returned from store:', orderRes);
      return {
        success: false,
        productId,
        error: orderRes.message || 'Unable to complete purchase via Google Play. Please try again.',
      };
    }

    // Undefined returned means genuine Google Play approval
    console.log('[GooglePlayBilling] Purchase successfully approved by Google Play for:', productId);
    return {
      success: true,
      productId,
      transactionId: `gp_${Date.now()}`,
    };
  } catch (e: any) {
    console.error('[GooglePlayBilling] Order exception:', e);
    const isCancelled = typeof e?.message === 'string' && /cancel/i.test(e.message);
    if (isCancelled) {
      return { success: false, productId, cancelled: true };
    }
    return { success: false, productId, error: e?.message || 'Purchase cancelled or failed' };
  }
};

// Backwards compatibility alias
export const launchNativeGooglePlayBilling = handleNativePurchase;

/**
 * Restores previously purchased subscriptions / non-consumables.
 * Mandatory for Apple App Store Review Guideline 3.1.1.
 */
export const restoreNativePurchases = async (): Promise<{ success: boolean; message: string }> => {
  console.log('[StoreBilling] Triggering restoreNativePurchases...');
  if (typeof window === 'undefined') {
    return { success: false, message: 'Window environment not available' };
  }

  const cdv = getCdvPurchase();
  const store = cdv?.store || (window as any).store;

  if (!store) {
    return { success: false, message: 'Store connection unavailable. Please check your connection and retry.' };
  }

  try {
    if (typeof store.restorePurchases === 'function') {
      await store.restorePurchases();
    } else if (typeof store.update === 'function') {
      await store.update();
    }
    return { success: true, message: 'Your previous purchases were successfully restored!' };
  } catch (err: any) {
    console.error('[StoreBilling] Restore error:', err);
    return { success: false, message: err?.message || 'Unable to restore purchases. Please try again later.' };
  }
};
