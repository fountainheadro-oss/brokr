import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Globe, Zap, Loader2, Building2 } from "lucide-react";
import { leadsService } from "../services/leadsService";
import { extractBasicData } from "../services/geminiService";
import { notificationsService } from "../services/notificationsService";
import toast from "react-hot-toast";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setStatus("Accesare URL...");
    try {
      // 1. Initial crawl to get text and title only
      const crawlRes = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      
      if (!crawlRes.ok) {
        const errorText = await crawlRes.text();
        console.error("Crawl failed:", errorText);
        throw new Error(`Crawl failed with status ${crawlRes.status}`);
      }

      const contentTypeHeader = crawlRes.headers.get("content-type");
      if (!contentTypeHeader || !contentTypeHeader.includes("application/json")) {
        const textStr = await crawlRes.text();
        console.error("Expected JSON but got:", textStr.substring(0, 100));
        throw new Error("Server returned an invalid response (HTML instead of JSON)");
      }

      const { text, title, images } = await crawlRes.json();
      const coverImage = images && images.length > 0 ? images[0] : null;

      // 2. Gemini basic extraction
      setStatus("Analiză Gemini (AI)...");
      const extractionResult = await extractBasicData(text, title);

      // 3. Save to Firestore
      setStatus("Salvare...");
      await leadsService.addLead({
        url: url.trim(),
        title: extractionResult.title || title || "Fără titlu",
        zone: extractionResult.zone || "Nespecificat",
        price: extractionResult.price || "N/A",
        ownerName: extractionResult.ownerName || "Nespecificat",
        ownerPhone: extractionResult.ownerPhone || "Nespecificat",
        transactionType: extractionResult.transactionType || "Vânzare",
        categoria: extractionResult.categoria || "Alte tipuri",
        status: "Nevalidata",
        coverImage,
        extractedData: null
      });

      await notificationsService.addNotification({
        title: 'Proprietate Nouă Adăugată',
        message: `Proprietatea din ${extractionResult.zone || "zonă nespecificată"} a fost adăugată cu succes.`,
        type: 'lead'
      });

      setUrl("");
      onClose();
      toast.success("Proprietatea a fost adăugată cu succes!");
    } catch (error: any) {
      console.error(error);
      setStatus("Eroare la adăugare");
      const errMessage = error?.message || "";
      if (errMessage.includes("HTML instead of JSON")) {
        toast.error("Serviciul de scanare este momentan indisponibil. Reîncercați în câteva secunde.");
      } else {
        toast.error(`Eroare la adăugarea proprietății: ${errMessage || "Eroare necunoscută"}`);
      }
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Building2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Adaugă Proprietate Nouă</h3>
                <p className="text-[11px] text-gray-500">Scanare și extragere automată date din URL</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Link Anunț Imobiliar *
              </label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="url"
                  required
                  placeholder="https://www.storia.ro/... sau olx.ro, imobiliare.ro"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                AI-ul va extrage automat detaliile, imaginile, prețul și contactul proprietarului.
              </p>
            </div>

            {loading && status && (
              <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs text-indigo-700">
                <Loader2 size={14} className="animate-spin text-indigo-600 shrink-0" />
                <span className="font-medium">{status}</span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Anulează
              </button>
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="px-4 py-2 text-xs font-medium bg-gray-900 hover:bg-black text-white rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Se procesează...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} className="text-amber-400 fill-amber-400" />
                    <span>Scanează & Adaugă</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
