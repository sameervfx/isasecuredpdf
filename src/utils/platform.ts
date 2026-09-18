import { Capacitor } from '@capacitor/core';

/**
 * Returns true if running natively inside Android app wrapper (Capacitor/Cordova WebView).
 */
export const isAndroidPlatform = (): boolean => {
  if (typeof window === 'undefined') return false;

  // 1. Synchronous Capacitor platform check (guaranteed true immediately on cold start)
  if (Capacitor.getPlatform() === 'android') return true;

  // 2. Native platform check combined with Android User-Agent
  const ua = window.navigator.userAgent || '';
  const isAndroidUA = /Android/i.test(ua);
  if (Capacitor.isNativePlatform() && isAndroidUA) return true;

  // 3. Android WebView container checks (strictly independent of CdvPurchase initialization)
  const host = window.location.hostname;
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  const isCapacitorScheme = window.location.protocol === 'capacitor:';

  if (isAndroidUA && (isLocalHost || isCapacitorScheme || (window as any).Capacitor !== undefined || (window as any).cordova !== undefined)) {
    return true;
  }

  return false;
};

/**
 * Returns true if running natively inside Android or iOS mobile app wrapper (Capacitor).
 */
export const isNativeMobileApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  if (isAndroidPlatform()) return true;

  const platform = Capacitor.getPlatform();
  if (platform === 'android' || platform === 'ios') return true;
  if (Capacitor.isNativePlatform()) return true;

  const ua = window.navigator.userAgent || '';
  const isMobileUA = /Android|iPhone|iPad|iPod/i.test(ua);
  
  // Return true if Capacitor or cordova is injected or running in native webview container
  return isMobileUA && ((window as any).Capacitor !== undefined || (window as any).cordova !== undefined);
};

/**
 * Returns true if running natively on iOS or iOS browser environment.
 */
export const isIOSPlatform = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const nativePlatform = Capacitor.getPlatform();
  if (nativePlatform === 'ios') return true;

  const ua = window.navigator.userAgent || '';
  const isIOSUA = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  return isIOSUA;
};

