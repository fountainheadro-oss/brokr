import React from "react";
import { Lead } from "../services/leadsService";
import { Globe, Phone, MapPin, Tag, ArrowUpRight, Calendar } from "lucide-react";
import { motion } from "motion/react";

interface NevalidataUrlListProps {
  groupedLeads: { [key: string]: Lead[] };
  onItemClick: (lead: Lead) => void;
}

export const NevalidataUrlList: React.FC<NevalidataUrlListProps> = ({ 
  groupedLeads, 
  onItemClick 
}) => {
  const groups = Object.keys(groupedLeads);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Globe size={28} className="text-gray-300" />
        </div>
        <p className="text-[12px] font-bold text-gray-400 tracking-wider">Niciun link de procesat (Nevalidate)</p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-10 overflow-y-auto max-h-full custom-scrollbar">
      {groups.map((groupTitle) => (
        <div key={groupTitle} className="space-y-4">
          <h3 className="text-[14px] font-bold text-gray-400 tracking-wider px-2 flex items-center gap-2">
            <Calendar size={14} />
            {groupTitle}
          </h3>
          <div className="space-y-3">
            {groupedLeads[groupTitle].map((lead, index) => {
              // Extract domain from URL
              let domain = "";
              try {
                if (lead.url) {
                  const urlObj = new URL(lead.url);
                  domain = urlObj.hostname.replace("www.", "");
                }
              } catch (e) {
                domain = "Link extern";
              }

              return (
                <motion.div
                  key={lead.id || `neval-${index}-${lead.title}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  onClick={() => onItemClick(lead)}
                  className="bg-white rounded-[16px] border border-gray-150 p-5 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-gray-100 text-gray-600 tracking-wider flex items-center gap-1">
                        <Globe size={11} />
                        {domain}
                      </span>
                      {lead.transactionType && (
                        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          lead.transactionType === "Vânzare" || (lead.transactionType as string) === "Vanzare"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-orange-50 text-orange-600"
                        }`}>
                          {lead.transactionType}
                        </span>
                      )}
                      {lead.categoria && (
                        <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-gray-50 text-gray-500 tracking-wider">
                          {lead.categoria}
                        </span>
                      )}
                    </div>

                    <h4 className="text-[15px] font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-[--color-accent] transition-colors">
                      {lead.title}
                    </h4>

                    <p className="text-[13px] font-medium text-gray-400 truncate hover:underline hover:text-gray-600 select-all" title={lead.url}>
                      {lead.url}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3.5 md:self-center shrink-0">
                    <div className="text-right">
                      {lead.price && lead.price !== "N/A" && (
                        <div className="text-[16px] font-black text-[--color-accent] leading-none mb-1">
                          {lead.price}
                        </div>
                      )}
                      {(lead.ownerName || lead.ownerPhone) && (
                        <div className="text-[12px] font-medium text-gray-400 flex items-center justify-end gap-1">
                          <span>{lead.ownerName || "Proprietar"}</span>
                          {lead.ownerPhone && <span className="opacity-60">• {lead.ownerPhone}</span>}
                        </div>
                      )}
                    </div>

                    <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[--color-accent] hover:bg-gray-100 transition-all shadow-sm">
                      <ArrowUpRight size={18} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
