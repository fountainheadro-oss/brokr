import React, { useState, useEffect, useRef, useMemo } from "react";
import { Plus, Bell, UserPlus, Calendar, ChevronDown, Building2, ClipboardList, Search, X, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { leadsService, Lead } from "../services/leadsService";
import { contactsService, Contact } from "../services/contactsService";
import { AICallModal } from "./AICall";

interface HeaderProps {
  onAddClick: () => void;
  onAddContactClick?: () => void;
  onAddCerereClick?: () => void;
  onNotificationsClick: () => void;
  onExtractionRulesClick?: () => void;
  onSelectLead?: (lead: Lead) => void;
  onSelectContact?: (contact: Contact) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onAddClick, 
  onAddContactClick, 
  onAddCerereClick,
  onNotificationsClick,
  onSelectLead,
  onSelectContact,
  searchQuery = "",
  onSearchChange
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCalendar = location.pathname === '/calendar';

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search state
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);

  // Subscribe to live data for the search engine
  useEffect(() => {
    const unsubLeads = leadsService.subscribeToLeads((leads) => {
      setAllLeads(leads);
    });
    const unsubContacts = contactsService.subscribeToContacts((contacts) => {
      setAllContacts(contacts);
    });
    return () => {
      unsubLeads();
      unsubContacts();
    };
  }, []);

  // Sync external searchQuery with localQuery
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleQueryChange = (val: string) => {
    setLocalQuery(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
    setIsSearchOpen(val.trim().length > 0);
  };


  // Click-outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Compute search results categorized into: Proprietăți, Cereri, Contacte
  const { matchedProperties, matchedCereri, matchedContacts, totalResults } = useMemo(() => {
    const q = localQuery.toLowerCase().trim();
    if (!q) {
      return { matchedProperties: [], matchedCereri: [], matchedContacts: [], totalResults: 0 };
    }

    // 1. Cereri: Leads in 'AreInteres' or starting with 'cerere' or with cerere notes
    const cereri = allLeads.filter(l => {
      const isCerere = l.status === 'AreInteres' || 
                       (l.title && l.title.toLowerCase().startsWith('cerere')) || 
                       (l.notes && l.notes.toLowerCase().includes('cerere'));
      if (!isCerere) return false;

      const titleMatch = (l.title || "").toLowerCase().includes(q);
      const nameMatch = (l.ownerName || "").toLowerCase().includes(q);
      const phoneMatch = (l.ownerPhone || "").toLowerCase().includes(q);
      const zoneMatch = (l.zone || "").toLowerCase().includes(q);
      const priceMatch = (l.price || "").toLowerCase().includes(q);
      const notesMatch = (l.notes || "").toLowerCase().includes(q);
      return titleMatch || nameMatch || phoneMatch || zoneMatch || priceMatch || notesMatch;
    }).slice(0, 5);

    // 2. Proprietăți: All other leads (properties on market, archive, etc.)
    const properties = allLeads.filter(l => {
      const isCerere = l.status === 'AreInteres' || 
                       (l.title && l.title.toLowerCase().startsWith('cerere'));
      if (isCerere) return false;

      const titleMatch = (l.title || "").toLowerCase().includes(q);
      const zoneMatch = (l.zone || "").toLowerCase().includes(q);
      const priceMatch = (l.price || "").toLowerCase().includes(q);
      const nameMatch = (l.ownerName || "").toLowerCase().includes(q);
      const phoneMatch = (l.ownerPhone || "").toLowerCase().includes(q);
      const idMatch = (l.propertyId || l.id || "").toLowerCase().includes(q);
      const catMatch = (l.categoria || "").toLowerCase().includes(q);
      return titleMatch || zoneMatch || priceMatch || nameMatch || phoneMatch || idMatch || catMatch;
    }).slice(0, 5);

    // 3. Contacte: Contacts list
    const contacts = allContacts.filter(c => {
      const fullName = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
      const nameMatch = fullName.includes(q);
      const phoneMatch = (c.phone || "").toLowerCase().includes(q);
      const typeMatch = (c.type || "").toLowerCase().includes(q);
      const propIdMatch = (c.propertyId || "").toLowerCase().includes(q);
      return nameMatch || phoneMatch || typeMatch || propIdMatch;
    }).slice(0, 5);

    return {
      matchedProperties: properties,
      matchedCereri: cereri,
      matchedContacts: contacts,
      totalResults: properties.length + cereri.length + contacts.length
    };
  }, [allLeads, allContacts, localQuery]);

  const handleSelectProperty = (lead: Lead) => {
    setIsSearchOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
    }
    onSelectLead?.(lead);
  };

  const handleSelectContact = (contact: Contact) => {
    setIsSearchOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
    }
    onSelectContact?.(contact);
  };

  return (
    <header className="shrink-0 bg-white border-b border-gray-200 shadow-none relative z-[100] h-[50px]">
      <div className="h-full flex justify-between items-stretch">
        {/* Center section: Global Search Bar spanning all remaining space */}
        <div className="group flex-1 h-full min-w-0 relative flex items-center bg-white hover:bg-gray-50/60 focus-within:bg-gray-50 transition-colors" ref={searchContainerRef}>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-gray-700 group-hover:text-gray-500 transition-colors">
            <Search size={15} className="shrink-0 block" />
          </div>
          <input
            type="text"
            value={localQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => {
              if (localQuery.trim().length > 0) {
                setIsSearchOpen(true);
              }
            }}
            placeholder="Caută proprietăți, cereri sau contacte..."
            className="w-full h-full pl-11 pr-10 text-xs leading-[50px] text-gray-900 placeholder:text-gray-400 bg-transparent border-0 focus:outline-none focus:ring-0 font-sans cursor-text"
          />
          {localQuery && (
            <div className="absolute inset-y-0 right-3.5 flex items-center">
              <button
                type="button"
                onClick={() => handleQueryChange("")}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
                title="Șterge căutarea"
              >
                <X size={14} className="shrink-0 block" />
              </button>
            </div>
          )}

          {/* Instant Search Results Dropdown */}
          {isSearchOpen && localQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-0 bg-white border border-gray-200 border-t-0 shadow-2xl z-[250] max-h-[460px] overflow-y-auto divide-y divide-gray-100">
              {totalResults === 0 ? (
                <div className="py-8 px-4 text-center text-xs text-gray-500">
                  Niciun rezultat găsit pentru <span className="font-semibold text-gray-800">"{localQuery}"</span>
                </div>
              ) : (
                <>
                  {/* 1. Proprietăți */}
                  {matchedProperties.length > 0 && (
                    <div>
                      <div className="px-4 py-1.5 bg-gray-50/90 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Building2 size={12} className="text-gray-400" />
                          Proprietăți ({matchedProperties.length})
                        </span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {matchedProperties.map((lead) => (
                          <div
                            key={lead.id}
                            onClick={() => handleSelectProperty(lead)}
                            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50/80 transition-colors cursor-pointer text-left select-none"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-3">
                              <div className="w-7 h-7 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                <Building2 size={14} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-gray-900 truncate">
                                  {lead.title || "Proprietate fără titlu"}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate flex items-center gap-2 mt-0.5">
                                  <span>{lead.zone || "Zonă nespecificată"}</span>
                                  <span>•</span>
                                  <span className="font-mono font-medium text-gray-700">{lead.price}</span>
                                  {lead.ownerPhone && lead.ownerPhone !== "Nespecificat" && (
                                    <>
                                      <span>•</span>
                                      <span>{lead.ownerPhone}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600 shrink-0">
                              {lead.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Cereri */}
                  {matchedCereri.length > 0 && (
                    <div>
                      <div className="px-4 py-1.5 bg-amber-50/50 text-[10px] font-bold uppercase tracking-wider text-amber-800 border-b border-amber-100/60 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <ClipboardList size={12} className="text-amber-600" />
                          Cereri ({matchedCereri.length})
                        </span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {matchedCereri.map((cerere) => (
                          <div
                            key={cerere.id}
                            onClick={() => handleSelectProperty(cerere)}
                            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-amber-50/30 transition-colors cursor-pointer text-left select-none"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-3">
                              <div className="w-7 h-7 rounded-md bg-amber-100/60 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                                <ClipboardList size={14} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-gray-900 truncate">
                                  {cerere.title || "Cerere fără titlu"}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate flex items-center gap-2 mt-0.5">
                                  <span>Client: {cerere.ownerName || "Nespecificat"}</span>
                                  <span>•</span>
                                  <span className="font-mono text-gray-700">{cerere.ownerPhone}</span>
                                  <span>•</span>
                                  <span>Buget: {cerere.price}</span>
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700 shrink-0">
                              Cerere
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Contacte */}
                  {matchedContacts.length > 0 && (
                    <div>
                      <div className="px-4 py-1.5 bg-emerald-50/40 text-[10px] font-bold uppercase tracking-wider text-emerald-800 border-b border-emerald-100/60 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <User size={12} className="text-emerald-600" />
                          Contacte ({matchedContacts.length})
                        </span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {matchedContacts.map((contact) => (
                          <div
                            key={contact.id}
                            onClick={() => handleSelectContact(contact)}
                            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-emerald-50/30 transition-colors cursor-pointer text-left select-none"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-3">
                              <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                <User size={14} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-gray-900 truncate">
                                  {contact.firstName} {contact.lastName}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate flex items-center gap-2 mt-0.5">
                                  <span className="font-mono">{contact.phone}</span>
                                  {contact.propertyId && (
                                    <>
                                      <span>•</span>
                                      <span>Prop: {contact.propertyId}</span>
                                    </>
                                  )}
                                  {contact.commissionValue && (
                                    <>
                                      <span>•</span>
                                      <span>Comision: {contact.commissionValue}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 shrink-0">
                              {contact.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
   
        {/* Right actions */}
        <div className="flex items-stretch h-full shrink-0">
          {/* Calendar (icon-only) */}
          <button 
            type="button"
            onClick={() => navigate('/calendar')}
            className={`h-full px-[20px] w-auto flex items-center justify-center border-l border-gray-200 transition-colors cursor-pointer select-none focus:outline-none ${
              isCalendar 
                ? 'bg-gray-100 text-gray-900 font-semibold' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
            title="Calendar"
          >
            <Calendar size={16} className="shrink-0 block" />
          </button>

          {/* Alerte (Notificări) - right next to Adaugă */}
          <button 
            type="button"
            onClick={onNotificationsClick}
            className="h-full px-[20px] w-auto flex items-center justify-center border-l border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors relative cursor-pointer select-none shrink-0 focus:outline-none"
            title="Alerte și Notificări"
          >
            <div className="w-2 h-2 bg-indigo-600 rounded-full absolute top-[13px] right-[14px] border border-white" />
            <Bell size={16} className="shrink-0 block" />
          </button>
  
          {/* Adaugă Split Button */}
          <div className="relative h-full flex items-stretch border-l border-gray-200 shrink-0" ref={dropdownRef}>
            {/* Left direct action button: executes first option (Adaugă proprietate) */}
            <button 
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                onAddClick();
              }}
              className="h-full px-[20px] w-auto flex items-center justify-center gap-1.5 text-xs font-medium bg-gray-900 hover:bg-black text-white transition-colors cursor-pointer select-none focus:outline-none"
              title="Adaugă proprietate"
            >
              <Plus size={15} className="shrink-0 block" />
              <span className="leading-none flex items-center">Adaugă</span>
            </button>

            {/* Right independent chevron toggle button */}
            <button 
              type="button"
              onClick={() => setDropdownOpen(prev => !prev)}
              className={`h-full px-3 w-auto flex items-center justify-center bg-gray-900 hover:bg-black text-white transition-colors cursor-pointer select-none border-l border-gray-800 focus:outline-none ${
                dropdownOpen ? 'bg-black' : ''
              }`}
              title="Opțiuni adăugare"
              aria-expanded={dropdownOpen}
            >
              <ChevronDown 
                size={14} 
                className={`shrink-0 block transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Dropdown Menu (48px item heights, styled similarly to main menu) */}
            {dropdownOpen && (
              <div 
                className="absolute right-0 top-full mt-0 w-[220px] bg-white border border-gray-200 shadow-xl z-[250] divide-y divide-gray-200 overflow-hidden"
              >
                {/* Option 1: Adaugă proprietate */}
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onAddClick();
                  }}
                  className="w-full h-[48px] px-4 flex items-center gap-3 text-xs font-medium text-gray-800 hover:bg-gray-50 transition-colors text-left cursor-pointer focus:outline-none select-none"
                >
                  <Building2 size={16} className="text-gray-500 shrink-0 block" />
                  <span className="leading-none flex items-center">Adaugă proprietate</span>
                </button>

                {/* Option 2: Adaugă cerere */}
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onAddCerereClick) {
                      onAddCerereClick();
                    } else {
                      onAddClick();
                    }
                  }}
                  className="w-full h-[48px] px-4 flex items-center gap-3 text-xs font-medium text-gray-800 hover:bg-gray-50 transition-colors text-left cursor-pointer focus:outline-none select-none"
                >
                  <ClipboardList size={16} className="text-gray-500 shrink-0 block" />
                  <span className="leading-none flex items-center">Adaugă cerere</span>
                </button>

                {/* Option 3: Adaugă contact */}
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onAddContactClick) {
                      onAddContactClick();
                    }
                  }}
                  className="w-full h-[48px] px-4 flex items-center gap-3 text-xs font-medium text-gray-800 hover:bg-gray-50 transition-colors text-left cursor-pointer focus:outline-none select-none"
                >
                  <UserPlus size={16} className="text-gray-500 shrink-0 block" />
                  <span className="leading-none flex items-center">Adaugă contact</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <AICallModal />
    </header>
  );
};
