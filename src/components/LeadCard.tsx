import React from "react";
import { Phone, User as UserIcon, MapPin, Tag, Users, Hash, ChevronLeft } from "lucide-react";
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
  const renterBuyerContacts = contacts
    .filter(c => c.type === "Renter" || c.type === "Buyer")
    .slice(0, 3);

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
      (images?.alteSpatii?.[0]) || // Building overview/exterior usually here
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
      className="bg-white rounded-[16px] border border-gray-100 transition-all cursor-pointer group hover:shadow-md h-full flex flex-col overflow-hidden"
    >
      {/* Header Container */}
      <div 
        onClick={onClick}
        className="p-5 flex justify-between items-center bg-white hover:bg-gray-50/50 transition-colors"
      >
        <h3 className="text-[16px] font-bold text-[--color-text-main] leading-tight line-clamp-1 flex-1">
          {lead.title}
        </h3>
        {lead.propertyId && (
          <span className="text-[16px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-0.5 rounded-md shrink-0 ml-3">
            #{lead.propertyId}
          </span>
        )}
      </div>

      {/* Horizontal Border Edge to Edge */}
      <div className="h-px bg-gray-100 w-full" />

      {/* 100% Width Property Info Area */}
      <div 
        onClick={onClick}
        className="p-5 bg-white hover:bg-gray-50/50 transition-colors flex-1 flex gap-5"
      >
        <div className="flex-1 space-y-2.5">
          {/* Row 1: Type */}
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-gray-500">Tip:</span>
            <span className="text-[14px] font-bold text-gray-700">
              {lead.transactionType}
            </span>
          </div>

          {/* Row 2: Rooms */}
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-gray-500">Camere:</span>
            <span className="text-[14px] font-bold text-gray-700">
              {lead.extractedData?.crmData?.caracteristici?.detalii?.camere || "N/A"}
            </span>
          </div>

          {/* Row 3: Price */}
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-gray-500">Preț:</span>
            <span className="text-[14px] font-black text-[--color-accent]">
              {lead.price}
            </span>
          </div>

          {/* Row 4: Address */}
          <div className="flex items-start gap-2">
            <span className="text-[14px] font-medium text-gray-500 mt-0.5 shrink-0">Adresă:</span>
            <span className="text-[14px] font-medium text-gray-600 line-clamp-2">
              {lead.zone}
            </span>
          </div>
        </div>

        {/* Thumbnail Image */}
        <div className="h-24 aspect-video rounded-[16px] overflow-hidden bg-gray-50 shrink-0 border border-gray-100 shadow-sm self-center">
          {firstImage ? (
            <img 
              src={firstImage} 
              alt={lead.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin size={24} className="text-gray-200" />
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-gray-100 w-full" />

      {/* Footer Area - Opens Modal */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onQuickViewClick?.();
        }}
        className="p-5 bg-white flex items-center justify-between hover:bg-gray-50/50 transition-all text-[--color-text-placeholder]"
      >
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[...Array(Math.min(3, contacts.length || 1))].map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center">
                <Users size={12} className="text-gray-400" />
              </div>
            ))}
          </div>
          <span className="text-[16px] font-bold text-gray-600">
            {contacts.length} contacte interesate
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[--color-accent] group-hover:border-[--color-accent]/20 transition-colors shadow-sm">
          <ChevronLeft size={16} className="rotate-180" />
        </div>
      </div>
    </motion.div>
  );
};
