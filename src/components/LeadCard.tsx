import React from "react";
import { Phone, User as UserIcon, MapPin, Tag, Users, Hash, ChevronRight } from "lucide-react";
import { Lead } from "../services/leadsService";
import { Contact } from "../services/contactsService";
import { motion } from "motion/react";

interface LeadCardProps {
  lead: Lead;
  contacts?: Contact[];
  onClick: () => void;
  onContactClick?: (contact: Contact) => void;
  onQuickViewClick?: () => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ 
  lead, 
  contacts = [], 
  onClick, 
  onContactClick,
  onQuickViewClick
}) => {
  const images = lead.extractedData?.crmData?.imagini;
  const categoria = String(lead.extractedData?.crmData?.detaliiGenerale?.categoria || '').toLowerCase();
  const isResidential = !categoria.includes('comercial') && 
                         !categoria.includes('spatiu') && 
                         !categoria.includes('depozit') && 
                         !categoria.includes('hala') && 
                         !categoria.includes('industrial') && 
                         !categoria.includes('birou');

  const rawFirstImage = (images && typeof images === 'object') ? (
    isResidential ? (
      (images?.living?.[0]) || 
      (images?.camera?.[0]) || 
      (images?.bucatarie?.[0]) || 
      (images?.baie?.[0]) || 
      (images?.alteSpatii?.[0])
    ) : (
      (images?.alteSpatii?.[0]) || 
      (images?.living?.[0]) || 
      (images?.camera?.[0]) || 
      (images?.bucatarie?.[0]) || 
      (images?.baie?.[0])
    )
  ) : null;

  const firstImage = typeof rawFirstImage === 'object' && rawFirstImage !== null
    ? rawFirstImage.original
    : (typeof rawFirstImage === 'string' ? rawFirstImage : (lead.coverImage || null));

  return (
    <motion.div
      className="bg-white rounded-md border border-gray-200 transition-all cursor-pointer group hover:border-gray-300 hover:shadow-xs h-full flex flex-col overflow-hidden"
    >
      {/* Header Container */}
      <div 
        onClick={onClick}
        className="px-3.5 py-2.5 flex justify-between items-center bg-white hover:bg-gray-50/50 transition-colors border-b border-gray-100"
      >
        <h3 className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-1 flex-1 pr-2">
          {lead.title}
        </h3>
        {lead.propertyId && (
          <span className="text-[11px] font-mono text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded shrink-0">
            #{lead.propertyId}
          </span>
        )}
      </div>

      {/* Property Info Area */}
      <div 
        onClick={onClick}
        className="p-3 bg-white hover:bg-gray-50/30 transition-colors flex-1 flex gap-3"
      >
        <div className="flex-1 space-y-1.5 min-w-0">
          {/* Row 1: Type & Rooms */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="text-[11px] text-gray-400">Tip:</span>
            <span className="font-medium text-gray-800">{lead.transactionType || "Nespecificat"}</span>
            <span className="text-gray-300">·</span>
            <span className="text-[11px] text-gray-400">Cam:</span>
            <span className="font-medium text-gray-800">{lead.extractedData?.crmData?.caracteristici?.detalii?.camere || "-"}</span>
          </div>

          {/* Row 2: Price */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-gray-400">Preț:</span>
            <span className="font-semibold text-gray-900 font-mono">
              {lead.price || "Nespecificat"}
            </span>
          </div>

          {/* Row 3: Address / Zone */}
          <div className="flex items-start gap-1.5 text-xs">
            <span className="text-[11px] text-gray-400 shrink-0">Zonă:</span>
            <span className="text-gray-600 truncate text-[11px]">
              {lead.zone || "București"}
            </span>
          </div>
        </div>

        {/* Thumbnail Image */}
        <div className="w-16 h-14 rounded overflow-hidden bg-gray-100 shrink-0 border border-gray-200 self-center">
          {firstImage ? (
            <img 
              src={firstImage} 
              alt={lead.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <MapPin size={16} />
            </div>
          )}
        </div>
      </div>

      {/* Footer Area */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onQuickViewClick?.();
        }}
        className="px-3 py-2 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between hover:bg-gray-100/60 transition-all text-xs"
      >
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {[...Array(Math.min(3, contacts.length || 1))].map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                <Users size={9} className="text-gray-400" />
              </div>
            ))}
          </div>
          <span className="text-[11px] font-medium text-gray-500">
            {contacts.length} {contacts.length === 1 ? 'contact' : 'contacte'}
          </span>
        </div>
        <div className="text-gray-400 group-hover:text-gray-700 transition-colors">
          <ChevronRight size={14} />
        </div>
      </div>
    </motion.div>
  );
};
