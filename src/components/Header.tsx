import React, { useState, useEffect } from "react";
import { Search, Plus, Bell, UserPlus, Calendar, Trash2, Sliders } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate, useLocation } from "react-router-dom";
import { leadsService } from "../services/leadsService";
import { AICallButtons, AICallModal } from "./AICall";

interface HeaderProps {
  onAddClick: () => void;
  onAddContactClick?: () => void;
  onNotificationsClick: () => void;
  onExtractionRulesClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onAddClick, 
  onAddContactClick, 
  onNotificationsClick,
  onExtractionRulesClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCalendar = location.pathname === '/calendar';

  const [confirmWipe, setConfirmWipe] = useState(false);

  useEffect(() => {
    if (confirmWipe) {
      const timer = setTimeout(() => {
        setConfirmWipe(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [confirmWipe]);

  const handleWipe = async () => {
    if (!confirmWipe) {
      setConfirmWipe(true);
      return;
    }
    setConfirmWipe(false);
    try {
      await leadsService.wipeAllLeads();
    } catch (e) {
      console.error("Eroare la ștergerea completă a proprietăților:", e);
    }
  };

  return (
    <header className="shrink-0 bg-white border-b border-gray-200 shadow-none relative z-[100]">
      <div className="h-[50px] flex justify-between items-center px-4">
        {/* Left tools */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={onNotificationsClick}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors relative"
            title="Notificări"
          >
            <div className="w-2 h-2 bg-indigo-600 rounded-full absolute top-1.5 right-1.5 border border-white" />
            <Bell size={15} />
          </button>

          {/* Wipe All button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleWipe}
            className={`h-8 px-2 flex items-center gap-1 rounded-md transition-all text-xs font-medium border ${
              confirmWipe 
                ? "bg-red-600 text-white border-red-600 animate-pulse" 
                : "bg-white hover:bg-red-50 text-gray-500 hover:text-red-600 border-gray-200"
            }`}
            title={confirmWipe ? "Apasă din nou pentru a confirma ștergerea tuturor proprietăților!" : "Șterge definitiv toate proprietățile din baza de date"}
          >
            <Trash2 size={14} />
            {confirmWipe && <span className="text-[10px] font-bold">CONFIRM</span>}
          </motion.button>
        </div>
        
        {/* Center brand */}
        <div className="flex-1 flex justify-center items-center">
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 cursor-pointer select-none"
          >
            <span className="text-[15px] font-semibold tracking-tight text-gray-900">
              brokr<span className="text-indigo-600">.</span>
            </span>
            <span className="text-[11px] font-medium text-gray-400 border border-gray-200 px-1.5 py-0.2 rounded bg-gray-50/80">
              crm
            </span>
          </div>
        </div>
   
        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          <AICallButtons />
          
          {onExtractionRulesClick && (
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={onExtractionRulesClick}
              className="w-8 h-8 flex items-center justify-center bg-white rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
              title="Reguli Extragere Contacte"
            >
              <Sliders size={15} />
            </motion.button>
          )}
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/calendar')}
            className={`h-8 px-2.5 flex items-center gap-1.5 rounded-md text-xs font-medium border transition-colors ${
              isCalendar 
                ? 'bg-gray-900 text-white border-gray-900' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
            }`}
            title="Calendar Vizionări"
          >
            <Calendar size={14} />
            <span className="hidden sm:inline">Calendar</span>
          </motion.button>
  
          {onAddContactClick && (
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={onAddContactClick}
              className="h-8 px-2.5 flex items-center gap-1.5 rounded-md text-xs font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-colors"
              title="Adaugă Contact"
            >
              <UserPlus size={14} />
              <span className="hidden sm:inline">Contact</span>
            </motion.button>
          )}
  
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={onAddClick}
            className="h-8 px-3 flex items-center gap-1 rounded-md text-xs font-medium bg-gray-900 hover:bg-black text-white transition-colors shadow-sm"
            title="Adaugă Lead"
          >
            <Plus size={15} />
            <span>Adaugă Lead</span>
          </motion.button>
        </div>
      </div>
      <AICallModal />
    </header>
  );
};
