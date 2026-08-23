/**
 * Lightweight anonymous UI event tracking helper.
 * ZERO data logging: Tracks only UI action names (e.g. page views, button clicks).
 * Never logs or sends file names, form entries, or document buffers.
 */
export const trackEvent = (
  eventName: 'pdf_loaded' | 'export_downloaded' | 'pricing_checkout_clicked',
  details?: string
) => {
  try {
    if (typeof window !== 'undefined') {
      // Google Analytics / Plausible / PostHog window hook
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', eventName, {
          event_category: 'UI_Interaction',
          event_label: details || '',
        });
      }
      if (typeof (window as any).plausible === 'function') {
        (window as any).plausible(eventName, { props: { category: details || '' } });
      }
    }
  } catch (e) {
    // Silent catch
  }
};
