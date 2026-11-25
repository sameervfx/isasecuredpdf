import { Capacitor } from '@capacitor/core';

const WELCOME_NOTIF_STORAGE_KEY = 'isa_welcome_notif_v1';
const WELCOME_NOTIF_ID = 4001;
const WELCOME_CHANNEL_ID = 'isa_welcome';
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

/**
 * Schedules a single on-device local notification 4 hours after first app launch
 * on native Android & iOS apps (complete no-op on Web and Desktop Electron).
 * Never uses exact-alarm permissions and never re-prompts if already scheduled or denied.
 */
export async function scheduleWelcomeNotificationOnce(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const statusFlag = localStorage.getItem(WELCOME_NOTIF_STORAGE_KEY);
    if (statusFlag === 'done' || statusFlag === 'denied') return;

    const { LocalNotifications } = await import('@capacitor/local-notifications');

    let perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'prompt' || perm.display === 'prompt-with-rationale') {
      perm = await LocalNotifications.requestPermissions();
    }

    if (perm.display !== 'granted') {
      localStorage.setItem(WELCOME_NOTIF_STORAGE_KEY, 'denied');
      return;
    }

    // Create default Android notification channel (no-op on iOS)
    if (Capacitor.getPlatform() === 'android') {
      try {
        await LocalNotifications.createChannel({
          id: WELCOME_CHANNEL_ID,
          name: 'ISA Secured PDF',
          description: 'Offline PDF scanner & editor reminders',
          importance: 3,
          visibility: 1,
        });
      } catch {
        // Ignore if channel already exists or OS < 8
      }
    }

    // Ensure no duplicate pending welcome notification exists
    try {
      await LocalNotifications.cancel({ notifications: [{ id: WELCOME_NOTIF_ID }] });
    } catch {}

    const fireAt = new Date(Date.now() + FOUR_HOURS_MS);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: WELCOME_NOTIF_ID,
          title: 'ISA Secured PDF',
          body: 'Your offline PDF scanner & editor is ready—zero cloud uploads',
          channelId: WELCOME_CHANNEL_ID,
          autoCancel: true,
          schedule: {
            at: fireAt,
            allowWhileIdle: false,
          },
        },
      ],
    });

    localStorage.setItem(WELCOME_NOTIF_STORAGE_KEY, 'done');
  } catch (err) {
    // Non-fatal: never block or crash app startup
    console.warn('Welcome local notification skipped:', err);
  }
}

/**
 * Cancels the pending 4-hour welcome nudge if the user already completed an export.
 */
export async function cancelWelcomeNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: WELCOME_NOTIF_ID }] });
  } catch {}
}
