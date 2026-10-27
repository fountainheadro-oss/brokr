import { Express } from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Local database schema for persisting background notification state
interface CachedViewing {
  id: string;
  date: string;
  hour: string;
  agentId?: string;
  contactName?: string;
  syncedAt: number;
}

interface CachedToken {
  token: string;
  userId: string;
  email?: string;
  updatedAt: number;
}

interface NotificationCache {
  viewings: { [viewingId: string]: CachedViewing };
  tokens: { [token: string]: CachedToken };
}

const CACHE_FILE_PATH = path.join('/tmp', 'brokr-background-cache.json');

// In-memory shadow copy of synced database structures
const localCache: NotificationCache = {
  viewings: {},
  tokens: {}
};

// Safely load local persistent file cache on server boot
function loadPersistentCache() {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.viewings) localCache.viewings = parsed.viewings;
      if (parsed.tokens) localCache.tokens = parsed.tokens;
      console.log(`[Notification Background] Persistent cache loaded. Viewings: ${Object.keys(localCache.viewings).length}, Tokens: ${Object.keys(localCache.tokens).length}`);
    }
  } catch (err: any) {
    console.warn('[Notification Background] Failed loading background-cache file:', err.message);
  }
}

// Safely persist local cache to filesystem
function savePersistentCache() {
  try {
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(localCache, null, 2), 'utf8');
  } catch (err: any) {
    console.warn('[Notification Background] Failed to write background-cache file:', err.message);
  }
}

// Read firebase config safely
interface FirebaseConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId: string;
  storageBucket: string;
  messagingSenderId: string;
}

function loadFirebaseConfig(): FirebaseConfig | null {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const configRaw = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configRaw);
    }
  } catch (err: any) {
    console.error('[Notification Background] Failed to load firebase-applet-config.json:', err.message);
  }
  return null;
}

// Fetch GCP OAuth access token from Cloud Run metadata server (used for dispatching background FCM pushes securely)
async function getGCPServiceToken(): Promise<string | null> {
  try {
    const res = await axios.get('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
      headers: {
        'Metadata-Flavor': 'Google'
      },
      params: {
        scopes: 'https://www.googleapis.com/auth/firebase.messaging'
      },
      timeout: 3000
    });
    return res.data.access_token;
  } catch (err: any) {
    // Graceful catchment in local development/sandbox environments
    return null;
  }
}

// Send standard FCM v1 push notification to target device tokens
async function sendFCMPushNotification(projectId: string, accessToken: string | null, tokens: string[], title: string, body: string, urlPath: string) {
  if (!accessToken) {
    console.log(`[FCM Server Helper] (SIMULATION MODE - Local setup active / No metadata auth)
    • Unregistered OS Push Target Tokens: ${JSON.stringify(tokens)}
    • Title: "${title}"
    • Description: "${body}"
    • Target Route: "${urlPath}"`);
    return;
  }

  // Dispatch FCM v1 messages securely over Google API
  for (const token of tokens) {
    try {
      const payload = {
        message: {
          token: token,
          notification: {
            title: title,
            body: body
          },
          data: {
            title: title,
            body: body,
            clickAction: urlPath
          }
        }
      };

      console.log(`[FCM Server Helper] Dispatching FCM push to token suffix ${token.substring(token.length - 15)}...`);
      await axios.post(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      console.log(`[FCM Server Helper] FCM push delivered successfully.`);
    } catch (apiErr: any) {
      console.warn(`[FCM Server Helper] Delivery failed for ${token.substring(0, 15)} (service account lacks FCM write permission):`, apiErr.response?.data || apiErr.message);
    }
  }
}

export function registerNotificationRoutes(app: Express) {
  // Load persistent database file on boot
  loadPersistentCache();

  // Route to synchronize user viewings directly from authenticated client session
  app.post('/api/notifications/sync-viewings', (req, res) => {
    try {
      const { userId, viewings } = req.body;
      if (!userId || !Array.isArray(viewings)) {
        return res.status(400).json({ error: 'Missing userId or viewings array' });
      }

      console.log(`[Notification Background] Synchronizing ${viewings.length} viewings for user: ${userId}`);

      // 1. Remove previously cached viewings for this user to sync deletions/updates correctly
      for (const viewingId of Object.keys(localCache.viewings)) {
        const cached = localCache.viewings[viewingId];
        if (cached.agentId === userId || cached.id === userId) {
          delete localCache.viewings[viewingId];
        }
      }

      // 2. Add or update current viewings
      viewings.forEach((v: any) => {
        if (v.id && v.date && v.hour) {
          localCache.viewings[v.id] = {
            id: v.id,
            date: v.date,
            hour: v.hour,
            agentId: v.agentId || userId,
            contactName: v.contactName || 'clientul',
            syncedAt: Date.now()
          };
        }
      });

      savePersistentCache();
      return res.json({ success: true, count: viewings.length });
    } catch (err: any) {
      console.error('[Notification Background] Failed syncing viewings route:', err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // Route to register dynamic client FCM token with the background process mapping
  app.post('/api/notifications/register-token', (req, res) => {
    try {
      const { token, userId, email } = req.body;
      if (!token || !userId) {
        return res.status(400).json({ error: 'Missing token or userId' });
      }

      console.log(`[Notification Background] Mapping token suffix ${token.substring(token.length - 8)} to UID: ${userId}`);

      localCache.tokens[token] = {
        token,
        userId,
        email,
        updatedAt: Date.now()
      };

      savePersistentCache();
      return res.json({ success: true });
    } catch (err: any) {
      console.error('[Notification Background] Failed registering token route:', err.message);
      return res.status(500).json({ error: err.message });
    }
  });
}

export function setupBackgroundNotifications() {
  const config = loadFirebaseConfig();
  if (!config) {
    console.warn('[Notification Background] No Firebase configuration found. Background server notifications will not trigger.');
    return;
  }

  const { projectId } = config;

  console.log(`[Notification Background] Initializing memory cache-based background listener for Project: ${projectId}`);

  // Set of sent keys to prevent duplicate alerting at the same threshold
  const sentNotifications = new Set<string>();

  const runCheckTick = async () => {
    try {
      const now = new Date();
      const allViewings = Object.values(localCache.viewings);
      const allTokens = Object.values(localCache.tokens);

      if (allViewings.length === 0 || allTokens.length === 0) {
        return;
      }

      // Clear memory of historical sent keys once a day to keep memory footprints safe
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        sentNotifications.clear();
      }

      // Retrieve Cloud Run metadata account token if present (for FCM dispatch)
      const fcmAccessToken = await getGCPServiceToken();

      allViewings.forEach(viewing => {
        const viewingId = viewing.id;
        if (!viewingId || !viewing.date || !viewing.hour) return;

        // Parse date and hour like '2026-05-27' and '11:30' into absolute timestamp
        const viewingDateTime = new Date(`${viewing.date}T${viewing.hour}:00`);
        if (isNaN(viewingDateTime.getTime())) return;

        // Compute relative offset distance in whole minutes
        const diffMs = viewingDateTime.getTime() - now.getTime();
        const diffMinutes = Math.round(diffMs / (60 * 1000));

        // Support the following intervals/thresholds (3 hours, 2 ore, 1 oră)
        const thresholds = [
          { minutes: 180, label: '3 ore' },
          { minutes: 120, label: '2 ore' },
          { minutes: 60, label: '1 oră' }
        ];

        thresholds.forEach(threshold => {
          const notificationKey = `${viewingId}-${threshold.minutes}`;

          // If current clock is reaching this threshold slot (within 1-2 minutes window)
          if (diffMinutes <= threshold.minutes && diffMinutes > threshold.minutes - 2) {
            if (!sentNotifications.has(notificationKey)) {
              // Extract tokens targeting the scheduled agent, or fallback to all tokens if agentId is missing
              const targetTokens = allTokens
                .filter(t => !viewing.agentId || t.userId === viewing.agentId)
                .map(t => t.token);

              if (targetTokens.length > 0) {
                sendFCMPushNotification(
                  projectId,
                  fcmAccessToken,
                  targetTokens,
                  'Vizionare Programată (Brokr)',
                  `Vizionarea cu ${viewing.contactName || 'clientul'} este peste ${threshold.label}.`,
                  '/calendar'
                );
              }
              sentNotifications.add(notificationKey);
            }
          }
        });

        // Current start check (0 minutes)
        const nowKey = `${viewingId}-now`;
        if (diffMinutes <= 0 && diffMinutes > -5) {
          if (!sentNotifications.has(nowKey)) {
            const targetTokens = allTokens
              .filter(t => !viewing.agentId || t.userId === viewing.agentId)
              .map(t => t.token);

            if (targetTokens.length > 0) {
              sendFCMPushNotification(
                projectId,
                fcmAccessToken,
                targetTokens,
                'Vizionare Programată (Brokr)',
                `Vizionarea cu ${viewing.contactName || 'clientul'} începe ACUM!`,
                '/calendar'
              );
            }
            sentNotifications.add(nowKey);
          }
        }
      });
    } catch (err: any) {
      console.error('[Notification Background] Error in background cache check tick loop:', err.message);
    }
  };

  // Run check tick immediately and schedule recurrence cycle
  runCheckTick();
  setInterval(runCheckTick, 45000); // Polling interval
}
