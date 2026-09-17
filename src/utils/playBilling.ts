// Google Play Billing Integration Utility for Native Mobile Builds
import { isNativeMobileApp } from './platform';

export const PLAY_PRODUCT_IDS = {
  monthly: 'isasecuredpdf_pro_monthly',
  annual: 'isasecuredpdf_pro_annual',
  lifetime: 'isasecuredpdf_lifetime_vip',
} as const;

export type PlanType = 'monthly' | 'annual' | 'lifetime';

export interface DynamicProductInfo {
  productId: string;
  price: string;
  title?: string;
  description?: string;
  offer?: any;
  rawProduct?: any;
}

export interface PurchaseResult {
  success: boolean;
  productId: string;
  transactionId?: string;
  purchaseToken?: string;
  error?: string;
}

let isStoreInitialized = false;
let storeProductsCache: Record<PlanType, DynamicProductInfo | null> = {
  monthly: null,
  annual: null,
  lifetime: null,
};

/**
 * Initializes CdvPurchase.store and registers product catalog from Google Play.
 */
export async function initializeStoreCatalog(): Promise<Record<PlanType, DynamicProductInfo | null>> {
  if (typeof window === 'undefined') return storeProductsCache;

  const cdvPurchase = (window as any).CdvPurchase;
  if (!cdvPurchase || !cdvPurchase.store) {
    console.log('[GooglePlayBilling] CdvPurchase.store not available in current environment');
    return storeProductsCache;
  }

  const store = cdvPurchase.store;

  try {
    if (!isStoreInitialized) {
      // Register products
      if (typeof store.register === 'function') {
        const productTypeSub = cdvPurchase.ProductType?.PAID_SUBSCRIPTION || 'paid subscription';
        const productTypeNonConsumable = cdvPurchase.ProductType?.NON_CONSUMABLE || 'non consumable';
        const platformGoogle = cdvPurchase.Platform?.GOOGLE_PLAY || 'google-play';

        store.register([
          { id: PLAY_PRODUCT_IDS.monthly, type: productTypeSub, platform: platformGoogle },
          { id: PLAY_PRODUCT_IDS.annual, type: productTypeSub, platform: platformGoogle },
          { id: PLAY_PRODUCT_IDS.lifetime, type: productTypeNonConsumable, platform: platformGoogle },
        ]);
      }

      // Add approval listener to acknowledge transactions
      if (typeof store.when === 'function') {
        store.when().approved((transaction: any) => {
          console.log('[GooglePlayBilling] Transaction approved:', transaction);
          if (typeof transaction.finish === 'function') {
            transaction.finish();
          }
        });
      }

      if (typeof store.initialize === 'function') {
        await store.initialize();
      }
      isStoreInitialized = true;
    }

    // Extract dynamic product prices
    const plans: PlanType[] = ['monthly', 'annual', 'lifetime'];
    for (const plan of plans) {
      const pid = PLAY_PRODUCT_IDS[plan];
      const prod = store.get ? store.get(pid) : null;
      if (prod) {
        const offer = typeof prod.getOffer === 'function' ? prod.getOffer() : (prod.offers && prod.offers[0]);
        const price = prod.pricing?.price || offer?.pricingPhases?.[0]?.price || null;
        if (price) {
          storeProductsCache[plan] = {
            productId: pid,
            price: price,
            title: prod.title,
            description: prod.description,
            offer: offer,
            rawProduct: prod,
          };
        }
      }
    }
  } catch (err) {
    console.warn('[GooglePlayBilling] Store catalog initialization warning:', err);
  }

  return storeProductsCache;
}

/**
 * Returns cached store products.
 */
export function getCachedStoreProducts(): Record<PlanType, DynamicProductInfo | null> {
  return storeProductsCache;
}

/**
 * Launches native Google Play Billing flow for a given plan and acknowledges the purchase.
 * Directly executes store.order(product.getOffer() || product).
 * NO Play Store URL/browser redirect fallbacks.
 */
export async function launchNativeGooglePlayBilling(plan: PlanType): Promise<PurchaseResult> {
  const productId = PLAY_PRODUCT_IDS[plan] || PLAY_PRODUCT_IDS.annual;

  console.log(`[GooglePlayBilling] Launching billing flow for Product ID: ${productId}`);

  if (typeof window === 'undefined') {
    return { success: false, productId, error: 'Window environment not available' };
  }

  const cdvPurchase = (window as any).CdvPurchase;
  if (!cdvPurchase || !cdvPurchase.store) {
    return {
      success: false,
      productId,
      error: 'Connecting to Google Play... please wait a moment and try again.',
    };
  }

  const store = cdvPurchase.store;

  try {
    // Ensure catalog is initialized
    await initializeStoreCatalog();

    const product = store.get ? store.get(productId) : null;
    if (!product) {
      return {
        success: false,
        productId,
        error: 'Google Play Store catalog is connecting. Please wait a few seconds and try again.',
      };
    }

    // Execute store.order(product.getOffer() || product) directly
    const offer = typeof product.getOffer === 'function' ? product.getOffer() : (product.offers && product.offers[0]);
    const orderTarget = offer || product;

    console.log('[GooglePlayBilling] Executing store.order directly on target:', orderTarget);
    const orderResult = await store.order(orderTarget);

    if (orderResult) {
      const transaction = orderResult.transaction || orderResult;
      if (transaction && typeof transaction.acknowledge === 'function') {
        await transaction.acknowledge();
      }
      return {
        success: true,
        productId,
        transactionId: transaction?.id || `GPA.${Date.now()}`,
        purchaseToken: transaction?.purchaseToken || `token_${Date.now()}`,
      };
    }

    return {
      success: false,
      productId,
      error: 'Google Play purchase flow was not completed.',
    };
  } catch (err: any) {
    console.error('[GooglePlayBilling] store.order error:', err);
    return {
      success: false,
      productId,
      error: err?.message || 'Failed to trigger Google Play purchase sheet.',
    };
  }
}
