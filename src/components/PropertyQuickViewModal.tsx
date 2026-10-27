import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User, Phone, MapPin, Tag, Users, Hash, Calculator, Plus, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { contactsService, Contact } from "../services/contactsService";
import { Lead } from "../services/leadsService";

const formatWhatsAppLink = (phone: string) => {
  const cleanPhone = phone.replace(/\D/g, "");
  // Default to Romania code if it starts with 0
  const finalPhone = cleanPhone.startsWith("0") ? `40${cleanPhone.substring(1)}` : cleanPhone;
  return `https://wa.me/${finalPhone}`;
};

interface PropertyQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
  onAddContactClick: () => void;
}

export const PropertyQuickViewModal: React.FC<PropertyQuickViewModalProps> = ({ 
  isOpen, 
  onClose, 
  lead, 
  contacts,
  onContactClick,
  onAddContactClick
}) => {
  if (!lead) return null;

  const renterBuyerContacts = contacts.filter(c => c.type === "Renter" || c.type === "Buyer");
  const ownerContacts = contacts.filter(c => c.type === "Owner");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[400] backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto bg-white rounded-t-[16px] z-[401] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border-x border-t border-gray-100"
          >
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto my-3 shrink-0" />
            
            <div className="p-5 flex items-center justify-between bg-white border-b border-gray-100 shrink-0">
              <h2 className="text-[16px] font-bold text-[--color-text-main] line-clamp-1 flex-1 tracking-tight">
                {lead.title}
              </h2>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                {lead.propertyId && (
                  <span className="text-[16px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-0.5 rounded-md shrink-0">
                    #{lead.propertyId}
                  </span>
                )}
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center bg-white rounded-full cursor-pointer hover:bg-gray-50 transition-colors border border-gray-100 shadow-sm"
                >
                  <X size={20} strokeWidth={2.5} className="text-gray-400 hover:text-gray-900" />
                </motion.button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Property Details - Matching LeadCard Body Style */}
              <div className="bg-white rounded-[16px] p-5 border border-gray-100 space-y-5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Column 1: Info */}
                  <div className="md:col-span-7 space-y-5">
                    <h3 className="text-[12px] font-bold text-gray-400 tracking-wider mb-2 uppercase">Detalii Proprietate</h3>
                    <div className="grid grid-cols-1 gap-5">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-gray-500">Tip:</span>
                        <span className="text-[14px] font-bold text-gray-700">{lead.transactionType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-gray-500">Camere:</span>
                        <span className="text-[14px] font-bold text-gray-700">{lead.extractedData?.crmData?.caracteristici?.detalii?.camere || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-gray-500">Preț:</span>
                        <span className="text-[14px] font-black text-[--color-accent]">{lead.price}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[12px] font-medium text-gray-500 mt-0.5 shrink-0">Adresă:</span>
                        <span className="text-[14px] font-medium text-gray-600">
                          {lead.zone}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Image */}
                  <div className="md:col-span-5">
                    <div className="relative aspect-square w-full bg-gray-50 rounded-[16px] overflow-hidden border border-gray-100 group/img">
                      {(() => {
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

                        const displayImage = typeof rawFirstImage === 'object' && rawFirstImage !== null
                          ? rawFirstImage.original
                          : (typeof rawFirstImage === 'string' ? rawFirstImage : (lead.coverImage || null));

                        return displayImage ? (
                          <img 
                            src={displayImage} 
                            alt={lead.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-200">
                            <Tag size={40} className="mb-2" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Nicio imagine</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-50 w-full" />

              {/* Columns for Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Owner Information */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                      <h3 className="text-[16px] font-bold text-gray-900">Proprietar</h3>
                    </div>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={onAddContactClick}
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-full cursor-pointer hover:bg-gray-50 transition-colors border border-gray-100 shadow-sm"
                      title="Adaugă Proprietar"
                    >
                      <Plus size={20} strokeWidth={2.5} className="text-[rgb(51,51,51)]" />
                    </motion.button>
                  </div>

                  <div className="space-y-5">
                    <div className="bg-gray-50/50 rounded-[16px] p-5 border border-gray-100 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-100">
                          <User size={14} className="text-gray-400" />
                        </div>
                        <div className="flex items-col">
                          <span className="text-[12px] font-medium text-gray-500">Nume:</span>
                          <span className="text-[14px] font-bold text-gray-700 ml-2">{lead.ownerName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-100">
                          <Phone size={14} className="text-gray-400" />
                        </div>
                        <div className="flex items-col">
                          <span className="text-[12px] font-medium text-gray-500">Telefon:</span>
                          <a 
                            href={formatWhatsAppLink(lead.ownerPhone)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[14px] font-bold text-blue-600 hover:underline ml-2 flex items-center gap-1.5"
                          >
                            {lead.ownerPhone}
                            <MessageCircle size={14} className="text-green-500" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {ownerContacts.length > 0 && (
                      <div className="space-y-3">
                        {ownerContacts.map((contact, idx) => (
                          <div 
                            key={contact.id || `${contact.firstName}-${contact.lastName}-${contact.phone}-${idx}`}
                            onClick={() => {
                              onContactClick(contact);
                              onClose();
                            }}
                            className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-[16px] hover:border-blue-200 transition-all cursor-pointer group"
                          >
                            <span className="text-[14px] font-bold text-gray-700">{contact.firstName} {contact.lastName}</span>
                            <div className="flex items-center gap-2">
                              <a 
                                href={formatWhatsAppLink(contact.phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[14px] font-medium text-blue-500 hover:underline flex items-center gap-1.5"
                              >
                                {contact.phone}
                                <MessageCircle size={14} className="text-green-500" />
                              </a>
                              <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await contactsService.deleteContact(contact.id!);
                                    toast.success('Contact șters cu succes');
                                  } catch (error) {
                                    toast.error('Eroare la ștergerea contactului');
                                  }
                                }}
                                className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm ml-2"
                                title="Șterge contact"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Clients Information */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                      <h3 className="text-[16px] font-bold text-gray-900">Contacte interesate</h3>
                    </div>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={onAddContactClick}
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-full cursor-pointer hover:bg-gray-50 transition-colors border border-gray-100 shadow-sm"
                      title="Adaugă Client"
                    >
                      <Plus size={20} strokeWidth={2.5} className="text-[rgb(51,51,51)]" />
                    </motion.button>
                  </div>

                  {renterBuyerContacts.length > 0 ? (
                    <div className="space-y-3">
                      {renterBuyerContacts.map((contact, idx) => (
                        <div 
                          key={contact.id || `${contact.firstName}-${contact.lastName}-${contact.phone}-${idx}`}
                          onClick={() => {
                            onContactClick(contact);
                            onClose();
                          }}
                          className="bg-white border border-gray-100 hover:border-green-200 p-5 rounded-[16px] transition-all cursor-pointer group shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-3">
                             <div className="flex flex-col">
                               <span className="text-[16px] font-bold text-gray-900">{contact.firstName} {contact.lastName}</span>
                               <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md tracking-wider inline-block w-fit mt-1 ${
                                 contact.type === "Buyer" ? "bg-green-50 text-green-600" : "bg-purple-50 text-purple-600"
                               }`}>
                                 {contact.type}
                               </span>
                             </div>
                             <button 
                               onClick={async (e) => {
                                 e.stopPropagation();
                                 try {
                                   await contactsService.deleteContact(contact.id!);
                                   toast.success('Contact șters cu succes');
                                 } catch (error) {
                                   toast.error('Eroare la ștergerea contactului');
                                 }
                               }}
                               className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                               title="Șterge contact"
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                             <Phone size={12} className="text-gray-300" />
                             <a 
                               href={formatWhatsAppLink(contact.phone)}
                               target="_blank"
                               rel="noopener noreferrer"
                               onClick={(e) => e.stopPropagation()}
                               className="text-[14px] font-medium text-blue-500 hover:underline flex items-center gap-1.5"
                             >
                               {contact.phone}
                               <MessageCircle size={14} className="text-green-500" />
                             </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 bg-gray-50/50 rounded-[16px] border border-dashed border-gray-200">
                      <Users size={32} className="text-gray-200 mb-2" />
                      <p className="text-[14px] font-bold text-gray-300 tracking-wider">Niciun Contact Alocat</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
