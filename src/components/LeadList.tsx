import { Lead } from "../services/leadsService";
import { Contact } from "../services/contactsService";
import { LeadCard } from "./LeadCard";
import { motion } from "motion/react";

interface LeadListProps {
  groupedLeads: { [key: string]: Lead[] };
  contacts: Contact[];
  onLeadClick: (lead: Lead) => void;
  onContactClick: (contact: Contact) => void;
  onQuickViewClick: (lead: Lead) => void;
}

export const LeadList: React.FC<LeadListProps> = ({ 
  groupedLeads, 
  contacts, 
  onLeadClick, 
  onContactClick,
  onQuickViewClick
}) => {
  const groups = Object.keys(groupedLeads);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mb-3">
          <div className="w-5 h-5 border border-dashed border-gray-300 rounded" />
        </div>
        <p className="text-[12px] font-medium text-gray-500">Nicio Proprietate Găsită</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 overflow-y-auto max-h-full custom-scrollbar">
      {groups.map((groupTitle) => (
        <div key={groupTitle} className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {groupTitle}
            </h3>
            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded">
              {groupedLeads[groupTitle].length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {groupedLeads[groupTitle].map((lead, index) => (
              <motion.div
                key={lead.id || `lead-${index}-${lead.title}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <LeadCard 
                  lead={lead} 
                  contacts={contacts.filter(c => c.propertyId === lead.id)}
                  onClick={() => onLeadClick(lead)} 
                  onContactClick={onContactClick}
                  onQuickViewClick={() => onQuickViewClick(lead)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
