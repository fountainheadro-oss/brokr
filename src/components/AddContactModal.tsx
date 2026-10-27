import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User, Phone, Home, Loader2, Euro } from "lucide-react";
import { contactsService, ContactType } from "../services/contactsService";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPropertyId?: string;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({ isOpen, onClose, defaultPropertyId = "" }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [commissionValue, setCommissionValue] = useState("");
  const [type, setType] = useState<ContactType>("Buyer");
  const [propertyId, setPropertyId] = useState(defaultPropertyId);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPropertyId(defaultPropertyId || "");
      setCommissionValue("");
    }
  }, [isOpen, defaultPropertyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone || !propertyId) return;

    setLoading(true);
    try {
      await contactsService.addContact({
        firstName,
        lastName,
        phone,
        type,
        propertyId,
        commissionValue
      });

      setFirstName("");
      setLastName("");
      setPhone("");
      setCommissionValue("");
      setPropertyId("");
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const types: ContactType[] = ["Owner", "Renter", "Buyer", "Agent"];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[300] backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-white rounded-t-[16px] z-[301] border-x border-t border-gray-100 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
          >
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto my-3 shrink-0" />
            
            <div className="p-5 flex items-center justify-between bg-white border-b border-gray-100 shrink-0">
              <h2 className="text-[16px] font-bold text-gray-900 tracking-tight">Adaugă Contact Nou</h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-gray-900 transition-colors border border-gray-100 shadow-sm"
               >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
 
            <div className="p-8 pb-12 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[--color-accent] transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Prenume"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="input-base w-full pl-14 pr-5 rounded-[8px] font-roboto text-base font-normal text-[#333333] placeholder-gray-400"
                    />
                  </div>
                  <div className="relative group">
                    <input
                      type="text"
                      required
                      placeholder="Nume"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="input-base w-full px-5 rounded-[8px] font-roboto text-base font-normal text-[#333333] placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="flex gap-1 p-1 bg-white border border-[--color-border] rounded-[8px]">
                  {types.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex-1 h-10 rounded-[6px] text-[13px] font-bold transition-all ${
                        type === t 
                        ? "bg-gray-950 text-white shadow-sm" 
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[--color-accent] transition-colors">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="Număr de telefon"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-base w-full pl-14 pr-5 rounded-[8px] font-roboto text-base font-normal text-[#333333] placeholder-gray-400"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[--color-accent] transition-colors pointer-events-none">
                    <Euro size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Comision (ex: 2% sau 1000€)"
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(e.target.value)}
                    className="input-base w-full pl-14 pr-5 rounded-[8px] font-roboto text-base font-normal text-[#333333] placeholder-gray-400"
                  />
                </div>

                {!defaultPropertyId && (
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[--color-accent] transition-colors">
                      <Home size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Property ID (Cod Proprietate)"
                      value={propertyId}
                      onChange={(e) => setPropertyId(e.target.value)}
                      className="input-base w-full pl-14 pr-5 rounded-[8px] font-roboto text-base font-normal text-[#333333] placeholder-gray-400"
                    />
                  </div>
                )}
   
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  className="w-full h-14 bg-gray-900 text-white hover:bg-black transition-colors rounded-full font-bold flex items-center justify-center gap-3 disabled:opacity-50 mt-4 shadow-lg shadow-gray-200"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <span className="text-[15px] font-bold">Salvare Contact</span>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
