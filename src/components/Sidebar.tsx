import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Building2, 
  ClipboardList, 
  Inbox, 
  PanelLeftClose, 
  Users,
  UserCheck
} from "lucide-react";
import { Lead, isCerereLead } from "../services/leadsService";
import { Contact } from "../services/contactsService";
import { PersonalMember } from "../services/personalService";
import { getCurrentVersion } from "../utils/versionService";

export type NavSubItem = 'Lead-uri' | 'Cereri' | 'Imobile' | 'Proprietăți' | 'Contacte' | 'Clienți' | 'Personal';
export type NavTransactionType = 'Închiriere' | 'Vânzare';

interface SidebarProps {
  activeType?: NavTransactionType | 'Toate';
  activeSubItem?: NavSubItem;
  onSelectItem?: (subItem: NavSubItem) => void;
  onSelectNav?: (type: any, subItem: NavSubItem) => void;
  leads?: Lead[];
  contacts?: Contact[];
  personal?: PersonalMember[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSubItem,
  onSelectItem,
  onSelectNav,
  leads = [],
  contacts = [],
  personal = [],
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggle
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Collapsed state: support controlled or local persistence
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    return localStorage.getItem('brokr_sidebar_collapsed') === 'true';
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggleCollapse = () => {
    if (controlledToggle) {
      controlledToggle();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      localStorage.setItem('brokr_sidebar_collapsed', String(next));
    }
  };

  const handleItemClick = (subItem: NavSubItem) => {
    if (location.pathname !== '/') {
      navigate('/');
    }
    const normalizedItem = subItem === 'Proprietăți' ? 'Imobile' : (subItem === 'Clienți' ? 'Contacte' : subItem);
    if (onSelectItem) {
      onSelectItem(normalizedItem);
    } else if (onSelectNav) {
      onSelectNav(undefined, normalizedItem);
    }
  };

  // Compute live item counts based on leads, contacts, and personal
  const counts = React.useMemo(() => {
    const isCerere = (l: Lead) => isCerereLead(l);
    const isLeadItem = (l: Lead) => l.status !== 'Sterse';
    const isPropItem = (l: Lead) => !isCerere(l) && l.status !== 'Nevalidata' && l.status !== 'Calificata' && l.status !== 'Sterse';

    return {
      leads: leads.filter(isLeadItem).length,
      cereri: leads.filter(isCerere).length,
      proprietati: leads.filter(isPropItem).length,
      clienti: contacts.length,
      personal: personal.length
    };
  }, [leads, contacts, personal]);

  const isImobileActive = activeSubItem === 'Imobile' || activeSubItem === 'Proprietăți';
  const isContacteActive = activeSubItem === 'Contacte' || activeSubItem === 'Clienți';
  const versionInfo = getCurrentVersion();

  return (
    <aside 
      className={`shrink-0 h-full bg-white border-r border-gray-200 flex flex-col select-none transition-[width] duration-200 ease-in-out relative z-30 ${
        isCollapsed ? 'w-[56px]' : 'w-[230px]'
      }`}
    >
      {/* Top Header Box (Height matches the main top header: exact h-[50px]) */}
      <div className="h-[50px] shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-3.5">
        {!isCollapsed ? (
          <>
            <div 
              onClick={() => navigate('/')}
              className="flex items-center cursor-pointer select-none group"
              title="Acasă - brokr"
            >
              <span className="text-[22px] font-bold tracking-tight text-[#051D35] font-sans leading-none flex items-center">
                brokr<span className="text-[#BE9662]">.</span>
              </span>
            </div>

            <button 
              type="button"
              onClick={handleToggleCollapse}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer focus:outline-none"
              title="Restrânge meniul"
            >
              <PanelLeftClose size={15} />
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-center">
            {/* Collapsed logo: smaller version on white background without color switching */}
            <button 
              type="button"
              onClick={handleToggleCollapse}
              className="w-9 h-9 rounded-md flex items-center justify-center bg-white hover:bg-gray-100 transition-all cursor-pointer focus:outline-none"
              title="Extinde meniul (brokr)"
            >
              <span className="text-[20px] font-bold tracking-tight text-[#051D35] font-sans leading-none">
                b<span className="text-[#BE9662]">.</span>
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Main navigation container: Lead-uri, Cereri, Proprietăți, Clienți, Personal */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
        {!isCollapsed ? (
          <>
            {/* Lead-uri */}
            <button
              type="button"
              onClick={() => handleItemClick('Lead-uri')}
              className={`w-full flex items-center justify-between px-3 py-2 text-[12px] rounded-md transition-colors cursor-pointer select-none text-left ${
                activeSubItem === 'Lead-uri' && location.pathname !== '/calendar'
                  ? 'bg-[#051D35] text-white font-medium shadow-xs'
                  : 'text-gray-600 hover:text-[#051D35] hover:bg-gray-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Inbox size={14} className={activeSubItem === 'Lead-uri' && location.pathname !== '/calendar' ? 'text-[#BE9662]' : 'text-gray-400'} />
                <span className="truncate">Lead-uri</span>
              </div>
              {counts.leads > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  activeSubItem === 'Lead-uri' && location.pathname !== '/calendar' ? 'bg-white/15 text-[#BE9662]' : 'bg-gray-100 text-gray-500'
                }`}>
                  {counts.leads}
                </span>
              )}
            </button>

            {/* Cereri */}
            <button
              type="button"
              onClick={() => handleItemClick('Cereri')}
              className={`w-full flex items-center justify-between px-3 py-2 text-[12px] rounded-md transition-colors cursor-pointer select-none text-left ${
                activeSubItem === 'Cereri' && location.pathname !== '/calendar'
                  ? 'bg-[#051D35] text-white font-medium shadow-xs'
                  : 'text-gray-600 hover:text-[#051D35] hover:bg-gray-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <ClipboardList size={14} className={activeSubItem === 'Cereri' && location.pathname !== '/calendar' ? 'text-[#BE9662]' : 'text-gray-400'} />
                <span className="truncate">Cereri</span>
              </div>
              {counts.cereri > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  activeSubItem === 'Cereri' && location.pathname !== '/calendar' ? 'bg-white/15 text-[#BE9662]' : 'bg-gray-100 text-gray-500'
                }`}>
                  {counts.cereri}
                </span>
              )}
            </button>

            {/* Imobile */}
            <button
              type="button"
              onClick={() => handleItemClick('Imobile')}
              className={`w-full flex items-center justify-between px-3 py-2 text-[12px] rounded-md transition-colors cursor-pointer select-none text-left ${
                isImobileActive && location.pathname !== '/calendar'
                  ? 'bg-[#051D35] text-white font-medium shadow-xs'
                  : 'text-gray-600 hover:text-[#051D35] hover:bg-gray-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Building2 size={14} className={isImobileActive && location.pathname !== '/calendar' ? 'text-[#BE9662]' : 'text-gray-400'} />
                <span className="truncate">Imobile</span>
              </div>
              {counts.proprietati > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isImobileActive && location.pathname !== '/calendar' ? 'bg-white/15 text-[#BE9662]' : 'bg-gray-100 text-gray-500'
                }`}>
                  {counts.proprietati}
                </span>
              )}
            </button>

            {/* Contacte */}
            <button
              type="button"
              onClick={() => handleItemClick('Contacte')}
              className={`w-full flex items-center justify-between px-3 py-2 text-[12px] rounded-md transition-colors cursor-pointer select-none text-left ${
                isContacteActive && location.pathname !== '/calendar'
                  ? 'bg-[#051D35] text-white font-medium shadow-xs'
                  : 'text-gray-600 hover:text-[#051D35] hover:bg-gray-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Users size={14} className={isContacteActive && location.pathname !== '/calendar' ? 'text-[#BE9662]' : 'text-gray-400'} />
                <span className="truncate">Contacte</span>
              </div>
              {counts.clienti > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isContacteActive && location.pathname !== '/calendar' ? 'bg-white/15 text-[#BE9662]' : 'bg-gray-100 text-gray-500'
                }`}>
                  {counts.clienti}
                </span>
              )}
            </button>

            {/* Personal */}
            <button
              type="button"
              onClick={() => handleItemClick('Personal')}
              className={`w-full flex items-center justify-between px-3 py-2 text-[12px] rounded-md transition-colors cursor-pointer select-none text-left ${
                activeSubItem === 'Personal' && location.pathname !== '/calendar'
                  ? 'bg-[#051D35] text-white font-medium shadow-xs'
                  : 'text-gray-600 hover:text-[#051D35] hover:bg-gray-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <UserCheck size={14} className={activeSubItem === 'Personal' && location.pathname !== '/calendar' ? 'text-[#BE9662]' : 'text-gray-400'} />
                <span className="truncate">Personal</span>
              </div>
              {counts.personal > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  activeSubItem === 'Personal' && location.pathname !== '/calendar' ? 'bg-white/15 text-[#BE9662]' : 'bg-gray-100 text-gray-500'
                }`}>
                  {counts.personal}
                </span>
              )}
            </button>
          </>
        ) : (
          /* Collapsed View: Compact vertical icon actions with 36px x 36px (w-9 h-9) buttons */
          <div className="flex flex-col items-center space-y-2 py-1">
            <button
              type="button"
              onClick={() => handleItemClick('Lead-uri')}
              className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                activeSubItem === 'Lead-uri' && location.pathname !== '/calendar'
                  ? 'bg-[#051D35] text-[#BE9662]'
                  : 'text-gray-500 hover:text-[#051D35] hover:bg-gray-100'
              }`}
              title={`Lead-uri (${counts.leads})`}
            >
              <Inbox size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleItemClick('Cereri')}
              className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                activeSubItem === 'Cereri' && location.pathname !== '/calendar'
                  ? 'bg-[#051D35] text-[#BE9662]'
                  : 'text-gray-500 hover:text-[#051D35] hover:bg-gray-100'
              }`}
              title={`Cereri (${counts.cereri})`}
            >
              <ClipboardList size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleItemClick('Imobile')}
              className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                isImobileActive && location.pathname !== '/calendar'
                  ? 'bg-[#051D35] text-[#BE9662]'
                  : 'text-gray-500 hover:text-[#051D35] hover:bg-gray-100'
              }`}
              title={`Imobile (${counts.proprietati})`}
            >
              <Building2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleItemClick('Contacte')}
              className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                isContacteActive && location.pathname !== '/calendar'
                  ? 'bg-[#051D35] text-[#BE9662]'
                  : 'text-gray-500 hover:text-[#051D35] hover:bg-gray-100'
              }`}
              title={`Contacte (${counts.clienti})`}
            >
              <Users size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleItemClick('Personal')}
              className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                activeSubItem === 'Personal' && location.pathname !== '/calendar'
                  ? 'bg-[#051D35] text-[#BE9662]'
                  : 'text-gray-500 hover:text-[#051D35] hover:bg-gray-100'
              }`}
              title={`Personal (${counts.personal})`}
            >
              <UserCheck size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Footer: Automated Version & Update Info (replaces collapse button) */}
      <div className="shrink-0 border-t border-gray-200 bg-gray-50/80 select-none">
        {!isCollapsed ? (
          <div className="px-3 py-2.5 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[11px] font-mono font-bold text-gray-800 tracking-tight leading-tight">
                {versionInfo.versionCode}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono leading-tight pl-3 truncate">
              ({versionInfo.dateFormatted})
            </span>
          </div>
        ) : (
          <div 
            className="py-2.5 px-1 flex flex-col items-center justify-center cursor-default"
            title={versionInfo.fullDisplay}
          >
            <span className="text-[9px] font-mono font-bold text-gray-600 leading-tight">
              v{versionInfo.major}.{versionInfo.minor}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />
          </div>
        )}
      </div>
    </aside>
  );
};
