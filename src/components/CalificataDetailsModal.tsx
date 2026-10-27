import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Play, ShieldAlert, Phone, User, Calendar, MapPin, Tag, AreaChart, Trash2, Edit } from "lucide-react";
import { Lead } from "../services/leadsService";
import toast from "react-hot-toast";

interface CalificataDetailsModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onActivate: (leadId: string) => Promise<void>;
  onDeleteLead: (leadId: string) => Promise<void>;
  onOpenFullForm?: () => void; // Optional if they want to edit further
}

export const CalificataDetailsModal: React.FC<CalificataDetailsModalProps> = ({
  isOpen,
  lead,
  onClose,
  onActivate,
  onDeleteLead,
  onOpenFullForm
}) => {
  if (!lead) return null;

  const [activating, setActivating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleActivate = async () => {
    setActivating(true);
    try {
      await onActivate(lead.id!);
      toast.success("Proprietatea a fost activată și publicată pe piață!");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Eroare la activarea proprietății!");
    } finally {
      setActivating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDeleteLead(lead.id!);
      toast.success("Proprietatea a fost ștearsă!");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Eroare la ștergerea proprietății!");
    } finally {
      setDeleting(false);
    }
  };

  const getSubtext = () => {
    if (lead.notes) {
      return lead.notes;
    }
    return "Fără observații suplimentare adăugate.";
  };

  const utilSurface = lead.extractedData?.crmData?.caracteristici?.suprafete?.utila || "Nesperificat";
  const builtSurface = lead.extractedData?.crmData?.caracteristici?.suprafete?.construita || "";
  const roomsCount = lead.extractedData?.crmData?.caracteristici?.detalii?.camere || "N/A";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]"
          />

          {/* Modal layout box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.35 }}
            className="fixed inset-0 m-auto max-w-xl h-[85vh] bg-white rounded-2xl shadow-2xl z-[301] flex flex-col overflow-hidden border border-gray-150"
          >
            {/* Header section */}
            <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900 leading-none">Proprietate Calificată</h3>
                  <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase mt-1">Pregătită de activare</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-400 hover:text-gray-900 transition-colors shadow-sm"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable specs block */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">

              {/* Title & Price info */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    lead.transactionType === "Vânzare" || (lead.transactionType as string) === "Vanzare"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-orange-50 text-orange-600"
                  }`}>
                    {lead.transactionType}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gray-100 text-gray-500">
                    {lead.categoria || "Nespecificat"}
                  </span>
                </div>
                
                <h2 className="text-[18px] font-black text-gray-900 tracking-tight leading-snug">
                  {lead.title}
                </h2>

                <div className="text-[20px] font-black text-[--color-accent] mt-1">
                  {lead.price}
                </div>
              </div>

              {/* Grid properties layout */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                    <AreaChart size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-tight">Suprafață utilă</span>
                    <span className="text-[13px] font-bold text-gray-700">{utilSurface} {utilSurface !== "Nesperificat" ? "mp" : ""}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-tight">Oraș / Localitate</span>
                    <span className="text-[13px] font-bold text-gray-700 truncate block max-w-[120px]">{lead.zone || "Nespecificat"}</span>
                  </div>
                </div>
              </div>

              {/* Owner Info Block */}
              <div className="bg-amber-50/40 rounded-xl p-5 border border-amber-100/60 space-y-3.5">
                <h4 className="text-[11px] uppercase font-bold text-amber-800/80 tracking-wider">Contact Proprietar</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 text-gray-700 text-[13px] font-semibold">
                    <User size={16} className="text-gray-400 shrink-0" />
                    <span className="truncate">{lead.ownerName || "Nespecificat"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-700 text-[13px] font-bold">
                    <Phone size={16} className="text-gray-400 shrink-0" />
                    <span>{lead.ownerPhone || "Nespecificat"}</span>
                  </div>
                </div>
              </div>

              {/* Custom notes section */}
              <div className="space-y-2">
                <h4 className="text-[11px] uppercase font-bold text-gray-450 tracking-wider">Notițe Private</h4>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-150 min-h-[80px]">
                  <p className="text-[13px] text-gray-600 font-medium whitespace-pre-wrap leading-relaxed">
                    {getSubtext()}
                  </p>
                </div>
              </div>

              {/* External source Link */}
              {lead.url && (
                <div className="pt-2 text-center">
                  <a
                    href={lead.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline"
                  >
                    <span>Vezi anunțul original listat</span>
                    <Play size={10} className="fill-current" />
                  </a>
                </div>
              )}
            </div>

            {/* Footer controls */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 shrink-0">
              <div>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-red-650 font-bold">Sigur?</span>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-2.5 py-1.5 bg-red-600 text-white font-bold rounded-lg text-xs"
                    >
                      Da
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2.5 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold"
                    >
                      Nu
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 hover:border-red-200 hover:text-red-600 rounded-xl transition-all text-gray-400"
                    title="Șterge proprietatea"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onOpenFullForm && (
                  <button
                    onClick={onOpenFullForm}
                    className="h-11 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Edit size={14} />
                    <span>Editează</span>
                  </button>
                )}

                <button
                  onClick={handleActivate}
                  disabled={activating}
                  className="h-11 px-6 bg-[rgb(224,72,57)] hover:bg-[rgb(204,52,37)] text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-red-100 transition-colors"
                >
                  <Play size={14} className="fill-current" />
                  <span>Activează pe Piață</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
