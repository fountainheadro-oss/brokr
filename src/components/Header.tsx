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
    <header className="shrink-0 bg-white border-[#eee] border-b shadow-sm relative z-[100]">
      <div className="h-[96px] flex justify-between items-center px-5">
        <div className="flex items-center gap-2">
          <button 
            onClick={onNotificationsClick}
            className="w-12 h-12 flex items-center justify-center bg-white rounded-full cursor-pointer hover:bg-gray-50 transition-colors relative"
          >
            <div className="w-2.5 h-2.5 bg-[--color-accent] rounded-full absolute top-2 right-2 border-2 border-white" />
            <Bell size={24} className="text-[rgb(51,51,51)]" />
          </button>

          {/* Wipe All button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleWipe}
            className={`w-12 h-12 flex flex-col items-center justify-center rounded-full cursor-pointer transition-all ${
              confirmWipe 
                ? "bg-red-500 text-white animate-pulse shadow-md" 
                : "bg-white hover:bg-red-50 text-gray-500 hover:text-red-500 border border-gray-100"
            }`}
            title={confirmWipe ? "Apasă din nou pentru a confirma ștergerea tuturor proprietăților!" : "Șterge definitiv toate proprietățile din baza de date"}
          >
            {confirmWipe ? (
              <span className="text-[10px] font-bold tracking-tight">CONFIRM</span>
            ) : (
              <Trash2 size={20} />
            )}
          </motion.button>
        </div>
        
        <div className="flex-1 flex justify-center items-center">
          <span 
            onClick={() => navigate('/')}
            className="font-montserrat text-3xl font-extrabold tracking-tight text-gray-900 cursor-pointer"
          >
            brokr<span className="ml-[-1px]" style={{ color: "var(--color-accent)" }}>.</span>
          </span>
        </div>
   
        <div className="flex items-center gap-1">
          <AICallButtons />
          
          {onExtractionRulesClick && (
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={onExtractionRulesClick}
              className="w-12 h-12 flex items-center justify-center bg-white rounded-full cursor-pointer hover:bg-gray-50 text-[rgb(51,51,51)] transition-colors"
              title="Reguli Extragere Contacte"
            >
              <Sliders size={20} strokeWidth={2.5} />
            </motion.button>
          )}
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/calendar')}
            className={`w-12 h-12 flex items-center justify-center rounded-full cursor-pointer transition-colors ${isCalendar ? 'bg-[--color-accent]/10 text-[--color-accent]' : 'bg-white hover:bg-gray-50 text-[rgb(51,51,51)]'}`}
            title="Calendar Vizionări"
          >
            <Calendar size={22} strokeWidth={isCalendar ? 2.5 : 2} />
          </motion.button>
  
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={onAddContactClick}
            className="w-12 h-12 flex items-center justify-center bg-white rounded-full cursor-pointer hover:bg-gray-50 transition-colors"
            title="Adaugă Contact"
          >
            <UserPlus size={22} strokeWidth={2.5} className="text-[rgb(51,51,51)]" />
          </motion.button>
  
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={onAddClick}
            className="w-12 h-12 flex items-center justify-center bg-white rounded-full cursor-pointer hover:bg-gray-50 transition-colors"
            title="Adaugă Lead"
          >
            <Plus size={24} strokeWidth={2.5} className="text-[rgb(51,51,51)]" />
          </motion.button>
        </div>
      </div>
      <AICallModal />
    </header>
  );
};
