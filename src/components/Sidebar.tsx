import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  KeyRound, 
  Tag, 
  Building2, 
  ClipboardList, 
  Inbox, 
  ChevronDown, 
  PanelLeftClose, 
  PanelLeft
} from "lucide-react";
import { Lead } from "../services/leadsService";

export type NavSubItem = 'Lead-uri' | 'Cereri' | 'Proprietăți';
export type NavTransactionType = 'Închiriere' | 'Vânzare';

interface SidebarProps {
  activeType?: NavTransactionType | 'Toate';
  activeSubItem?: NavSubItem;
  onSelectNav?: (type: NavTransactionType, subItem: NavSubItem) => void;
  leads?: Lead[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeType,
  activeSubItem,
  onSelectNav,
  leads = [],
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

  // Accordion states: both open by default
  const [openInchirieri, setOpenInchirieri] = useState(true);
  const [openVanzari, setOpenVanzari] = useState(true);

  // Helper to check active state
  const isActive = (type: NavTransactionType, subItem: NavSubItem) => {
    if (location.pathname === '/calendar') return false;
    return activeType === type && activeSubItem === subItem;
  };

  const handleItemClick = (type: NavTransactionType, subItem: NavSubItem) => {
    if (location.pathname !== '/') {
      navigate('/');
    }
    if (onSelectNav) {
      onSelectNav(type, subItem);
    }
  };

  // Compute live item counts based on leads
  const counts = React.useMemo(() => {
    const isTypeMatch = (leadType: string | undefined, target: 'Închiriere' | 'Vânzare') => {
      if (!leadType) return false;
      if (target === 'Închiriere') return leadType === 'Închiriere' || leadType === 'Inchiriere';
      if (target === 'Vânzare') return leadType === 'Vânzare' || leadType === 'Vanzare';
      return leadType === target;
    };

    const inchirieriLeads = leads.filter(l => isTypeMatch(l.transactionType as string, 'Închiriere'));
    const vanzariLeads = leads.filter(l => isTypeMatch(l.transactionType as string, 'Vânzare'));

    const isCerere = (l: Lead) => l.status === 'AreInteres' || 
                                  (l.title && l.title.toLowerCase().startsWith('cerere')) || 
                                  (l.notes && l.notes.toLowerCase().includes('cerere'));

    const isLeadItem = (l: Lead) => l.status === 'Nevalidata' || l.status === 'Calificata';
    const isPropItem = (l: Lead) => !isCerere(l) && !isLeadItem(l) && l.status !== 'Sterse';

    return {
      inchirieri: {
        leads: inchirieriLeads.filter(isLeadItem).length,
        cereri: inchirieriLeads.filter(isCerere).length,
        proprietati: inchirieriLeads.filter(isPropItem).length,
      },
      vanzari: {
        leads: vanzariLeads.filter(isLeadItem).length,
        cereri: vanzariLeads.filter(isCerere).length,
        proprietati: vanzariLeads.filter(isPropItem).length,
      }
    };
  }, [leads]);

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
              className="flex items-center gap-2 cursor-pointer select-none group"
              title="Acasă - brokr crm"
            >
              <span className="text-[16px] font-bold tracking-tight text-gray-900 font-sans leading-none flex items-center">
                brokr<span className="text-indigo-600">.</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase border border-gray-200 px-1.5 py-0.5 rounded bg-gray-50/90 leading-none flex items-center group-hover:text-gray-600 transition-colors">
                crm
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
            <button 
              type="button"
              onClick={handleToggleCollapse}
              className="p-1.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors cursor-pointer focus:outline-none flex items-center justify-center"
              title="Extinde meniul (brokr crm)"
            >
              <span className="text-[16px] font-bold tracking-tight text-gray-900 font-sans leading-none">
                b<span className="text-indigo-600">.</span>
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Main navigation container below the top box */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-4">
        {!isCollapsed ? (
          <>
            {/* Accordion 1: Închirieri */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setOpenInchirieri(prev => !prev)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors cursor-pointer select-none group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <KeyRound size={14} className="text-indigo-600 shrink-0" />
                  <span className="tracking-tight truncate text-[12px]">Închirieri</span>
                </div>
                <ChevronDown 
                  size={13} 
                  className={`text-gray-400 transition-transform duration-200 shrink-0 ${openInchirieri ? 'rotate-0' : '-rotate-90'}`}
                />
              </button>

              {openInchirieri && (
                <div className="ml-2 pl-2 border-l border-gray-200 space-y-0.5 pt-0.5">
                  {/* Lead-uri */}
                  <button
                    type="button"
                    onClick={() => handleItemClick('Închiriere', 'Lead-uri')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] rounded-md transition-colors cursor-pointer select-none text-left ${
                      isActive('Închiriere', 'Lead-uri')
                        ? 'bg-gray-900 text-white font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Inbox size={13} className={isActive('Închiriere', 'Lead-uri') ? 'text-white' : 'text-gray-400'} />
                      <span className="truncate">Lead-uri</span>
                    </div>
                    {counts.inchirieri.leads > 0 && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isActive('Închiriere', 'Lead-uri') ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {counts.inchirieri.leads}
                      </span>
                    )}
                  </button>

                  {/* Cereri */}
                  <button
                    type="button"
                    onClick={() => handleItemClick('Închiriere', 'Cereri')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] rounded-md transition-colors cursor-pointer select-none text-left ${
                      isActive('Închiriere', 'Cereri')
                        ? 'bg-gray-900 text-white font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ClipboardList size={13} className={isActive('Închiriere', 'Cereri') ? 'text-white' : 'text-gray-400'} />
                      <span className="truncate">Cereri</span>
                    </div>
                    {counts.inchirieri.cereri > 0 && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isActive('Închiriere', 'Cereri') ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {counts.inchirieri.cereri}
                      </span>
                    )}
                  </button>

                  {/* Proprietăți */}
                  <button
                    type="button"
                    onClick={() => handleItemClick('Închiriere', 'Proprietăți')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] rounded-md transition-colors cursor-pointer select-none text-left ${
                      isActive('Închiriere', 'Proprietăți')
                        ? 'bg-gray-900 text-white font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 size={13} className={isActive('Închiriere', 'Proprietăți') ? 'text-white' : 'text-gray-400'} />
                      <span className="truncate">Proprietăți</span>
                    </div>
                    {counts.inchirieri.proprietati > 0 && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isActive('Închiriere', 'Proprietăți') ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {counts.inchirieri.proprietati}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Accordion 2: Vânzări */}
            <div className="space-y-1 pt-1">
              <button
                type="button"
                onClick={() => setOpenVanzari(prev => !prev)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors cursor-pointer select-none group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Tag size={14} className="text-emerald-600 shrink-0" />
                  <span className="tracking-tight truncate text-[12px]">Vânzări</span>
                </div>
                <ChevronDown 
                  size={13} 
                  className={`text-gray-400 transition-transform duration-200 shrink-0 ${openVanzari ? 'rotate-0' : '-rotate-90'}`}
                />
              </button>

              {openVanzari && (
                <div className="ml-2 pl-2 border-l border-gray-200 space-y-0.5 pt-0.5">
                  {/* Lead-uri */}
                  <button
                    type="button"
                    onClick={() => handleItemClick('Vânzare', 'Lead-uri')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] rounded-md transition-colors cursor-pointer select-none text-left ${
                      isActive('Vânzare', 'Lead-uri')
                        ? 'bg-gray-900 text-white font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Inbox size={13} className={isActive('Vânzare', 'Lead-uri') ? 'text-white' : 'text-gray-400'} />
                      <span className="truncate">Lead-uri</span>
                    </div>
                    {counts.vanzari.leads > 0 && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isActive('Vânzare', 'Lead-uri') ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {counts.vanzari.leads}
                      </span>
                    )}
                  </button>

                  {/* Cereri */}
                  <button
                    type="button"
                    onClick={() => handleItemClick('Vânzare', 'Cereri')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] rounded-md transition-colors cursor-pointer select-none text-left ${
                      isActive('Vânzare', 'Cereri')
                        ? 'bg-gray-900 text-white font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ClipboardList size={13} className={isActive('Vânzare', 'Cereri') ? 'text-white' : 'text-gray-400'} />
                      <span className="truncate">Cereri</span>
                    </div>
                    {counts.vanzari.cereri > 0 && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isActive('Vânzare', 'Cereri') ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {counts.vanzari.cereri}
                      </span>
                    )}
                  </button>

                  {/* Proprietăți */}
                  <button
                    type="button"
                    onClick={() => handleItemClick('Vânzare', 'Proprietăți')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] rounded-md transition-colors cursor-pointer select-none text-left ${
                      isActive('Vânzare', 'Proprietăți')
                        ? 'bg-gray-900 text-white font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 size={13} className={isActive('Vânzare', 'Proprietăți') ? 'text-white' : 'text-gray-400'} />
                      <span className="truncate">Proprietăți</span>
                    </div>
                    {counts.vanzari.proprietati > 0 && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isActive('Vânzare', 'Proprietăți') ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {counts.vanzari.proprietati}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Collapsed View: Compact vertical icon actions */
          <div className="flex flex-col items-center space-y-3 py-1">
            {/* Închirieri group */}
            <div className="flex flex-col items-center space-y-1.5 pb-2 border-b border-gray-200 w-full">
              <button
                type="button"
                onClick={() => handleItemClick('Închiriere', 'Proprietăți')}
                className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                  activeType === 'Închiriere'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Închirieri"
              >
                <KeyRound size={16} />
              </button>
            </div>

            {/* Vânzări group */}
            <div className="flex flex-col items-center space-y-1.5 w-full">
              <button
                type="button"
                onClick={() => handleItemClick('Vânzare', 'Proprietăți')}
                className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                  activeType === 'Vânzare'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Vânzări"
              >
                <Tag size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Action: Collapse / Expand toggle button (Render.com style) */}
      <div className="shrink-0 border-t border-gray-200 p-2 bg-white">
        {!isCollapsed ? (
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100/70 rounded-md transition-colors cursor-pointer"
            title="Restrânge bara laterală"
          >
            <PanelLeftClose size={15} className="shrink-0" />
            <span>Restrânge</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="w-full flex items-center justify-center py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100/70 rounded-md transition-colors cursor-pointer"
            title="Extinde bara laterală"
          >
            <PanelLeft size={16} />
          </button>
        )}
      </div>
    </aside>
  );
};
