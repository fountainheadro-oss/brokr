import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Bell, Clock, CheckCircle2, AlertCircle, Info, Settings } from "lucide-react";
import { Notification, notificationsService } from "../services/notificationsService";
import { useNotifications } from "./NotificationProvider";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

const NotificationItem = ({ notification }: { notification: Notification }) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notification.read) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          notificationsService.markAsRead(notification.id!);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => observer.disconnect();
  }, [notification]);

  const getIcon = () => {
    switch (notification.type) {
      case 'lead': return <CheckCircle2 size={18} className="text-green-500" />;
      case 'viewing': return <Clock size={18} className="text-blue-500" />;
      default: return <Info size={18} className="text-gray-500" />;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ro-RO', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div 
      ref={itemRef}
      className={`p-4 rounded-[16px] border transition-all ${
        notification.read ? 'bg-white border-gray-100 opacity-60' : 'bg-blue-50/30 border-blue-100 shadow-sm'
      }`}
    >
      <div className="flex gap-3">
        <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          notification.read ? 'bg-gray-50' : 'bg-white shadow-sm'
        }`}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className={`text-[14px] font-bold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
              {notification.title}
            </h4>
            <span className="text-[10px] font-medium text-gray-400">
              {formatDate(notification.createdAt)}
            </span>
          </div>
          <p className={`text-[13px] mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-600'}`}>
            {notification.message}
          </p>
        </div>
      </div>
    </div>
  );
};

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, notifications }) => {
  const { openSettings } = useNotifications();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[999]"
          />
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="fixed top-5 right-5 w-[420px] max-h-[85vh] bg-white rounded-[16px] shadow-2xl z-[1000] flex flex-col border border-gray-100 overflow-hidden"
          >
            <div className="p-5 flex justify-between items-center bg-white border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shadow-sm">
                  <Bell size={20} className="text-[rgb(224,72,57)]" />
                </div>
                <h2 className="text-[16px] font-bold text-gray-900 tracking-tight">Notificări</h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    onClose();
                    openSettings();
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors border border-gray-100 shadow-sm cursor-pointer"
                  title="Configurare Alerte Push"
                >
                  <Settings size={18} strokeWidth={2} />
                </button>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors border border-gray-100 shadow-sm cursor-pointer"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar min-h-[100px]">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5 border border-dashed border-gray-200">
                    <Bell size={32} className="text-gray-200" />
                  </div>
                  <p className="text-[14px] font-bold text-gray-400 tracking-wide">Nicio notificare momentan</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50/50 rounded-b-[24px] border-t border-gray-100 shrink-0">
              <p className="text-[11px] font-bold text-gray-400 text-center uppercase tracking-[0.15em]">
                Auto-citire la vizualizare
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
