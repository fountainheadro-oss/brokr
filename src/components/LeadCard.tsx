import React from "react";
import { MapPin, Users, ChevronRight, Share2, Building2, User } from "lucide-react";
import { Lead, getLeadRole } from "../services/leadsService";
import { Contact } from "../services/contactsService";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import { getPublicShareUrl } from "../utils/shareUtils";

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
  onQuickViewClick
}) => {
  const role = getLeadRole(lead);
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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lead.id) return;
    const shareUrl = getPublicShareUrl(lead.id);
    try {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Linkul public al proprietății a fost copiat!");
    } catch {
      toast.success("Link: " + shareUrl);
    }
  };

  const internalId = lead.propertyId || (lead.id ? lead.id.slice(0, 5) : "");
  const rooms = lead.extractedData?.crmData?.caracteristici?.detalii?.camere;

  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
      className="bg-white rounded-xl border border-gray-200 hover:border-[#BE9662]/50 hover:shadow-md transition-all cursor-pointer group h-full flex flex-col overflow-hidden shadow-xs"
    >
      {/* Top Meta Bar */}
      <div 
        onClick={onClick}
        className="px-3.5 py-2.5 flex items-center justify-between gap-2 bg-gray-50/70 border-b border-gray-100"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide uppercase ${
            role === 'Proprietar' 
              ? 'bg-amber-50 text-amber-800 border-amber-200' 
              : role === 'Chirias' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            {role === 'Chirias' ? 'Chiriaș' : (role === 'Cumparator' ? 'Cumpărător' : 'Proprietar')}
          </span>

          {internalId && (
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#051D35]/5 text-[#051D35] border border-[#051D35]/15 shrink-0">
              #{internalId}
            </span>
          )}
        </div>

        {/* Share Button in Header */}
        <button
          type="button"
          onClick={handleShare}
          className="h-6 px-2 rounded-md border border-gray-200 bg-white hover:bg-amber-50/50 hover:border-[#BE9662]/40 text-gray-700 hover:text-[#051D35] text-[10px] font-semibold flex items-center gap-1 transition-all shadow-2xs shrink-0 cursor-pointer"
          title="Copiază link public de prezentare"
        >
          <Share2 size={11} className="text-[#BE9662]" />
          <span>Distribuie</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div 
        onClick={onClick}
        className="p-3.5 flex-1 flex flex-col justify-between gap-3 bg-white hover:bg-gray-50/30 transition-colors"
      >
        {/* Title */}
        <h3 className="text-[13px] font-bold text-gray-900 group-hover:text-[#051D35] transition-colors leading-snug line-clamp-2">
          {lead.title}
        </h3>

        {/* Specs and Thumbnail Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            {/* Price */}
            <div className="text-[14px] font-black text-[#051D35] font-mono">
              {lead.price || "Preț la cerere"}
            </div>

            {/* Type & Rooms */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium flex-wrap">
              <span className="text-[11px] text-gray-700 bg-gray-100 px-1.5 py-0.2 rounded font-semibold">
                {lead.transactionType || "Vânzare"}
              </span>
              {rooms && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-[11px] text-gray-600 font-medium">
                    {rooms} {Number(rooms) === 1 ? 'cameră' : 'camere'}
                  </span>
                </>
              )}
            </div>

            {/* Zone */}
            <div className="flex items-center gap-1 text-[11px] text-gray-500 truncate">
              <MapPin size={11} className="text-[#BE9662] shrink-0" />
              <span className="truncate">{lead.zone || "București"}</span>
            </div>

            {/* Owner name (internal hint if available) */}
            {lead.ownerName && lead.ownerName !== "Nespecificat" && (
              <div className="flex items-center gap-1 text-[10px] text-gray-400 truncate">
                <User size={10} className="shrink-0" />
                <span className="truncate font-medium">{lead.ownerName}</span>
              </div>
            )}
          </div>

          {/* Thumbnail */}
          <div className="w-18 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200 flex items-center justify-center self-center shadow-2xs">
            {firstImage ? (
              <img 
                src={firstImage} 
                alt={lead.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                <Building2 size={18} className="text-gray-300" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Area */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onQuickViewClick?.();
        }}
        className="px-3.5 py-2 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between hover:bg-gray-100/60 transition-all text-xs select-none"
      >
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {[...Array(Math.min(3, contacts.length || 1))].map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-2xs">
                <Users size={8} className="text-gray-400" />
              </div>
            ))}
          </div>
          <span className="text-[11px] font-medium text-gray-500">
            {contacts.length} {contacts.length === 1 ? 'contact' : 'contacte'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-600 group-hover:text-[#051D35] transition-colors">
          <span>Detalii</span>
          <ChevronRight size={13} className="text-[#BE9662]" />
        </div>
      </div>
    </motion.div>
  );
};
