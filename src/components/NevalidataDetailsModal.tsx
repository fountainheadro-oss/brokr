import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Globe, Save, Trash2, ArrowUpRight, ClipboardCopy, Phone, User, Check, AlertTriangle } from "lucide-react";
import { Lead } from "../services/leadsService";
import { CATEGORIA_OPTIONS, TRANZACTIE_OPTIONS, ORAS_OPTIONS } from "../constants";
import { FormInput, FormSelect } from "./FormElements";
import toast from "react-hot-toast";

interface NevalidataDetailsModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onMoveToCalificata: (leadId: string, updatedData: Partial<Lead>) => Promise<void>;
  onDeleteLead: (leadId: string) => Promise<void>;
  onSaveLead: (leadId: string, updatedData: Partial<Lead>) => Promise<void>;
}

export const NevalidataDetailsModal: React.FC<NevalidataDetailsModalProps> = ({
  isOpen,
  lead,
  onClose,
  onMoveToCalificata,
  onDeleteLead,
  onSaveLead
}) => {
  if (!lead) return null;

  const [title, setTitle] = useState(lead.title || "");
  const [price, setPrice] = useState(lead.price || "");
  const [transactionType, setTransactionType] = useState<"Vânzare" | "Închiriere">(lead.transactionType || "Vânzare");
  const [categoria, setCategoria] = useState(lead.categoria || "Apartament");
  const [ownerName, setOwnerName] = useState(lead.ownerName || "");
  const [ownerPhone, setOwnerPhone] = useState(lead.ownerPhone || "");
  const [notes, setNotes] = useState(lead.notes || "");
  
  // Surfaces and location FALLBACK to extractedData or top-level lead fields
  const [suprafata, setSuprafata] = useState(
    lead.extractedData?.crmData?.caracteristici?.suprafete?.utila || ""
  );
  const [oras, setOras] = useState(
    lead.extractedData?.crmData?.detaliiGenerale?.localizare?.oras || lead.zone || "Bucuresti"
  );

  const [saving, setSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(lead.url);
    toast.success("URL-ul a fost copiat în clipboard!");
  };

  const getUpdatedLeadPayload = (): Partial<Lead> => {
    // Construct updated extractedData to match CRM structure if needed
    const currentExtracted: any = lead.extractedData || {
      crmData: {
        detaliiGenerale: {
          stadiu: "Active - Hot",
          tranzactie: transactionType === "Închiriere" ? "Inchiriere" : "Vanzare",
          categoria: categoria,
          localizare: {
            oras: oras,
            zona: [lead.zone || "Nespecificat"],
            strada: "",
            numar: "",
            bloc: "",
            scara: "",
            apartament: ""
          },
          proprietar: ownerName,
          memoPrivat: notes
        },
        caracteristici: {
          detalii: {
            camere: "",
            bai: ""
          },
          suprafete: {
            utila: suprafata,
            construita: suprafata ? String((parseFloat(suprafata) || 0) * 1.2) : ""
          }
        }
      }
    };

    // Deep merge changes
    if (currentExtracted && currentExtracted.crmData) {
      currentExtracted.crmData.detaliiGenerale.categoria = categoria;
      currentExtracted.crmData.detaliiGenerale.tranzactie = transactionType === "Închiriere" ? "Inchiriere" : "Vanzare";
      currentExtracted.crmData.detaliiGenerale.proprietar = ownerName;
      if (!currentExtracted.crmData.detaliiGenerale.localizare) {
        currentExtracted.crmData.detaliiGenerale.localizare = {
          oras: oras,
          zona: [],
          strada: "",
          numar: "",
          bloc: "",
          scara: "",
          apartament: ""
        };
      }
      currentExtracted.crmData.detaliiGenerale.localizare.oras = oras;
      
      if (!currentExtracted.crmData.caracteristici) {
        currentExtracted.crmData.caracteristici = {
          detalii: { camere: "", bai: "" },
          suprafete: { utila: "", construita: "" }
        };
      }
      if (!currentExtracted.crmData.caracteristici.suprafete) {
        currentExtracted.crmData.caracteristici.suprafete = { utila: "", construita: "" };
      }
      currentExtracted.crmData.caracteristici.suprafete.utila = suprafata;
      currentExtracted.crmData.caracteristici.suprafete.construita = suprafata ? String(Math.round((parseFloat(suprafata) || 0) * 1.2)) : "";
    }

    return {
      title,
      price,
      transactionType,
      categoria,
      ownerName,
      ownerPhone,
      notes,
      zone: oras,
      extractedData: currentExtracted
    };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = getUpdatedLeadPayload();
      await onSaveLead(lead.id!, payload);
      toast.success("Detalii salvate cu succes!");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Eroare la salvarea detaliilor!");
    } finally {
      setSaving(false);
    }
  };

  const handlePromote = async () => {
    setSaving(true);
    try {
      const payload = getUpdatedLeadPayload();
      await onMoveToCalificata(lead.id!, payload);
      toast.success("Proprietatea a fost mutată în Calificată!");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Eroare la promovare!");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await onDeleteLead(lead.id!);
      toast.success("Proprietatea a fost ștearsă!");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Eroare la ștergerea proprietății!");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]"
          />

          {/* Modal content container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.35 }}
            className="fixed inset-0 m-auto max-w-2xl h-[90vh] bg-white rounded-2xl shadow-2xl z-[301] flex flex-col overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[--color-accent]/10 flex items-center justify-center text-[--color-accent]">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900 leading-none">Scanează și Validează URL</h3>
                  <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase mt-1">Status: Nevalidate</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-400 hover:text-gray-900 transition-colors shadow-sm"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              
              {/* URL card block */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-150 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">URL Sursă</span>
                  <a
                    href={lead.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] font-semibold text-blue-600 hover:underline break-all flex items-center gap-1.5"
                  >
                    <span>{lead.url}</span>
                    <ArrowUpRight size={14} className="shrink-0" />
                  </a>
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="w-9 h-9 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center shrink-0 transition-colors shadow-none"
                  title="Copiază link"
                >
                  <ClipboardCopy size={16} />
                </button>
              </div>

              {/* Form Grid */}
              <div className="space-y-4">
                {/* Section title */}
                <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">
                  Detalii Identificate (Corectează dacă e cazul)
                </h4>

                {/* Row 1: Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="block text-[12px] font-bold text-[--color-text-placeholder] tracking-wider mb-1">Titlu Proprietate</label>
                  <FormInput 
                    value={title}
                    onChange={setTitle}
                    placeholder="Titlu..."
                  />
                </div>

                {/* Row 2: Price & Transaction Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="block text-[12px] font-bold text-[--color-text-placeholder] tracking-wider mb-1">Preț</label>
                    <FormInput 
                      value={price}
                      onChange={setPrice}
                      placeholder="e.g. 1500 € / lună..."
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="block text-[12px] font-bold text-[--color-text-placeholder] tracking-wider mb-1">Tip Tranzacție</label>
                    <div className="flex border border-[--color-border] bg-white p-1 rounded-[8px] h-12">
                      {(['Vânzare', 'Închiriere'] as const).map((type) => (
                        <button
                          type="button"
                          key={type}
                          onClick={() => setTransactionType(type)}
                          className={`flex-1 rounded-[6px] text-xs font-bold transition-all ${
                            transactionType === type
                              ? "bg-gray-950 text-white shadow-sm"
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 3: Category & surface */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="block text-[12px] font-bold text-[--color-text-placeholder] tracking-wider mb-1">Categoria</label>
                    <FormSelect 
                      value={categoria}
                      onChange={setCategoria}
                      options={CATEGORIA_OPTIONS}
                      showEmpty={false}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="block text-[12px] font-bold text-[--color-text-placeholder] tracking-wider mb-1">Suprafață Utilă (mp)</label>
                    <FormInput 
                      value={suprafata}
                      onChange={setSuprafata}
                      placeholder="e.g. 75"
                    />
                  </div>
                </div>

                {/* Row 4: Locality / City */}
                <div className="flex flex-col gap-1.5">
                  <label className="block text-[12px] font-bold text-[--color-text-placeholder] tracking-wider mb-1">Oraș / Localizare</label>
                  <FormSelect 
                    value={oras}
                    onChange={setOras}
                    options={ORAS_OPTIONS}
                    showEmpty={false}
                  />
                </div>

                {/* Section: Owner block */}
                <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pt-4 pb-2">
                  Informații Contact Proprietar
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="block text-[12px] font-bold text-[--color-text-placeholder] tracking-wider mb-1 flex items-center gap-1">
                      <User size={13} className="text-gray-400" />
                      Nume Proprietar
                    </label>
                    <FormInput 
                      value={ownerName}
                      onChange={setOwnerName}
                      placeholder="Nume..."
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="block text-[12px] font-bold text-[--color-text-placeholder] tracking-wider mb-1 flex items-center gap-1">
                      <Phone size={13} className="text-gray-400" />
                      Telefon Proprietar
                    </label>
                    <FormInput 
                      value={ownerPhone}
                      onChange={setOwnerPhone}
                      placeholder="Telefon..."
                    />
                  </div>
                </div>

                {/* Section: Notes */}
                <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pt-4 pb-2">
                  Notițe Private
                </h4>

                <div className="flex flex-col gap-1.5">
                  <label className="block text-[12px] font-bold text-[--color-text-placeholder] tracking-wider mb-1">Observații / Detalii Interne</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-base w-full min-h-[100px] font-roboto text-base font-normal text-[#333333] placeholder-gray-400 p-4 leading-relaxed resize-none"
                    placeholder="Adaugă notițe despre această proprietate..."
                  />
                </div>
              </div>
            </div>

            {/* Footer buttons row */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              {/* Left action: delete with confirmation */}
              <div>
                {showConfirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      Sigur ștergi?
                    </span>
                    <button
                      onClick={handleDelete}
                      className="px-3 h-9 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                    >
                      Da
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-3 h-9 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold"
                    >
                      Nu
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    className="h-11 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 flex items-center gap-2 text-xs font-bold transition-all"
                    title="Șterge definitiv"
                  >
                    <Trash2 size={16} />
                    <span>Șterge</span>
                  </button>
                )}
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-11 px-5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-[13px] flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>Salvează</span>
                </button>

                <button
                  onClick={handlePromote}
                  disabled={saving}
                  className="h-11 px-6 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-[13px] flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-gray-200"
                >
                  <Check size={16} />
                  <span>Mută în Calificată</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
