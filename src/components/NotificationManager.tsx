import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { toast, Toaster, ToastBar } from 'react-hot-toast';
import { viewingsService, Viewing } from '../services/viewingsService';
import { parseISO, differenceInMinutes, isAfter } from 'date-fns';
import { nativeNotificationService } from '../services/nativeNotificationService';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNotifications } from './NotificationProvider';

export const NotificationManager: React.FC = () => {
  const sentNotifications = useRef<Set<string>>(new Set());
  const viewingsRef = useRef<Viewing[]>([]);
  const isInitialLoad = useRef(true);
  const { permission, requestSystemPermission } = useNotifications();

  // Prompt the user to grant native system alerts if permission is set to 'default'
  useEffect(() => {
    if (permission === 'default') {
      const timer = setTimeout(() => {
        toast((t) => (
          <div className="flex flex-col gap-2.5 font-sans min-w-[280px]">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🔔</span>
              <div>
                <p className="text-[14px] font-bold text-gray-900 leading-tight">Activați Notificările Native</p>
                <p className="text-[12px] text-gray-500 font-medium mt-1 leading-normal">
                  Rămâneți la curent cu vizionările programate chiar și când nu sunteți în aplicație.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-1">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-black hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
              >
                Nu acum
              </button>
              <button
                onClick={async () => {
                  toast.dismiss(t.id);
                  try {
                    await requestSystemPermission();
                  } catch (err) {
                    console.error('[NotificationManager] Request permission failed:', err);
                  }
                }}
                className="px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-sm"
              >
                Permite Alerte
              </button>
            </div>
          </div>
        ), {
          duration: 15000,
          id: 'prompt-system-notifications'
        });
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [permission, requestSystemPermission]);

  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;

    // Subscribe only when authenticated
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (!unsubFirestore) {
          unsubFirestore = viewingsService.subscribeToAllViewings((v) => {
            viewingsRef.current = v;
          });
        }
      } else {
        if (unsubFirestore) {
          unsubFirestore();
          unsubFirestore = null;
        }
        viewingsRef.current = [];
        isInitialLoad.current = true;
      }
    });

    // Check interval
    const interval = setInterval(() => {
      // If not authenticated or viewings not loaded yet, skip check
      if (viewingsRef.current.length === 0) return;

      const now = new Date();
      
      // Clear very old sent notifications from the set to save memory
      if (now.getHours() === 0 && now.getMinutes() === 0) {
          sentNotifications.current.clear();
      }

      viewingsRef.current.forEach(viewing => {
        const viewingDateTime = parseISO(`${viewing.date}T${viewing.hour}:00`);
        
        // Skip if viewing was more than 30 minutes ago
        if (differenceInMinutes(now, viewingDateTime) > 30) return;

        const diffMinutes = differenceInMinutes(viewingDateTime, now);

        const thresholds = [
          { minutes: 180, label: '3 ore' },
          { minutes: 120, label: '2 ore' },
          { minutes: 60, label: '1 oră' }
        ];

        thresholds.forEach(threshold => {
          const notificationKey = `${viewing.id}-${threshold.minutes}`;
          
          // Trigger if we are at or slightly below the threshold (within 2 minutes of it)
          if (diffMinutes <= threshold.minutes && diffMinutes > threshold.minutes - 2) {
            if (isInitialLoad.current) {
               // On first run, mark as "already triggered" so we don't alert for existing past-threshold states
               sentNotifications.current.add(notificationKey);
            } else if (!sentNotifications.current.has(notificationKey)) {
              sendNotification(viewing, threshold.label);
              sentNotifications.current.add(notificationKey);
            }
          }
        });

        // Special check for "Acum" (0 minutes or very slightly in the past but we just noticed it)
        const nowKey = `${viewing.id}-now`;
        if (diffMinutes <= 0 && diffMinutes > -5) {
          if (isInitialLoad.current) {
            sentNotifications.current.add(nowKey);
          } else if (!sentNotifications.current.has(nowKey)) {
            sendNotification(viewing, 'acum');
            sentNotifications.current.add(nowKey);
          }
        }
      });

      // After first loop, we allow notifications
      if (isInitialLoad.current && viewingsRef.current.length > 0) {
        isInitialLoad.current = false;
      }
    }, 10000); // Check every 10 seconds for better responsiveness

    return () => {
      unsubAuth();
      if (unsubFirestore) {
        unsubFirestore();
      }
      clearInterval(interval);
    };
  }, []);

  const sendNotification = (viewing: Viewing, timeLabel: string) => {
    // Check preferences first before alerting
    const prefs = nativeNotificationService.getPreferences();
    if (!prefs.viewings) {
      console.log('[NotificationManager] System viewings alerts are disabled by user preferences.');
      return;
    }

    const title = 'Vizionare Programată (Brokr)';
    const body = `Vizionarea cu ${viewing.contactName} este peste ${timeLabel}.`;
    
    // Fallback/In-app visual alert
    if (timeLabel === 'acum') {
        toast.success(`Vizionarea cu ${viewing.contactName} începe ACUM!`, {
            duration: 10000,
            icon: '⏰'
        });
    } else {
        toast(`Vizionare peste ${timeLabel}: ${viewing.contactName}`, {
            duration: 10000,
            icon: '📅'
        });
    }

    // Centered Native system notification API
    nativeNotificationService.showNativeOSNotification(title, body, '/calendar');
  };

  return (
    <Toaster 
      position="bottom-right" 
      toastOptions={{
        className: 'font-sans',
        style: {
          padding: '24px 32px',
          borderRadius: '28px',
          fontSize: '17px',
          fontWeight: '800',
          boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)',
          border: '3px solid #f0f0f0',
          maxWidth: '500px',
          background: '#ffffff',
          color: '#000000',
        },
        duration: 10000, // Default duration set to 10s
        success: {
          style: {
            borderColor: '#ff3b30',
            background: '#fff',
            boxShadow: '0 30px 60px -12px rgba(255,59,48,0.2)',
          },
          iconTheme: {
            primary: '#ff3b30',
            secondary: '#fff',
          },
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <div className="flex items-center gap-3 w-full">
              {icon}
              <div className="flex-1">{message}</div>
              {t.type !== 'loading' && (
                <button 
                  onClick={() => toast.dismiss(t.id)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-black shrink-0"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
};
