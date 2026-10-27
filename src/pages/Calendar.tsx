import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { viewingsService, Viewing } from "../services/viewingsService";
import { toast } from "react-hot-toast";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO
} from "date-fns";
import { ro } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { ViewingDetailsModal } from "../components/ViewingDetailsModal";
import { leadsService, Lead } from "../services/leadsService";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export const Calendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedViewing, setSelectedViewing] = useState<Viewing | null>(null);
  const [isViewingDetailsOpen, setIsViewingDetailsOpen] = useState(false);
  const navigate = useNavigate();
  const todayRef = React.useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        navigate("/");
      }
    });
    return () => unsubAuth();
  }, [navigate]);

  useEffect(() => {
    if (!user) {
      setViewings([]);
      setLeads([]);
      return;
    }

    const unsubViewings = viewingsService.subscribeToAllViewings((v) => {
      setViewings(v);
    });
    const unsubLeads = leadsService.subscribeToLeads((l) => {
      setLeads(l);
    });
    return () => {
      unsubViewings();
      unsubLeads();
    };
  }, [user]);

  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [viewings, currentMonth]);

  const renderHeader = () => {
    return (
      <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-6 bg-white border-b border-gray-50 gap-4">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h1 className="text-[20px] md:text-[28px] font-black text-gray-900 tracking-tight leading-none mb-1">Calendar Vizionări</h1>
          <p className="text-[12px] md:text-[13px] text-gray-400 font-medium italic">Gestionează întâlnirile tale cu clienții</p>
        </div>
        <div className="flex items-center gap-2 md:gap-4 bg-gray-50 p-1 md:p-1.5 rounded-[16px] border border-gray-100">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-white text-gray-600 hover:bg-gray-100 transition-colors shadow-sm"
          >
            <ChevronLeft size={20} className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <span className="text-[13px] md:text-[15px] font-bold text-gray-900 px-2 md:px-4 min-w-[120px] md:min-w-[150px] text-center capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ro })}
          </span>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-white text-gray-600 hover:bg-gray-100 transition-colors shadow-sm"
          >
            <ChevronRight size={20} className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderDaysHeader = () => {
    const days = ["L", "M", "Mi", "J", "V", "S", "D"];
    return (
      <div className="hidden md:grid grid-cols-7 bg-gray-50/50 border-b border-gray-100">
        {days.map((day, i) => (
          <div key={i} className="py-4 text-center text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return (
      <div className="flex flex-col md:grid md:grid-cols-7 border-l md:border-t border-gray-100">
        {calendarDays.map((day, i) => {
          const dayViewings = viewings.filter(v => isSameDay(parseISO(v.date), day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div 
              key={day.toISOString()} 
              ref={isToday ? todayRef : null}
              className={`min-h-[100px] md:min-h-[160px] p-2 md:p-1 border-r border-b border-gray-100 transition-colors ${
                !isCurrentMonth ? 'bg-gray-50/30' : 'bg-white'
              } ${isToday ? 'ring-1 ring-inset ring-[--color-accent]/30 bg-[--color-accent]/[0.02]' : ''}`}
            >
              <div className="flex justify-between items-center mb-1 px-1">
                <span className={`text-[12px] font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday 
                    ? 'bg-[--color-accent] text-white shadow-lg shadow-[--color-accent]/20' 
                    : isCurrentMonth ? 'text-gray-900' : 'text-gray-300'
                }`}>
                  {format(day, "d")}
                </span>
                <span className="md:hidden text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  {format(day, "EEEE", { locale: ro })}
                </span>
              </div>
              <div className="space-y-1 overflow-y-auto max-h-[120px] no-scrollbar">
                {dayViewings.map((viewing, idx) => {
                  const lead = leads.find(l => l.id === viewing.propertyId);
                  const loc = lead?.extractedData?.crmData?.detaliiGenerale?.localizare;
                  const address = loc ? `${loc.strada || ''} ${loc.numar || ''}`.trim() : viewing.contactName;

                  return (
                    <motion.div
                      key={viewing.id || `${viewing.date}-${viewing.hour}-${viewing.contactName}-${idx}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => {
                        setSelectedViewing(viewing);
                        setIsViewingDetailsOpen(true);
                      }}
                      className="p-1.5 rounded-[8px] bg-white border border-gray-100 shadow-sm cursor-pointer hover:border-[--color-accent] hover:shadow-md transition-all overflow-hidden group"
                    >
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-[--color-accent] mb-0.5">
                        <Clock size={10} strokeWidth={3} />
                        {viewing.hour}
                      </div>
                      <div className="text-[11px] font-bold text-gray-900 truncate leading-tight group-hover:text-[--color-accent] transition-colors">
                        {address || viewing.contactName}
                      </div>
                      <div className="text-[9px] font-medium text-gray-400 truncate">
                        {viewing.contactName}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#f44336]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-[#fbfbfb]">
      <Header 
        onAddClick={() => navigate('/')} 
        onNotificationsClick={async () => {
          if ('Notification' in window) {
             const permission = await Notification.requestPermission();
             if (permission === 'granted') {
               toast.success('Notificările de sistem au fost activate!');
             } else {
               toast.error('Notificările de sistem sunt blocate de browser.');
             }
          } else {
            toast.error('Browserul tău nu suportă notificări de sistem.');
          }
        }} 
        onAddContactClick={() => navigate('/')}
      />
      <main className="flex-1 overflow-hidden flex flex-col px-[10px] py-[10px]">
        <div className="flex-1 bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          {renderHeader()}
          <div className="flex-1 overflow-y-auto custom-scrollbar no-scrollbar-mobile">
            {renderDaysHeader()}
            {renderCells()}
          </div>
        </div>
      </main>

      <ViewingDetailsModal 
        isOpen={isViewingDetailsOpen}
        onClose={() => setIsViewingDetailsOpen(false)}
        viewing={selectedViewing}
      />
    </div>
  );
};
