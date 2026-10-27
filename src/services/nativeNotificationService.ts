import { 
  collection, 
  setDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { db, auth, getFCM, handleFirestoreError, OperationType } from '../lib/firebase';

// Notification Categories supported by the application
export interface NotificationPreferences {
  leads: boolean; // Alerts for new real estate leads
  viewings: boolean; // Alerts for scheduled property viewings
  system: boolean; // Administrative or background processing alerts
  muteAll: boolean; // Option to silence all native sounds & toasts
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  leads: true,
  viewings: true,
  system: true,
  muteAll: false
};

const TOKENS_COLLECTION = 'fcm_tokens';

export const nativeNotificationService = {
  // Retrieve saved categories preferences from localStorage
  getPreferences(): NotificationPreferences {
    try {
      const stored = localStorage.getItem('brokr_notification_preferences');
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('[NotificationService] Failed to read settings from localStorage:', e);
    }
    return DEFAULT_PREFERENCES;
  },

  // Persist categories preferences to localStorage
  savePreferences(prefs: NotificationPreferences) {
    try {
      localStorage.setItem('brokr_notification_preferences', JSON.stringify(prefs));
      console.log('[NotificationService] Settings updated:', prefs);
    } catch (e) {
      console.error('[NotificationService] Failed to persist settings to localStorage:', e);
    }
  },

  // Get current browser Notifications API permission status
  getNotificationPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  },

  // Request browser Notification API permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('[NotificationService] Standard Notifications API not supported in this browser.');
      return 'denied';
    }

    console.log('[NotificationService] Requesting permission...');
    const permission = await Notification.requestPermission();
    console.log('[NotificationService] Permission response:', permission);
    return permission;
  },

  // Register the FCM token with Firestore for deep-routing background pushes
  async registerFCMToken(): Promise<string | null> {
    try {
      const messaging = await getFCM();
      if (!messaging) {
        console.warn('[NotificationService] FCM messaging module is not supported/initialized in this environment.');
        return null;
      }

      // Read custom VAPID key if set in Vite environment, otherwise default is optional but recommended
      const vapidKey = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY || undefined;
      
      console.log('[NotificationService] Fetching FCM device token...', vapidKey ? 'Using custom VAPID Key' : 'Using default Key configuration');
      
      // Register with Service Worker and fetch the push FCM token
      const token = await getToken(messaging, { 
        vapidKey: vapidKey 
      });

      if (token) {
        console.log('[NotificationService] FCM token successfully acquired:', token);
        await this.saveTokenToFirestore(token);
        return token;
      } else {
        console.warn('[NotificationService] Empty FCM device token received.');
        return null;
      }
    } catch (err) {
      console.error('[NotificationService] Error executing FCM token acquisition:', err);
      return null;
    }
  },

  // Save the registration token to Firestore associated with the current online user UID
  async saveTokenToFirestore(token: string) {
    if (!auth.currentUser) return;
    
    const userId = auth.currentUser.uid;
    const userEmail = auth.currentUser.email || '';
    const tokenRef = doc(db, TOKENS_COLLECTION, token);

    try {
      await setDoc(tokenRef, {
        token: token,
        userId: userId,
        email: userEmail,
        devicePlatform: navigator.platform || 'Unknown',
        userAgent: navigator.userAgent || 'UnknownBrowser',
        updatedAt: serverTimestamp()
      });
      console.log('[NotificationService] FCM Token registered in Firestore for UID:', userId);
    } catch (error) {
      // Gracefully handle or log Firestore write errors
      console.error('[NotificationService] Failed to save token in Firestore:', error);
    }
  },

  // Unregister/remove the FCM token from Firestore when logging out
  async removeTokenFromFirestore(token: string) {
    try {
      const tokenRef = doc(db, TOKENS_COLLECTION, token);
      await deleteDoc(tokenRef);
      console.log('[NotificationService] FCM Token deleted from database.');
    } catch (error) {
      console.error('[NotificationService] Failed to remove token from database:', error);
    }
  },

  // Send a raw system notification directly matching standard Browser API (Foreground)
  showNativeOSNotification(title: string, body: string, urlPath: string = '/') {
    const prefs = this.getPreferences();
    if (prefs.muteAll) {
      console.log('[NotificationService] Native alert suppressed (Preferences set to Muted).');
      return;
    }

    if (this.getNotificationPermission() === 'granted') {
      try {
        const options: NotificationOptions = {
          body: body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'brokr-foreground-alert',
          data: { urlPath }
        };

        // Try to trigger via service worker registration first (crucial for iframe context, PWAs on Android, and iOS Safari)
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, options).catch((err) => {
              console.warn('[NotificationService] ServiceWorker showNotification failed, using fallback:', err);
              this.triggerLegacyNotification(title, options, urlPath);
            });
          }).catch((err) => {
            console.warn('[NotificationService] ServiceWorker ready promise failed, trying legacy fallback:', err);
            this.triggerLegacyNotification(title, options, urlPath);
          });
        } else {
          this.triggerLegacyNotification(title, options, urlPath);
        }
      } catch (err) {
        console.error('[NotificationService] Error launching new Native OS window notification:', err);
      }
    } else {
      console.log('[NotificationService] Native alert blocked (Permission not granted). Title:', title);
    }
  },

  // Fallback trigger using direct standard Window Notification constructor
  triggerLegacyNotification(title: string, options: NotificationOptions, urlPath: string) {
    try {
      const notification = new Notification(title, options);
      notification.onclick = (e) => {
        e.preventDefault();
        window.focus();
        // Route or navigate the application using standard navigation/reload
        window.location.hash = `#${urlPath}`;
        notification.close();
      };
    } catch (err) {
      console.error('[NotificationService] Legacy Notification instantiation failed:', err);
    }
  },

  // Simulate a background native operating system notification after a short delayed timer
  simulateNotification(title: string, body: string, category: keyof NotificationPreferences, delaySeconds: number = 3, urlPath: string = '/') {
    const prefs = this.getPreferences();
    // Validate if the user has enabled notifications for this category
    if (!prefs[category]) {
      console.log(`[NotificationService] Simulated notification blocked: category "${category}" is disabled in user preferences.`);
      return;
    }

    console.log(`[NotificationService] Scheduling simulated OS notification in ${delaySeconds}s...`);
    
    setTimeout(() => {
      // Trigger native notification
      this.showNativeOSNotification(`[Simulare] ${title}`, body, urlPath);
    }, delaySeconds * 1000);
  }
};
