import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Building2, 
  ClipboardList, 
  Inbox, 
  PanelLeftClose, 
  PanelLeft,
  Users,
  UserCheck
} from "lucide-react";
import { Lead } from "../services/leadsService";
import { Contact } from "../services/contactsService";
import { PersonalMember } from "../services/personalService";

export type NavSubItem = 'Lead-uri' | 'Cereri' | 'Proprietăți' | 'Clienți' | 'Contacte' | 'Personal';
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
    const normalizedItem = subItem === 'Contacte' ? 'Clienți' : subItem;
    if (onSelectItem) {
      onSelectItem(normalizedItem);
    } else if (onSelectNav) {
      onSelectNav(undefined, normalizedItem);
    }
  };

  // Compute live item counts based on leads, contacts, and personal
  const counts = React.useMemo(() => {
    const isCerere = (l: Lead) => l.status === 'AreInteres' || 
                                  (l.title && l.title.toLowerCase().startsWith('cerere')) || 
                                  (l.notes && l.notes.toLowerCase().includes('cerere'));

    const isLeadItem = (l: Lead) => l.status === 'Nevalidata' || l.status === 'Calificata';
    const isPropItem = (l: Lead) => !isCerere(l) && !isLeadItem(l) && l.status !== 'Sterse';

    return {
      leads: leads.filter(isLeadItem).length,
      cereri: leads.filter(isCerere).length,
      proprietati: leads.filter(isPropItem).length,
      clienti: contacts.length,
      personal: personal.length
    };
  }, [leads, contacts, personal]);

  const isClientiActive = activeSubItem === 'Clienți' || activeSubItem === 'Contacte';

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
            {/* Collapsed square container with exact same dimensions (w-9 h-9) as the menu buttons below */}
            <button 
              type="button"
              onClick={handleToggleCollapse}
              className="w-9 h-9 rounded-md flex items-center justify-center bg-[#051D35] text-white hover:opacity-95 transition-all cursor-pointer focus:outline-none shadow-xs"
              title="Extinde meniul (brokr)"
            >
              <span className="text-[17px] font-bold tracking-tight text-white font-sans leading-none">
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

            {/* Proprietăți */}
            <button
              type="button"
              onClick={() => handleItemClick('Proprietăți')}
              className={`w-full flex items-center justify-between px-3 py-2 text-[12px] rounded-md transition-colors cursor-pointer select-none text-left ${
                activeSubItem === 'Proprietăți' && location.pathname !== '/calendar'
                  ? 'bg-[#051D35] text-white font-medium shadow-xs'
                  : 'text-gray-600 hover:text-[#051D35] hover:bg-gray-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Building2 size={14} className={activeSubItem === 'Proprietăți' && location.pathname !== '/calendar' ? 'text-[#BE9662]' : 'text-gray-400'} />
                <span className="truncate">Proprietăți</span>
              </div>
              {counts.proprietati > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  activeSubItem === 'Proprietăți' && location.pathname !== '/calendar' ? 'bg-white/15 text-[#BE9662]' : 'bg-gray-100 text-gray-500'
                }`}>
                  {counts.proprietati}
                </span>
              )}
            </button>

            {/* Clienți */}
            <button
              type="button"
              onClick={() => handleItemClick('Clienți')}
              className={`w-full flex items-center justify-between px-3 py-2 text-[12px] rounded-md transition-colors cursor-pointer select-none text-left ${
                isClientiActive && location.pathname !== '/calendar'
                  ? 'bg-[#051D35] text-white font-medium shadow-xs'
                  : 'text-gray-600 hover:text-[#051D35] hover:bg-gray-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Users size={14} className={isClientiActive && location.pathname !== '/calendar' ? 'text-[#BE9662]' : 'text-gray-400'} />
                <span className="truncate">Clienți</span>
              </div>
              {counts.clienti > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isClientiActive && location.pathname !== '/calendar' ? 'bg-white/15 text-[#BE9662]' : 'bg-gray-100 text-gray-500'
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
              onClick={() => handleItemClick('Proprietăți')}
              className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                activeSubItem === 'Proprietăți' && location.pathname !== '/calendar'
                  ? 'bg-[#051D35] text-[#BE9662]'
                  : 'text-gray-500 hover:text-[#051D35] hover:bg-gray-100'
              }`}
              title={`Proprietăți (${counts.proprietati})`}
            >
              <Building2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleItemClick('Clienți')}
              className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                isClientiActive && location.pathname !== '/calendar'
                  ? 'bg-[#051D35] text-[#BE9662]'
                  : 'text-gray-500 hover:text-[#051D35] hover:bg-gray-100'
              }`}
              title={`Clienți (${counts.clienti})`}
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

      {/* Bottom Footer Action: Collapse / Expand toggle button */}
      <div className="shrink-0 border-t border-gray-200 p-2 bg-white">
        {!isCollapsed ? (
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-gray-500 hover:text-[#051D35] hover:bg-gray-100/70 rounded-md transition-colors cursor-pointer"
            title="Restrânge bara laterală"
          >
            <PanelLeftClose size={15} className="shrink-0" />
            <span>Restrânge</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="w-full flex items-center justify-center py-2 text-gray-500 hover:text-[#051D35] hover:bg-gray-100/70 rounded-md transition-colors cursor-pointer"
            title="Extinde bara laterală"
          >
            <PanelLeft size={16} />
          </button>
        )}
      </div>
    </aside>
  );
};
