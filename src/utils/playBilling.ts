// Google Play Billing Integration Utility for Native Mobile Builds
import { isNativeMobileApp } from './platform';

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
}

// Global cached prices map (e.g. { isasecuredpdf_pro_monthly: "CA$2.99", ... })
let livePricesMap: Record<string, string> = {};
let isStoreInitialized = false;
const priceListeners: Array<(prices: Record<string, string>) => void> = [];

/**
 * Subscribe to live Play Store price updates.
 * Returns an unsubscribe function.
 */
export function subscribeToPriceUpdates(listener: (prices: Record<string, string>) => void): () => void {
  priceListeners.push(listener);
  if (Object.keys(livePricesMap).length > 0) {
    listener({ ...livePricesMap });
  }
  return () => {
    const idx = priceListeners.indexOf(listener);
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
      console.log(`[GooglePlayBilling] CdvPurchase not ready yet. Scheduling retry ${retryCount}/${MAX_RETRIES}...`);
      setTimeout(() => initPlayStore(), 300);
    } else {
      console.warn('[GooglePlayBilling] CdvPurchase failed to attach after max retries.');
    }
    return;
  }

  const Platform = cdv.Platform;
  const ProductType = cdv.ProductType;
  const targetPlatform = Platform?.GOOGLE_PLAY || 'google-play';

  if (!isStoreInitialized) {
    isStoreInitialized = true;

    try {
      console.log('[GooglePlayBilling] CdvPurchase detected! Registering product catalog...');
      store.register([
        {
          id: PLAY_PRODUCT_IDS.monthly,
          type: ProductType?.PAID_SUBSCRIPTION || 'paid subscription',
          platform: targetPlatform,
        },
        {
          id: PLAY_PRODUCT_IDS.annual,
          type: ProductType?.PAID_SUBSCRIPTION || 'paid subscription',
          platform: targetPlatform,
        },
        {
          id: PLAY_PRODUCT_IDS.lifetime,
          type: ProductType?.NON_CONSUMABLE || 'non consumable',
          platform: targetPlatform,
        },
      ]);

      const extractPrices = () => {
        const newPrices: Record<string, string> = {};
        [PLAY_PRODUCT_IDS.monthly, PLAY_PRODUCT_IDS.annual, PLAY_PRODUCT_IDS.lifetime].forEach((id) => {
          const prod = store.get ? store.get(id, targetPlatform) : null;
          if (prod) {
            const offer = typeof prod.getOffer === 'function' ? prod.getOffer() : (prod.offers && prod.offers[0]);
            const priceVal =
              offer?.pricingPhases?.[0]?.price ||
              prod?.pricing?.price ||
              prod?.price;
            if (priceVal) {
              newPrices[id] = priceVal;
            }
          }
        });

        if (Object.keys(newPrices).length > 0) {
          console.log('[GooglePlayBilling] Extracted Play Store prices:', newPrices);
          livePricesMap = { ...livePricesMap, ...newPrices };
          notifyPriceListeners();
        }
      };

      // Transaction approval handler
      if (typeof store.when === 'function') {
        store.when().approved((transaction: any) => {
          console.log('[GooglePlayBilling] Transaction approved:', transaction);
          if (typeof transaction.finish === 'function') {
            transaction.finish();
          }
        });

        // Listen for product updates and extract pricing
        store.when().updated(() => {
          console.log('[GooglePlayBilling] store.when().updated event triggered');
          extractPrices();
        });
      }

      // Initialize store
      const initPromise = typeof store.initialize === 'function'
        ? store.initialize([targetPlatform])
        : Promise.resolve();

      initPromise
        .then(() => {
          console.log('[GooglePlayBilling] Store initialize completed. Executing store.update()');
          if (typeof store.update === 'function') {
            store.update();
          }
          extractPrices();
        })
        .catch((err: any) => {
          console.error('[GooglePlayBilling] Store init error:', err);
        });
    } catch (err) {
      console.error('[GooglePlayBilling] Error during store setup:', err);
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
  const targetPlatform = Platform?.GOOGLE_PLAY || 'google-play';

  const product = store.get 
    ? (store.get(productId) || store.get(productId, targetPlatform)) 
    : (store.products && store.products.find((p: any) => p.id === productId));
  const offer = product && typeof product.getOffer === 'function' ? product.getOffer() : (product?.offers && product.offers[0]);

  if (offer) {
    console.log('[GooglePlayBilling] Executing store.order(offer):', offer);
    try {
      const orderRes = await store.order(offer);
      return { success: true, productId, transactionId: orderRes?.transaction?.id };
    } catch (e: any) {
      return { success: false, productId, error: e?.message || 'Purchase cancelled or failed' };
    }
  } else if (product) {
    console.log('[GooglePlayBilling] Executing store.order(product):', product);
    try {
      const orderRes = await store.order(product);
      return { success: true, productId, transactionId: orderRes?.transaction?.id };
    } catch (e: any) {
      return { success: false, productId, error: e?.message || 'Purchase cancelled or failed' };
    }
  } else {
    console.warn('[GooglePlayBilling] Product not found in store catalog yet. Triggering store.update()');
    if (typeof store.update === 'function') {
      store.update();
    }
    alert('Connecting to Google Play catalog. Please ensure your Google account is added under Google Play Console -> Setup -> License Testing to enable instant purchase testing.');
    return { success: false, productId, error: 'Product not ready' };
  }
};

// Backwards compatibility alias
export const launchNativeGooglePlayBilling = handleNativePurchase;
