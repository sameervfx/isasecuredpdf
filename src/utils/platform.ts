import { Capacitor } from '@capacitor/core';

/**
 * Returns true if running natively inside Android or iOS mobile app wrapper (Capacitor).
 */
export const isNativeMobileApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const platform = Capacitor.getPlatform();
  if (platform === 'android' || platform === 'ios') return true;
  if (Capacitor.isNativePlatform()) return true;

  const ua = window.navigator.userAgent || '';
  const isMobileUA = /Android|iPhone|iPad|iPod/i.test(ua);
  
  // Return true if Capacitor is injected or running in native webview container
  return isMobileUA && (window as any).Capacitor !== undefined;
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
