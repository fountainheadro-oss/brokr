import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Globe, Zap, Loader2 } from "lucide-react";
import { leadsService } from "../services/leadsService";
import { extractData, extractBasicData } from "../services/geminiService";
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
    if (!url) return;

    setLoading(true);
    setStatus("Accesare URL...");
    try {
      // 1. Initial crawl to get text and title only
      const crawlRes = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
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
        url,
        title: extractionResult.title || title || "Fără titlu",
        zone: extractionResult.zone || "Nespecificat",
        price: extractionResult.price || "N/A",
        ownerName: extractionResult.ownerName || "Nespecificat",
        ownerPhone: extractionResult.ownerPhone || "Nespecificat",
        transactionType: extractionResult.transactionType || "Vânzare",
        categoria: extractionResult.categoria || "Alte tipuri",
        status: "Nevalidata",
        coverImage,
        extractedData: null // No full extraction yet
      });

      await notificationsService.addNotification({
        title: 'Lead Nou Adăugat',
        message: `Proprietatea din ${extractionResult.zone || "zonă nespecificată"} a fost adăugată cu succes.`,
        type: 'lead'
      });

      setUrl("");
      onClose();
      toast.success("Lead-ul a fost adăugat cu succes!");
    } catch (error: any) {
      console.error(error);
      setStatus("Eroare la adăugare");
      const errMessage = error?.message || "";
      if (errMessage.includes("HTML instead of JSON")) {
        toast.error("Serviciul de scanare este momentan indisponibil. Reîncercați în câteva secunde.");
      } else {
        toast.error(`Eroare la adăugarea lead-ului: ${errMessage || "Eroare necunoscută"}`);
      }
    } finally {
      setLoading(false);
      setStatus("");
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
            className="fixed inset-0 bg-black/60 z-[300] backdrop-blur-sm"
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-white rounded-t-[16px] z-[301] border-x border-t border-gray-100 shadow-2xl overflow-hidden"
          >
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto my-3" />
            
            <div className="p-5 flex items-center justify-between bg-white border-b border-gray-100">
              <h2 className="text-[16px] font-bold text-gray-900 tracking-tight">Adaugă Lead Nou</h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-gray-900 transition-colors border border-gray-100 shadow-sm"
               >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
 
            <div className="p-8 pb-12">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[--color-accent] transition-colors">
                    <Globe size={18} />
                  </div>
                  <input
                    ref={inputRef}
                    type="url"
                    required
                    placeholder="Introduceți URL-ul proprietății..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="input-base w-full pl-14 pr-5 rounded-[8px] font-roboto text-base font-normal text-[#333333] placeholder-gray-400"
                  />
                </div>
   
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={loading || !url}
                  className="w-full h-14 bg-gray-900 text-white hover:bg-black transition-colors rounded-full font-bold flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-gray-200"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span className="text-[15px] font-bold">{status}</span>
                    </>
                  ) : (
                    <>
                      <Zap size={18} fill="currentColor" className="text-[--color-accent]" />
                      <span className="text-[15px] font-bold">Adaugă în listă</span>
                    </>
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
