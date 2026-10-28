import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Users, 
  MapPin, 
  MessageSquare, 
  Compass, 
  CheckCircle2,
  CalendarDays,
  CalendarRange
} from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  addDays, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  isSameWeek,
  eachDayOfInterval, 
  parseISO 
} from "date-fns";
import { ro } from "date-fns/locale";
import { viewingsService, Viewing } from "../services/viewingsService";
import { ViewingDetailsModal } from "./ViewingDetailsModal";
import { Lead } from "../services/leadsService";
import { Contact } from "../services/contactsService";

export type CalendarViewMode = 'month' | 'week' | 'day';

interface CalendarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  leads?: Lead[];
  contacts?: Contact[];
  onAddActivityClick?: (defaultDate?: string, defaultHour?: string) => void;
}

export const CalendarDrawer: React.FC<CalendarDrawerProps> = ({
  isOpen,
  onClose,
  leads = [],
  contacts = [],
  onAddActivityClick
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [selectedViewing, setSelectedViewing] = useState<Viewing | null>(null);
  const [isViewingDetailsOpen, setIsViewingDetailsOpen] = useState(false);

  const todayRef = useRef<HTMLDivElement>(null);

  // Subscribe to all viewings / activities
  useEffect(() => {
    if (!isOpen) return;
    const unsub = viewingsService.subscribeToAllViewings((v) => {
      setViewings(v);
    });
    return () => unsub();
  }, [isOpen]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => subMonths(prev, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => subWeeks(prev, 1));
    } else {
      setCurrentDate(prev => subDays(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addWeeks(prev, 1));
    } else {
      setCurrentDate(prev => addDays(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Title for current view
  const currentPeriodLabel = useMemo(() => {
    if (viewMode === 'month') {
      return format(currentDate, "MMMM yyyy", { locale: ro });
    }
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      if (isSameMonth(start, end)) {
        return `${format(start, "d")} – ${format(end, "d MMMM yyyy", { locale: ro })}`;
      }
      return `${format(start, "d MMM", { locale: ro })} – ${format(end, "d MMM yyyy", { locale: ro })}`;
    }
    return format(currentDate, "EEEE, d MMMM yyyy", { locale: ro });
  }, [viewMode, currentDate]);

  // Activity click handler
  const handleActivityClick = (viewing: Viewing, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedViewing(viewing);
    setIsViewingDetailsOpen(true);
  };

  // Helper to get lead / property info
  const getViewingMeta = (viewing: Viewing) => {
    const lead = leads.find(l => l.id === viewing.propertyId || l.propertyId === viewing.propertyId);
    const contact = contacts.find(c => (c.firstName + " " + c.lastName).trim() === viewing.contactName?.trim());
    const loc = lead?.extractedData?.crmData?.detaliiGenerale?.localizare;
    const address = loc ? `${loc.strada || ''} ${loc.numar || ''}`.trim() : (lead?.zone || "");
    const propertyId = lead?.propertyId || viewing.propertyId || "";
    return { lead, contact, address, propertyId };
  };

  // Render Month View
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weekHeaders = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"];

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/70 shrink-0">
          {weekHeaders.map((dayName, idx) => (
            <div key={idx} className="py-2 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <span className="hidden sm:inline">{dayName}</span>
              <span className="sm:hidden">{dayName.slice(0, 2)}</span>
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-100 overflow-y-auto custom-scrollbar">
          {days.map((day) => {
            const dayViewings = viewings.filter(v => {
              try {
                return isSameDay(parseISO(v.date), day);
              } catch {
                return false;
              }
            });
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                onClick={() => {
                  setCurrentDate(day);
                  setViewMode('day');
                }}
                className={`min-h-[90px] p-1.5 flex flex-col transition-colors cursor-pointer group hover:bg-gray-50/70 ${
                  !isCurrentMonth ? 'bg-gray-50/40 text-gray-300' : 'bg-white'
                } ${isToday ? 'bg-[#BE9662]/[0.03] ring-1 ring-inset ring-[#BE9662]/30' : ''}`}
              >
                {/* Day Number Header */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-semibold w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                    isToday 
                      ? 'bg-[#051D35] text-white font-bold shadow-xs' 
                      : isCurrentMonth ? 'text-gray-900 group-hover:text-[#051D35]' : 'text-gray-300'
                  }`}>
                    {format(day, "d")}
                  </span>

                  {dayViewings.length > 0 && (
                    <span className="text-[9px] font-mono font-semibold px-1 rounded bg-[#BE9662]/15 text-[#051D35] border border-[#BE9662]/30">
                      {dayViewings.length}
                    </span>
                  )}
                </div>

                {/* Day Viewings List */}
                <div className="flex-1 space-y-1 overflow-hidden">
                  {dayViewings.slice(0, 2).map((viewing, vIdx) => {
                    const { address, propertyId } = getViewingMeta(viewing);
                    return (
                      <div
                        key={viewing.id || vIdx}
                        onClick={(e) => handleActivityClick(viewing, e)}
                        className="px-1.5 py-0.5 rounded bg-gray-50 hover:bg-[#051D35]/5 border border-gray-200 hover:border-[#051D35]/30 text-left transition-colors cursor-pointer truncate"
                        title={`${viewing.hour} - ${viewing.contactName} ${address ? `(${address})` : ''}`}
                      >
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-800 leading-tight truncate">
                          <span className="text-[#BE9662] font-mono text-[9px] shrink-0">{viewing.hour}</span>
                          <span className="truncate">{viewing.contactName || "Activitate"}</span>
                        </div>
                      </div>
                    );
                  })}

                  {dayViewings.length > 2 && (
                    <div className="text-[9px] text-[#BE9662] font-semibold pl-1">
                      +{dayViewings.length - 2} altele
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Week View
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="flex flex-col h-full bg-white overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/70 shrink-0">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div 
                key={day.toISOString()}
                onClick={() => {
                  setCurrentDate(day);
                  setViewMode('day');
                }}
                className={`py-2 px-1 text-center border-r border-gray-100 last:border-r-0 cursor-pointer hover:bg-gray-100/70 transition-colors ${
                  isToday ? 'bg-[#BE9662]/[0.08]' : ''
                }`}
              >
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {format(day, "EEE", { locale: ro })}
                </div>
                <div className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-md mt-0.5 ${
                  isToday ? 'bg-[#051D35] text-white shadow-xs' : 'text-gray-900'
                }`}>
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Week Day Columns */}
        <div className="flex-1 grid grid-cols-7 divide-x divide-gray-100 overflow-y-auto custom-scrollbar">
          {weekDays.map((day) => {
            const dayViewings = viewings
              .filter(v => {
                try {
                  return isSameDay(parseISO(v.date), day);
                } catch {
                  return false;
                }
              })
              .sort((a, b) => (a.hour || '').localeCompare(b.hour || ''));

            const isToday = isSameDay(day, new Date());

            return (
              <div 
                key={day.toISOString()} 
                className={`p-2 flex flex-col gap-2 min-h-full ${
                  isToday ? 'bg-[#BE9662]/[0.02]' : 'bg-white'
                }`}
              >
                {dayViewings.length > 0 ? (
                  dayViewings.map((viewing, idx) => {
                    const { address, propertyId, contact } = getViewingMeta(viewing);
                    return (
                      <div
                        key={viewing.id || idx}
                        onClick={() => handleActivityClick(viewing)}
                        className="p-2 rounded-md bg-white border border-gray-200 hover:border-[#051D35]/30 hover:shadow-xs transition-all cursor-pointer text-left group"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono font-bold text-[#BE9662] flex items-center gap-1">
                            <Clock size={10} />
                            {viewing.hour}
                          </span>
                          {propertyId && (
                            <span className="text-[9px] font-mono px-1 rounded bg-[#051D35]/5 text-[#051D35] border border-[#051D35]/15">
                              #{propertyId}
                            </span>
                          )}
                        </div>

                        <h4 className="text-[11px] font-semibold text-gray-900 leading-tight group-hover:text-[#051D35] truncate">
                          {viewing.contactName}
                        </h4>

                        {address && (
                          <p className="text-[10px] text-gray-500 truncate mt-0.5">
                            {address}
                          </p>
                        )}

                        <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[9px] text-gray-400">
                          <span className="font-medium text-gray-600">Activitate</span>
                          {contact?.phone && (
                            <span className="text-emerald-700 font-mono">WhatsApp</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div 
                    onClick={() => onAddActivityClick?.(format(day, "yyyy-MM-dd"))}
                    className="flex-1 flex flex-col items-center justify-center p-3 rounded border border-dashed border-gray-200 hover:border-[#BE9662] hover:bg-[#BE9662]/5 transition-colors cursor-pointer text-center group"
                  >
                    <Plus size={14} className="text-gray-300 group-hover:text-[#BE9662] mb-1" />
                    <span className="text-[9px] text-gray-400 group-hover:text-gray-700 font-medium">
                      + Adaugă
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Day View (Half-hour slots)
  const renderDayView = () => {
    // Generate half-hour slots from 08:00 to 20:30 and 21:00
    const hours: string[] = [];
    for (let h = 8; h <= 20; h++) {
      const hStr = h.toString().padStart(2, "0");
      hours.push(`${hStr}:00`);
      hours.push(`${hStr}:30`);
    }
    hours.push("21:00");

    const timeToMinutes = (t?: string): number => {
      if (!t) return -1;
      const parts = t.trim().split(":");
      const h = parseInt(parts[0], 10);
      const m = parts[1] ? parseInt(parts[1], 10) : 0;
      if (isNaN(h)) return -1;
      return h * 60 + (isNaN(m) ? 0 : m);
    };

    const dayViewings = viewings.filter(v => {
      try {
        return isSameDay(parseISO(v.date), currentDate);
      } catch {
        return false;
      }
    });

    const isToday = isSameDay(currentDate, new Date());

    return (
      <div className="flex flex-col h-full bg-white overflow-hidden">
        {/* Day Header Banner */}
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 capitalize">
                {format(currentDate, "EEEE, d MMMM yyyy", { locale: ro })}
              </h3>
              {isToday && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#051D35] text-white">
                  Azi
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              {dayViewings.length === 0 
                ? "Nicio activitate programată pentru această zi" 
                : `${dayViewings.length} ${dayViewings.length === 1 ? 'activitate programată' : 'activități programate'}`}
            </p>
          </div>

          <button
            onClick={() => onAddActivityClick?.(format(currentDate, "yyyy-MM-dd"), "09:00")}
            className="h-8 px-3 rounded-md bg-[#051D35] hover:bg-[#0a2b4a] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} className="text-[#BE9662]" />
            <span>Adaugă la această dată</span>
          </button>
        </div>

        {/* Half-hourly Timeline */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-4 space-y-1.5 custom-scrollbar">
          {hours.map((hourSlot) => {
            const isFullHour = hourSlot.endsWith(":00");
            const slotStartMin = timeToMinutes(hourSlot);
            const slotEndMin = slotStartMin + 30;

            const matchedViewings = dayViewings.filter(v => {
              const vMin = timeToMinutes(v.hour);
              if (vMin === -1) {
                return (v.hour || "").trim() === hourSlot;
              }
              return vMin >= slotStartMin && vMin < slotEndMin;
            });

            return (
              <div key={hourSlot} className={`flex items-start gap-3.5 ${isFullHour ? 'pt-2' : 'pt-1'}`}>
                {/* Time Label */}
                <div className="w-12 text-right shrink-0 pt-0.5 select-none">
                  <span className={`font-mono text-xs ${
                    isFullHour 
                      ? 'font-bold text-gray-800' 
                      : 'font-medium text-gray-400 text-[11px]'
                  }`}>
                    {hourSlot}
                  </span>
                </div>

                {/* Timeline Slot Content */}
                <div className="flex-1 min-w-0">
                  {matchedViewings.length > 0 ? (
                    <div className="space-y-2">
                      {matchedViewings.map((viewing, idx) => {
                        const { address, propertyId, contact } = getViewingMeta(viewing);
                        return (
                          <div
                            key={viewing.id || idx}
                            onClick={() => handleActivityClick(viewing)}
                            className="p-3 rounded-lg border border-gray-200 bg-white hover:border-[#051D35]/30 hover:shadow-xs transition-all cursor-pointer group"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-md bg-[#BE9662]/15 border border-[#BE9662]/30 text-[#BE9662] flex items-center justify-center shrink-0 mt-0.5">
                                  <Compass size={15} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#051D35] truncate">
                                      {viewing.contactName}
                                    </h4>
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#BE9662]/15 text-[#051D35] border border-[#BE9662]/30 font-semibold">
                                      {viewing.hour}
                                    </span>
                                    {propertyId && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#051D35]/5 text-[#051D35] border border-[#051D35]/15">
                                        #{propertyId}
                                      </span>
                                    )}
                                  </div>

                                  {address && (
                                    <p className="text-[11px] text-gray-600 flex items-center gap-1.5 mt-0.5 font-medium truncate">
                                      <MapPin size={11} className="text-gray-400 shrink-0" />
                                      <span className="truncate">{address}</span>
                                    </p>
                                  )}

                                  {viewing.agentName && (
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                      Agent: <span className="text-gray-700 font-medium">{viewing.agentName}</span>
                                    </p>
                                  )}
                                </div>
                              </div>

                              {contact?.phone && (
                                <a
                                  href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-7 px-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                                  title="Trimite mesaj WhatsApp"
                                >
                                  <MessageSquare size={12} />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div 
                      onClick={() => onAddActivityClick?.(format(currentDate, "yyyy-MM-dd"), hourSlot)}
                      className="h-7 px-2.5 rounded-md border border-dashed border-gray-200 hover:border-[#051D35]/30 hover:bg-gray-50 flex items-center text-gray-400 hover:text-gray-700 text-xs font-medium cursor-pointer transition-colors group"
                    >
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[11px]">
                        <Plus size={11} className="text-[#BE9662]" />
                        Programează activitate la {hourSlot}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[999]"
            />

            {/* Calendar Drawer Menu */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 right-0 w-[780px] max-w-full h-full bg-white z-[1000] flex flex-col border-l border-gray-200 shadow-2xl overflow-hidden"
            >
              {/* 1. Header */}
              <div className="p-4 border-b border-gray-200 bg-white shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#051D35]/5 border border-[#051D35]/15 text-[#051D35] flex items-center justify-center shrink-0">
                      <CalendarIcon size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-[14px] font-bold text-gray-900 tracking-tight leading-tight">
                          Calendar Activități
                        </h2>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#BE9662]/15 text-[#051D35] border border-[#BE9662]/30">
                          {viewings.length} în total
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5">
                        Gestionează vizionările și întâlnirile programate
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Închide"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* 2. Top Controls & View Mode Filter Tabs */}
                <div className="mt-3.5 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  {/* View Mode Switcher Pills */}
                  <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-md">
                    <button
                      onClick={() => setViewMode('month')}
                      className={`h-7 px-3 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        viewMode === 'month'
                          ? 'bg-[#051D35] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <CalendarDays size={13} />
                      <span>Lună</span>
                    </button>

                    <button
                      onClick={() => setViewMode('week')}
                      className={`h-7 px-3 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        viewMode === 'week'
                          ? 'bg-[#051D35] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <CalendarRange size={13} />
                      <span>Săptămână</span>
                    </button>

                    <button
                      onClick={() => setViewMode('day')}
                      className={`h-7 px-3 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        viewMode === 'day'
                          ? 'bg-[#051D35] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Clock size={13} />
                      <span>Zi</span>
                    </button>
                  </div>

                  {/* Date Navigation between periods */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToday}
                      className="h-7 px-2.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Azi
                    </button>

                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md p-0.5">
                      <button
                        onClick={handlePrev}
                        className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:bg-white hover:text-gray-900 transition-colors cursor-pointer"
                        title="Perioada precedentă"
                      >
                        <ChevronLeft size={14} />
                      </button>

                      <span className="text-xs font-bold text-gray-900 px-2 min-w-[140px] text-center capitalize select-none">
                        {currentPeriodLabel}
                      </span>

                      <button
                        onClick={handleNext}
                        className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:bg-white hover:text-gray-900 transition-colors cursor-pointer"
                        title="Perioada următoare"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Main Calendar View Content */}
              <div className="flex-1 overflow-hidden relative">
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
              </div>

              {/* 4. Fixed Action Buttons at Base */}
              <div className="shrink-0 p-3.5 border-t border-gray-200 bg-white flex items-center justify-between gap-3">
                <button
                  onClick={() => onAddActivityClick?.(format(currentDate, "yyyy-MM-dd"))}
                  className="h-9 px-4 rounded-lg bg-[#051D35] hover:bg-[#0a2b4a] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer select-none"
                >
                  <Plus size={14} className="text-[#BE9662]" />
                  <span>Adaugă Activitate</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToday}
                    className="h-9 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer select-none"
                  >
                    Mergi la Azi
                  </button>
                  <button
                    onClick={onClose}
                    className="h-9 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold transition-colors cursor-pointer select-none"
                  >
                    Închide
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Activity / Viewing Details Modal */}
      <ViewingDetailsModal
        isOpen={isViewingDetailsOpen}
        onClose={() => setIsViewingDetailsOpen(false)}
        viewing={selectedViewing}
      />
    </>
  );
};
