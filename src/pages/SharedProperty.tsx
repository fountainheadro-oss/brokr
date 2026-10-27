import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { leadsService, Lead } from "../services/leadsService";
import { 
  DetaliiGeneraleSection, 
  CaracteristiciSection, 
  UtilitatiSection, 
  PretSection, 
  DescriereSection, 
  ImaginiSection 
} from "../components/PropertyForm";
import { 
  Share2, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle, 
  MapPin, 
  Tag, 
  Building2,
  ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";
import { getPublicShareUrl } from "../utils/shareUtils";

const SECTIONS = [
  { id: "detaliigenerale", label: "Detalii Generale" },
  { id: "caracteristici", label: "Caracteristici" },
  { id: "utilitati", label: "Utilități" },
  { id: "pret", label: "Preț" },
  { id: "descriere", label: "Descriere" },
  { id: "imagini", label: "Imagini" }
];

const SectionCard = ({ id, title, children }: { id: string, title: string, children: React.ReactNode }) => (
  <div 
    id={id} 
    className="bg-white rounded-md border border-gray-200 shadow-none overflow-hidden scroll-mt-16"
  >
    <div className="h-9 flex items-center px-3.5 bg-gray-50/80 border-b border-gray-200">
      <span className="text-[11px] font-semibold text-gray-800 uppercase tracking-wider">{title}</span>
    </div>
    <div className="p-3.5">{children}</div>
  </div>
);

export const SharedProperty: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("detaliigenerale");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadProperty = async () => {
      if (!id) {
        setError("Identificatorul proprietății lipsește.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Strategy 1: Client-side Firestore getLead (allowed for anyone via get: if true)
        const docLead = await leadsService.getLead(id);
        if (docLead && isMounted) {
          setLead(docLead);
          setLoading(false);
          return;
        }

        // Strategy 2: Fallback to server-side endpoint if available
        const res = await fetch(`/api/public-property/${encodeURIComponent(id)}`);
        if (res.ok) {
          const serverLead = await res.json();
          if (isMounted) {
            setLead(serverLead);
            setLoading(false);
            return;
          }
        }

        if (isMounted) {
          setError("Proprietatea nu a fost găsită sau a expirat.");
          setLoading(false);
        }
      } catch (err: any) {
        console.warn("[SharedProperty] Client fetch error, trying server fallback:", err);
        try {
          const res = await fetch(`/api/public-property/${encodeURIComponent(id)}`);
          if (res.ok) {
            const serverLead = await res.json();
            if (isMounted) {
              setLead(serverLead);
              setLoading(false);
              return;
            }
          }
        } catch (serverErr) {
          console.error("[SharedProperty] Server fallback also failed:", serverErr);
        }

        if (isMounted) {
          setError("Nu s-au putut încărca datele proprietății.");
          setLoading(false);
        }
      }
    };

    loadProperty();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const headerOffset = 120;
    for (const sect of SECTIONS) {
      const el = document.getElementById(sect.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= headerOffset + 24 && rect.bottom > headerOffset) {
          if (activeSection !== sect.id) {
            setActiveSection(sect.id);
          }
          break;
        }
      }
    }
  };

  const handleCopyLink = async () => {
    const currentUrl = lead?.id || id ? getPublicShareUrl(lead?.id || id || "") : window.location.href;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
      toast.success("Linkul proprietății a fost copiat!");
    } catch (e) {
      try {
        const tempInput = document.createElement("input");
        tempInput.value = currentUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
        toast.success("Linkul public a fost copiat!");
      } catch (err) {
        toast.error("Vă rugăm să copiați linkul manual din bara de adrese.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-[--color-accent] animate-spin mb-4" />
        <h2 className="text-lg font-bold text-gray-800">Se încarcă proprietatea...</h2>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Vă rugăm așteptați</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4 border border-red-100">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Proprietatea nu este disponibilă</h2>
        <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
          {error || "Proprietatea căutată nu a fost găsită sau a fost dezactivată din sistem."}
        </p>
        <Link 
          to="/"
          className="px-6 py-2.5 rounded-full bg-[#051D35] text-white text-xs font-bold hover:bg-[#0a2b4a] transition-all shadow-sm"
        >
          Mergi la pagina principală
        </Link>
      </div>
    );
  }

  const crmData = lead.extractedData?.crmData;
  const displayTitle = crmData?.descriere?.titlu || lead.title || "Prezentare Proprietate";
  const displayPrice = crmData?.pret?.detalii?.pret 
    ? `${crmData.pret.detalii.pret} ${crmData.pret.detalii.moneda || "EUR"}`
    : (lead.price || "");

  // Safe dummy handler for read-only view
  const noopUpdate = () => {};

  return (
    <div 
      className="min-h-screen bg-gray-50 flex flex-col overflow-y-auto"
      onScroll={handleScroll}
    >
      {/* Top Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-30 shadow-none">
        <div className="max-w-6xl mx-auto px-4 h-[50px] flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              {lead.transactionType && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium uppercase tracking-wider bg-gray-100 border border-gray-200 text-gray-700">
                  {lead.transactionType}
                </span>
              )}
              {lead.categoria && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium uppercase tracking-wider bg-gray-50 border border-gray-200 text-gray-600">
                  {lead.categoria}
                </span>
              )}
              {displayPrice && (
                <span className="text-[11px] font-mono font-semibold text-gray-900 ml-1">
                  {displayPrice}
                </span>
              )}
            </div>
            <h1 className="text-xs font-semibold text-gray-900 truncate tracking-tight">
              {displayTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                isCopied 
                  ? "bg-green-600 text-white" 
                  : "bg-[#051D35] text-white hover:bg-[#0a2b4a]"
              }`}
              title="Copiază linkul proprietății"
            >
              {isCopied ? <Check size={13} /> : <Share2 size={13} />}
              <span>{isCopied ? "Link Copiat!" : "Distribuie"}</span>
            </button>
          </div>
        </div>

        {/* Mobile Sticky Section Navigator */}
        <div className="lg:hidden border-t border-gray-200 bg-white px-3 py-1 flex gap-1 overflow-x-auto no-scrollbar items-center">
          {SECTIONS.map((sect) => {
            const isSelected = activeSection === sect.id;
            return (
              <button
                key={sect.id}
                onClick={() => scrollToSection(sect.id)}
                className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-medium transition-all border ${
                  isSelected
                    ? "bg-[#051D35] text-white border-[#051D35]"
                    : "bg-white text-gray-600 border-gray-200 hover:text-gray-900"
                }`}
              >
                {sect.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Body - 2 Columns */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start pb-12">
          
          {/* Main Content Area */}
          <div className="min-w-0 space-y-3.5">
            <SectionCard id="detaliigenerale" title="Detalii Generale">
              <DetaliiGeneraleSection 
                data={crmData?.detaliiGenerale} 
                onUpdate={noopUpdate} 
                categoria={crmData?.detaliiGenerale?.categoria || lead.categoria}
              />
            </SectionCard>

            <SectionCard id="caracteristici" title="Caracteristici">
              <CaracteristiciSection 
                data={crmData?.caracteristici} 
                onUpdate={noopUpdate} 
                categoria={crmData?.detaliiGenerale?.categoria || lead.categoria}
              />
            </SectionCard>

            <SectionCard id="utilitati" title="Utilități">
              <UtilitatiSection 
                data={crmData?.utilitati} 
                onUpdate={noopUpdate} 
                categoria={crmData?.detaliiGenerale?.categoria || lead.categoria}
              />
            </SectionCard>

            <SectionCard id="pret" title="Preț">
              <PretSection 
                data={crmData?.pret} 
                tranzactie={crmData?.detaliiGenerale?.tranzactie || lead.transactionType} 
                onUpdate={noopUpdate}
              />
            </SectionCard>

            <SectionCard id="descriere" title="Descriere">
              <DescriereSection 
                data={crmData?.descriere} 
                onUpdate={noopUpdate} 
                fullCRMData={crmData} 
              />
            </SectionCard>

            <SectionCard id="imagini" title="Imagini">
              <ImaginiSection 
                data={crmData?.imagini} 
                onUpdate={noopUpdate} 
                fullCRMData={crmData} 
                propertyId={lead.propertyId} 
              />
            </SectionCard>
          </div>

          {/* Right Side Column (Sticky Navigator & Share Card) */}
          <div className="hidden lg:block lg:sticky lg:top-[66px] lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto no-scrollbar space-y-3">
            
            {/* Page Navigation */}
            <div className="bg-white p-3.5 rounded-md border border-gray-200 shadow-none space-y-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Navigare Secțiuni</h3>
              <div className="space-y-0.5">
                {SECTIONS.map((sect) => {
                  const isSelected = activeSection === sect.id;
                  
                  return (
                    <button
                      key={sect.id}
                      onClick={() => scrollToSection(sect.id)}
                      className={`w-full flex items-center justify-between text-left h-7 px-2.5 rounded text-xs transition-all ${
                        isSelected 
                          ? "text-gray-900 bg-gray-100 font-semibold" 
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <span className="truncate">{sect.label}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#051D35]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Under the page navigation: Share the Link Card */}
            <div className="bg-white p-3.5 rounded-md border border-gray-200 shadow-none space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#BE9662]/10 text-[#BE9662] flex items-center justify-center shrink-0">
                  <Share2 size={13} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-semibold text-gray-900 uppercase tracking-wider">Distribuie Proprietatea</h4>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded p-1 pl-2">
                <span className="text-[11px] text-gray-600 font-mono truncate flex-1 select-all" title={getPublicShareUrl(lead?.id || id || "")}>
                  {getPublicShareUrl(lead?.id || id || "")}
                </span>
                <button
                  onClick={handleCopyLink}
                  className={`h-6 px-2 rounded text-[11px] font-medium transition-all flex items-center gap-1 shrink-0 ${
                    isCopied
                      ? "bg-green-600 text-white"
                      : "bg-[#051D35] text-white hover:bg-[#0a2b4a]"
                  }`}
                  title="Copiază link-ul"
                >
                  {isCopied ? <Check size={11} /> : <Copy size={11} />}
                  <span>{isCopied ? "Copiat" : "Copiază"}</span>
                </button>
              </div>

              <p className="text-[10px] text-gray-400 leading-normal">
                Link public accesibil oricui pe internet fără cont.
              </p>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};
