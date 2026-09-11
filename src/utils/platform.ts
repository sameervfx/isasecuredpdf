import { Capacitor } from '@capacitor/core';

/**
 * Returns true if running natively on iOS (Capacitor iOS wrapper)
 * or inside an iOS browser environment.
 */
export const isIOSPlatform = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const nativePlatform = Capacitor.getPlatform();
  if (nativePlatform === 'ios') return true;

  const ua = window.navigator.userAgent || '';
  const isIOSUA = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  return isIOSUA;
};
