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
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <div className="w-8 h-8 border-2 border-dashed border-gray-200 rounded-lg" />
        </div>
        <p className="text-[12px] font-bold text-gray-400 tracking-wider">Nicio Proprietate Găsită</p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-10 overflow-y-auto max-h-full custom-scrollbar">
      {groups.map((groupTitle) => (
        <div key={groupTitle} className="space-y-5">
          <h3 className="text-[14px] font-bold text-gray-400 tracking-wider px-2">
            {groupTitle}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groupedLeads[groupTitle].map((lead, index) => (
              <motion.div
                key={lead.id || `lead-${index}-${lead.title}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
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
