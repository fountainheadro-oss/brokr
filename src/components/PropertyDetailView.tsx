import React, { useState, useEffect, useMemo, useRef } from "react";
import { Lead, getLeadRole } from "../services/leadsService";
import { Contact } from "../services/contactsService";
import { 
  FileText, 
  MapPin, 
  Home, 
  Building2, 
  Building, 
  Compass, 
  Bus, 
  Car, 
  BadgePercent, 
  Phone, 
  Mail, 
  Printer, 
  Heart, 
  Camera, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  Calendar, 
  Layers, 
  Share2, 
  Check, 
  Maximize2,
  User,
  Lock,
  Copy
} from "lucide-react";
import toast from "react-hot-toast";
import { getPublicShareUrl } from "../utils/shareUtils";

export interface PropertyDetailViewProps {
  lead: Lead;
  isPublicShared?: boolean; // When true: STRICTLY HIDES all owner details!
  contacts?: Contact[];
  onOpenEditForm?: () => void;
  showTopNavbar?: boolean;
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_SECTIONS: NavSection[] = [
  { id: "descriere", label: "Descriere", icon: FileText },
  { id: "apartament", label: "Apartament", icon: Home },
  { id: "bloc", label: "Bloc", icon: Building2 },
  { id: "imprejurimi", label: "Împrejurimi", icon: Compass },
  { id: "transport", label: "Transport", icon: Bus },
  { id: "parcare", label: "Parcare", icon: Car },
  { id: "acte", label: "Acte & Tranzacție", icon: ShieldCheck },
  { id: "tranzactie", label: "Preț & Comision", icon: BadgePercent }
];

export const PropertyDetailView: React.FC<PropertyDetailViewProps> = ({
  lead,
  isPublicShared = false,
  contacts = [],
  onOpenEditForm,
  showTopNavbar = false
}) => {
  const [activeSection, setActiveSection] = useState<string>("descriere");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [copiedOwnerPhone, setCopiedOwnerPhone] = useState<boolean>(false);
  
  // Lightbox Modal state
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);

  // Accordion collapsed states (default open)
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});

  // Agent inquiry form
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSent, setFormSent] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Pre-fill enquiry form message
  useEffect(() => {
    if (lead) {
      const pTitle = lead.extractedData?.crmData?.descriere?.titlu || lead.title || "proprietatea prezentată";
      const pId = lead.propertyId || lead.id || "";
      setFormMessage(`Bună ziua, sunt interesat de proprietatea ${pId ? `[#${pId}] ` : ""}"${pTitle}". Vă rog să mă contactați pentru detalii sau o vizionare.`);
    }
  }, [lead]);

  const getScrollContainer = (node: HTMLElement | null): HTMLElement | Window => {
    let parent = node?.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        return parent;
      }
      parent = parent.parentElement;
    }
    return window;
  };

  // Track active jump link section on scroll across any scroll container
  useEffect(() => {
    let scrollContainer: HTMLElement | Window = window;
    let p = containerRef.current?.parentElement;
    while (p) {
      const style = window.getComputedStyle(p);
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        scrollContainer = p;
        break;
      }
      p = p.parentElement;
    }

    const handleScroll = () => {
      const headerOffset = showTopNavbar ? 160 : 140;
      for (const sect of NAV_SECTIONS) {
        const el = document.getElementById(sect.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= headerOffset && rect.bottom > 90) {
            setActiveSection(sect.id);
            break;
          }
        }
      }
    };

    if (scrollContainer instanceof HTMLElement) {
      scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (scrollContainer instanceof HTMLElement) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [showTopNavbar]);

  const toggleCard = (cardId: string) => {
    setCollapsedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;

    setActiveSection(sectionId);

    // Find the scrollable ancestor container (div or window)
    const scrollContainer = getScrollContainer(el);

    // Header offset for sticky navigation:
    // SharedProperty: Top header (56px) + Jump links (48px) + margin = ~116px
    // Home.tsx: Top header (50px) + Jump links (48px) + margin = ~110px
    const stickyOffset = showTopNavbar ? 116 : 110;

    if (scrollContainer instanceof HTMLElement) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const targetTop = scrollContainer.scrollTop + (elRect.top - containerRect.top) - stickyOffset;
      
      scrollContainer.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth"
      });
    } else {
      const elRect = el.getBoundingClientRect().top;
      const bodyRect = document.body.getBoundingClientRect().top;
      window.scrollTo({
        top: Math.max(0, elRect - bodyRect - stickyOffset),
        behavior: "smooth"
      });
    }
  };

  const handleCopyLink = async () => {
    const currentUrl = lead.id ? getPublicShareUrl(lead.id) : window.location.href;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      toast.success("Linkul public al proprietății a fost copiat!");
    } catch {
      try {
        const tempInput = document.createElement("input");
        tempInput.value = currentUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
        toast.success("Linkul public a fost copiat!");
      } catch {
        toast.error("Vă rugăm să copiați linkul manual.");
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleToggleFavorite = () => {
    const next = !isFavorite;
    setIsFavorite(next);
    if (next) {
      toast.success("Proprietatea a fost adăugată la favorite!");
    } else {
      toast("Proprietatea a fost eliminată din favorite.");
    }
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      toast.error("Vă rugăm să introduceți numele și numărul de telefon.");
      return;
    }
    setFormSubmitting(true);
    setTimeout(() => {
      setFormSubmitting(false);
      setFormSent(true);
      toast.success("Mesajul a fost transmis agentului! Vă vom contacta în scurt timp.");
    }, 600);
  };

  const handleCopyOwnerPhone = async () => {
    if (!lead.ownerPhone) return;
    try {
      await navigator.clipboard.writeText(lead.ownerPhone);
      setCopiedOwnerPhone(true);
      setTimeout(() => setCopiedOwnerPhone(false), 2000);
      toast.success("Telefonul proprietarului a fost copiat!");
    } catch {
      toast.error("Nu s-a putut copia telefonul.");
    }
  };

  // Compile full image list
  const allImages = useMemo(() => {
    const images: string[] = [];
    if (lead?.coverImage && !images.includes(lead.coverImage)) {
      images.push(lead.coverImage);
    }
    const crmImagini = lead?.extractedData?.crmData?.imagini;
    if (crmImagini) {
      const categories = ["living", "camera", "bucatarie", "baie", "alteSpatii"] as const;
      categories.forEach(cat => {
        const list = crmImagini[cat];
        if (Array.isArray(list)) {
          list.forEach(item => {
            const url = typeof item === "string" ? item : item?.original;
            if (url && typeof url === "string" && !images.includes(url)) {
              images.push(url);
            }
          });
        }
      });
    }
    return images;
  }, [lead]);

  const crmData = lead?.extractedData?.crmData;
  const isRent = lead?.transactionType === "Închiriere" || crmData?.detaliiGenerale?.tranzactie === "Închiriere";
  const displayTitle = crmData?.descriere?.titlu || lead?.title || "Proprietate Rezidențială";
  const internalCode = lead?.propertyId || (lead?.id ? `P${lead.id.slice(0, 4)}` : "P41");
  const categoria = crmData?.detaliiGenerale?.categoria || lead?.categoria || "Apartament";

  // Address card values: Oras, Sector, Zona, Strada
  const addressDetails = useMemo(() => {
    const loc = crmData?.detaliiGenerale?.localizare;
    const rawZone = Array.isArray(loc?.zona) ? loc.zona.join(", ") : (loc?.zona || lead?.zone || "");
    
    let sector = "";
    const searchString = `${rawZone} ${loc?.strada || ""} ${lead?.title || ""}`.toLowerCase();
    const sectorMatch = searchString.match(/sector\s*([1-6])/i) || searchString.match(/s([1-6])\b/i);
    if (sectorMatch) {
      sector = `Sector ${sectorMatch[1]}`;
    } else if (rawZone.toLowerCase().includes("nord") || rawZone.toLowerCase().includes("aviatiei") || rawZone.toLowerCase().includes("floreasca") || rawZone.toLowerCase().includes("baneasa")) {
      sector = "Sector 1";
    } else if (rawZone.toLowerCase().includes("teclu") || rawZone.toLowerCase().includes("titan") || rawZone.toLowerCase().includes("dristor") || rawZone.toLowerCase().includes("pallady")) {
      sector = "Sector 3";
    } else if (rawZone.toLowerCase().includes("pipera")) {
      sector = "Ilfov / Nord";
    } else {
      sector = "Sector 1 / Central";
    }

    const oras = loc?.oras || "București";
    const zona = rawZone || "Aviației / Nord";
    const strada = loc?.strada || "Str. Șoseaua Pipera / Zonă rezidențială";

    return {
      oras,
      sector,
      zona,
      strada,
      fullSummary: `${strada}, ${zona}, ${sector}, ${oras}`
    };
  }, [crmData, lead]);

  // Formatted price
  const formattedPrice = useMemo(() => {
    if (crmData?.pret?.detalii?.pret) {
      const val = crmData.pret.detalii.pret;
      const currency = crmData.pret.detalii.moneda || "€";
      return isRent ? `${val} ${currency} / lună` : `${val} ${currency}`;
    }
    if (lead?.price) {
      return lead.price.includes("€") || lead.price.includes("EUR") 
        ? lead.price 
        : `${lead.price} €${isRent ? " / lună" : ""}`;
    }
    return isRent ? "775 € / lună" : "145.000 €";
  }, [crmData, lead, isRent]);

  // Characteristics derived
  const suprafataUtila = crmData?.caracteristici?.suprafete?.utila || "45";
  const compartimentare = crmData?.caracteristici?.detalii?.compartimentare || "decomandat";
  const etaj = crmData?.caracteristici?.detalii?.etaj || "2";
  const anConstructie = crmData?.caracteristici?.alteDetalii?.anConstructie || "după 2000";
  const camere = crmData?.caracteristici?.detalii?.camere || "2";
  const bai = crmData?.caracteristici?.detalii?.bai || "1";
  const balcoane = crmData?.caracteristici?.suprafete?.balcoane || crmData?.caracteristici?.detalii?.balcoane || "1 balcon închis (6 mp)";

  // Guarantee and advance
  const garantie = crmData?.pret?.detalii?.garantie || (isRent ? `${crmData?.pret?.detalii?.pret || "775"} €` : "-");
  const avans = crmData?.pret?.detalii?.avans || (isRent ? "1 lună" : "15%");

  // Agency agent contact info (strictly used in public share so owner info is never leaked!)
  const agencyBroker = {
    name: "Alexandru Popa",
    phone: "0720 000 000",
    role: "Consilier Imobiliar Senior • brokr.",
    agency: "Agenția Imobiliară brokr.",
    email: "contact@brokr.ro"
  };

  return (
    <div ref={containerRef} className="w-full bg-[#F8F9FA] text-gray-900 flex flex-col font-sans selection:bg-[#BE9662]/20">
      
      {/* Top Navbar (only for standalone public share page) */}
      {showTopNavbar && (
        <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 focus:outline-none">
              <span className="text-xl font-black tracking-tight text-[#051D35]">
                brokr<span className="text-[#BE9662]">.</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                Fișă Prezentare
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`h-8 px-3 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                  isFavorite 
                    ? "bg-rose-50 border-rose-200 text-rose-600" 
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                title="Salvează la favorite"
              >
                <Heart size={14} className={isFavorite ? "fill-rose-500 text-rose-500" : "text-gray-400"} />
                <span className="hidden sm:inline">{isFavorite ? "Salvat" : "Favorite"}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="h-8 px-3 rounded-md text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                title="Tipărește oferta"
              >
                <Printer size={14} className="text-gray-400" />
                <span className="hidden sm:inline">Printează</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className={`h-8 px-3.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
                  isCopied 
                    ? "bg-emerald-600 text-white" 
                    : "bg-[#051D35] text-white hover:bg-[#0a2b4a]"
                }`}
                title="Copiază link-ul ofertei"
              >
                {isCopied ? <Check size={14} /> : <Share2 size={14} className="text-[#BE9662]" />}
                <span>{isCopied ? "Link copiat!" : "Distribuie"}</span>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Hero Header Section */}
      <section className="bg-white border-b border-gray-200 pt-5 pb-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Breadcrumb / Category Tags */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 font-medium flex-wrap">
            <span className="text-[#051D35] font-semibold">Imobile</span>
            <span className="text-gray-300">/</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-wide">
              {lead.transactionType || "Închiriere"}
            </span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-600">{categoria}</span>
            <span className="text-gray-300">/</span>
            <span className="font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px] font-bold">
              Cod #{internalCode}
            </span>
          </div>

          {/* Title & Price Row */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#051D35] tracking-tight leading-tight">
                {displayTitle}
              </h1>
              
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <MapPin size={15} className="text-[#BE9662] shrink-0" />
                <span className="font-medium text-gray-700">
                  {addressDetails.fullSummary}
                </span>
              </div>
            </div>

            {/* Price block */}
            <div className="shrink-0 flex md:flex-col items-baseline md:items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 md:mb-0.5">
                {isRent ? "Chirie lunară" : "Preț vânzare"}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#051D35] font-mono tracking-tight">
                {formattedPrice}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Photo Gallery Grid Mosaic */}
      <section className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {allImages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2.5 h-[320px] sm:h-[400px] md:h-[450px] rounded-xl overflow-hidden">
              
              {/* Primary Large Image */}
              <div 
                onClick={() => { setSelectedPhotoIndex(0); setIsGalleryOpen(true); }}
                className="md:col-span-2 md:row-span-2 relative group cursor-pointer overflow-hidden bg-gray-100"
              >
                <img 
                  src={allImages[0]} 
                  alt={displayTitle} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-white text-xs font-semibold flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md">
                    <Maximize2 size={13} />
                    Mărește imaginea principală
                  </span>
                </div>
              </div>

              {/* Smaller secondary images */}
              {[1, 2, 3, 4].map((idx) => {
                const img = allImages[idx];
                const isLastSlot = idx === 4 || idx === allImages.length - 1;
                const remainingCount = Math.max(0, allImages.length - 5);

                if (!img && idx > 0) {
                  return (
                    <div 
                      key={idx} 
                      className="hidden md:flex items-center justify-center bg-gray-50 border border-dashed border-gray-200 text-gray-300 text-xs"
                    >
                      <Building2 size={24} className="opacity-40" />
                    </div>
                  );
                }

                return (
                  <div 
                    key={idx}
                    onClick={() => { setSelectedPhotoIndex(idx); setIsGalleryOpen(true); }}
                    className="hidden md:block relative group cursor-pointer overflow-hidden bg-gray-100"
                  >
                    <img 
                      src={img} 
                      alt={`${displayTitle} - foto ${idx + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
                      referrerPolicy="no-referrer"
                    />
                    
                    {isLastSlot && remainingCount > 0 ? (
                      <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center text-white text-center p-2 group-hover:bg-black/75 transition-colors">
                        <Camera size={22} className="mb-1 text-[#BE9662]" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Vezi toate
                        </span>
                        <span className="text-base font-extrabold font-mono">
                          +{remainingCount + 1} fotografii
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-black/60 text-white p-2 rounded-full backdrop-blur-xs">
                          <Maximize2 size={14} />
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

            </div>
          ) : (
            <div className="h-64 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Camera size={36} className="text-gray-300" />
              <p className="text-xs font-medium">Nu există fotografii încărcate pentru această proprietate</p>
            </div>
          )}

          {/* Quick button to view all photos on mobile */}
          {allImages.length > 0 && (
            <div className="mt-3 flex justify-between items-center md:hidden">
              <span className="text-xs text-gray-500 font-medium">
                {allImages.length} fotografii disponibile
              </span>
              <button
                type="button"
                onClick={() => { setSelectedPhotoIndex(0); setIsGalleryOpen(true); }}
                className="h-8 px-3 rounded-md bg-[#051D35] text-white text-xs font-medium flex items-center gap-1.5"
              >
                <Camera size={13} className="text-[#BE9662]" />
                <span>Vezi galeria completă</span>
              </button>
            </div>
          )}

        </div>
      </section>

      {/* Horizontal Sticky Menu with Jump Links */}
      <div className={`sticky ${showTopNavbar ? "top-14 z-30" : "top-[50px] z-20"} bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2.5">
            {NAV_SECTIONS.map((sect) => {
              const Icon = sect.icon;
              const isActive = activeSection === sect.id;

              return (
                <button
                  key={sect.id}
                  type="button"
                  onClick={() => scrollToSection(sect.id)}
                  className={`shrink-0 h-8 px-3.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-[#051D35] text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={13} className={isActive ? "text-[#BE9662]" : "text-gray-400"} />
                  <span>{sect.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
                    {/* Left Column: All Content Cards (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-6">

            {/* #CARD "DESCRIERE" */}
            <div id="descriere" className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs scroll-mt-28 sm:scroll-mt-32">
              <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#051D35]/5 text-[#051D35] flex items-center justify-center font-bold">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      DESCRIERE
                    </h2>
                    <span className="text-[11px] font-mono text-[#BE9662] font-semibold">
                      (Cod intern: {internalCode})
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="text-xs sm:text-sm text-gray-700 leading-relaxed space-y-3 font-normal whitespace-pre-line">
                  {crmData?.descriere?.continut || lead.notes || (
                    `Apartament cu ${camere} camere, situat în zona ${addressDetails.zona}, ${addressDetails.sector}. Este complet mobilat și utilat, beneficiază de centrală proprie și încălzire în pardoseală, precum și de vedere către spații verzi.\n\nProprietate deosebită, pregătită pentru mutare imediată. Compartimentarea este de tip ${compartimentare}, optimizată inteligent pentru a oferi un confort maxim și spații generoase de depozitare.\n\nFinisajele sunt moderne și de calitate superioară, iar mobilierul a fost atent selecționat pentru a crea o atmosferă primitoare și aerisită. Beneficiază de costuri optime de întreținere datorită centralei proprii și a izolației termice performante.`
                  )}
                </div>
              </div>
            </div>

            {/* #CARD "APARTAMENT" */}
            <div id="apartament" className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs scroll-mt-28 sm:scroll-mt-32">
              <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#051D35]/5 text-[#051D35] flex items-center justify-center font-bold">
                    <Home size={16} />
                  </div>
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    APARTAMENT
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* -Subcategorie "Configuratie" */}
                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Configurație:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">
                    Suprafață utilă {suprafataUtila} mp, compartimentare {compartimentare}, etaj {etaj}, an construcție {anConstructie}, {camere} camere, {bai} {Number(bai) > 1 ? "băi" : "baie"}, balcon {balcoane}
                  </div>
                </div>

                {/* -Subcategorie "Finisaje" */}
                <div className="py-2.5 border-b border-gray-100 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#051D35] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BE9662]" />
                    <span>Finisaje</span>
                  </div>
                  <div className="space-y-1.5 pl-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Living:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">vopsea lavabilă, parchet</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Camera 1:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">vopsea lavabilă, parchet</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Camera 2:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">vopsea lavabilă, parchet</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Bucătărie:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">vopsea lavabilă, faianță și gresie</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Baie 1:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">faianță și gresie</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Baie 2:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">faianță și gresie</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Hol:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">vopsea lavabilă, parchet</div>
                    </div>
                  </div>
                </div>

                {/* -Subcategorie "Mobilare" */}
                <div className="py-2.5 border-b border-gray-100 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#051D35] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BE9662]" />
                    <span>Mobilare</span>
                  </div>
                  <div className="space-y-1.5 pl-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Living:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">canapea, măsuță cafea, comodă</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Camera 1:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">pat, noptiere</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Camera 2:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">pat, dulap</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Bucătărie:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">mobilată</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Baie 1:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">obiecte sanitare premium</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Baie 2:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">obiecte sanitare</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Hol:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">cuier, pantofar</div>
                    </div>
                  </div>
                </div>

                {/* -Subcategorie "Dotari" */}
                <div className="py-2.5 border-b border-gray-100 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#051D35] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BE9662]" />
                    <span>Dotări</span>
                  </div>
                  <div className="space-y-1.5 pl-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Living:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">aer condiționat, smart TV</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Camera 1:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">aer condiționat, draperii</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Camera 2:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">aer condiționat, corp iluminat LED</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Bucătărie:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">frigider încorporat, mașină de spălat vase, plită, cuptor, hotă</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Baie 1:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">cadă / duș, accesorii</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Baie 2:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">cabină duș, vas WC</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs py-0.5">
                      <div className="sm:col-span-3 font-medium text-gray-800">Hol:</div>
                      <div className="sm:col-span-9 text-gray-600 leading-relaxed">interfon, tablou siguranțe</div>
                    </div>
                  </div>
                </div>

                {/* -Subcategorie "Altele" */}
                <div className="py-2.5 last:border-0 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Altele:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">
                    mașină de spălat rufe cu uscător, centrală proprie, încălzire în pardoseală, vedere către curtea interioară
                  </div>
                </div>
              </div>
            </div>

            {/* #CARD "BLOC" */}
            <div id="bloc" className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs scroll-mt-28 sm:scroll-mt-32">
              <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#051D35]/5 text-[#051D35] flex items-center justify-center font-bold">
                    <Building2 size={16} />
                  </div>
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    BLOC
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Acces:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">Tag magnetic, pază 24/7, interfon</div>
                </div>

                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Spații:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">Curte interioară, spații verzi, loc de joacă</div>
                </div>

                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Dotări:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">Lift silențios, supraveghere video, generator curent</div>
                </div>

                <div className="py-2.5 last:border-0 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Servicii:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">Administrație dedicată, mentenanță tehnică, curățenie spații comune</div>
                </div>
              </div>
            </div>

            {/* #CARD "IMPREJURIMI" */}
            <div id="imprejurimi" className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs scroll-mt-28 sm:scroll-mt-32">
              <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#051D35]/5 text-[#051D35] flex items-center justify-center font-bold">
                    <Compass size={16} />
                  </div>
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    ÎMPREJURIMI
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Educație:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">Grădinițe de stat și private, școli gimnaziale, licee în proximitate</div>
                </div>

                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Comerț:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">Promenada Mall, Băneasa Shopping City, Mega Image, Carrefour, Lidl</div>
                </div>

                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Benzinării:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">Rompetrol, OMV, Petrom, Lukoil</div>
                </div>

                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Sănătate:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">Regina Maria, Medicover, clinici private, farmacii nonstop</div>
                </div>

                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Relaxare:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">Parcul Herăstrău (Regele Mihai I), alei de promenadă, spații verzi</div>
                </div>

                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Divertisment:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">Săli World Class, cinematograf multiplex, restaurante și cafenele</div>
                </div>

                <div className="py-2.5 last:border-0 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Obiective:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">Zona de birouri Aviației, Pipera Business District, Promenada</div>
                </div>
              </div>
            </div>

            {/* #CARD "TRANSPORT" */}
            <div id="transport" className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs scroll-mt-28 sm:scroll-mt-32">
              <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#051D35]/5 text-[#051D35] flex items-center justify-center font-bold">
                    <Bus size={16} />
                  </div>
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    TRANSPORT
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Tramvaie:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">Liniile 16, 36</div>
                </div>

                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Troleibuze:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">Liniile 76, 86</div>
                </div>

                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Autobuze:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">Liniile 112, 135, 301, 343</div>
                </div>

                <div className="py-2.5 last:border-0 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Metrou:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">Aurel Vlaicu, Pipera (8-10 minute mers pe jos)</div>
                </div>
              </div>
            </div>

            {/* #CARD "PARCARE" */}
            <div id="parcare" className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs scroll-mt-28 sm:scroll-mt-32">
              <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#051D35]/5 text-[#051D35] flex items-center justify-center font-bold">
                    <Car size={16} />
                  </div>
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    PARCARE
                  </h2>
                </div>
              </div>

              <div className="p-6">
                <div className="py-2.5 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Parcare:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">
                    Publică în zonă, loc de parcare dedicat subteran/suprateran disponibil la cerere / inclus în funcție de contract
                  </div>
                </div>
              </div>
            </div>

            {/* #CARD "ACTE & TRANZACTIE" (Juridic, Disponibilitate, Finanțare) */}
            <div id="acte" className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs scroll-mt-28 sm:scroll-mt-32">
              <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#051D35]/5 text-[#051D35] flex items-center justify-center font-bold">
                    <ShieldCheck size={16} />
                  </div>
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    ACTE & TRANZACȚIE
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Situație juridică:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">
                    Intabulat, extras CF liber de sarcini, certificat energetic clasa A
                  </div>
                </div>

                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Disponibilitate:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">
                    Imediată
                  </div>
                </div>

                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Finanțare:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">
                    Credit bancar / fonduri proprii, înregistrare ANAF
                  </div>
                </div>

                <div className="py-2.5 last:border-0 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Disponibilitate:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">
                    Contract pe minimum 12 luni, fără animale de companie (sau conform acordului părților)
                  </div>
                </div>
              </div>
            </div>

            {/* #CARD "ACTE & TRANZACTIE" (Preț, TVA, Comision) */}
            <div id="tranzactie" className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs scroll-mt-28 sm:scroll-mt-32">
              <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#051D35]/5 text-[#051D35] flex items-center justify-center font-bold">
                    <BadgePercent size={16} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      ACTE & TRANZACȚIE
                    </h2>
                    <span className="text-[11px] text-gray-500">
                      Preț, TVA și Comision agenție
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Preț:</div>
                  <div className="sm:col-span-9 font-bold text-[#051D35] font-mono text-sm leading-relaxed">
                    {formattedPrice}
                  </div>
                </div>

                <div className="py-2.5 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">TVA:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">
                    Scutit de TVA / conform legislației în vigoare
                  </div>
                </div>

                <div className="py-2.5 last:border-0 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 text-xs">
                  <div className="sm:col-span-3 font-semibold text-gray-900">Comision:</div>
                  <div className="sm:col-span-9 text-gray-700 leading-relaxed">
                    {isRent ? "50% + TVA din contravaloarea primei chirii lunare" : "Comision standard agenție"}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-5">
            
            {/* 1. AGENCY CARD (BEFORE agent card per instruction) */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="p-5 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-[#051D35] flex items-center justify-center text-white shadow-xs">
                    <span className="font-black text-sm tracking-tight">
                      b<span className="text-[#BE9662]">.</span>
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#051D35] tracking-tight">
                      Agenția Imobiliară brokr<span className="text-[#BE9662]">.</span>
                    </h3>
                    <p className="text-[10px] text-gray-500 font-medium">
                      Consultanță & Reprezentare Exclusivă
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck size={11} />
                  Verificat
                </span>
              </div>

              <div className="p-5 space-y-3.5 text-xs text-gray-600">
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <Clock size={14} className="text-[#BE9662] shrink-0" />
                  <span>Program de lucru: <strong>Luni - Duminică: 09:00 - 21:00</strong></span>
                </div>

                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <Phone size={14} className="text-[#BE9662] shrink-0" />
                  <span>Telefon centrală: <strong className="font-mono text-gray-900">0720 000 000</strong></span>
                </div>

                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <Mail size={14} className="text-[#BE9662] shrink-0" />
                  <span>Email: <strong className="text-gray-900">contact@brokr.ro</strong></span>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                  <span>Licență & Asigurare profesională</span>
                  <span className="font-mono text-gray-600">ID: BROKR-2026</span>
                </div>
              </div>
            </div>

            {/* 2. AGENT CARD (AFTER agency card per instruction) */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#051D35] to-[#BE9662] text-white flex items-center justify-center font-bold text-base shadow-sm ring-2 ring-white shrink-0">
                    A
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#BE9662]">
                      Consilier Imobiliar
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 truncate">
                      {agencyBroker.name}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {agencyBroker.role}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <a
                    href={`tel:${agencyBroker.phone.replace(/[^0-9+]/g, "")}`}
                    className="h-8 px-2.5 rounded-lg bg-[#051D35] hover:bg-[#0a2b4a] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone size={13} className="text-[#BE9662]" />
                    <span>Sună Agentul</span>
                  </a>

                  <a
                    href={`https://wa.me/4${agencyBroker.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bună ziua, sunt interesat de proprietatea #${internalCode} - ${displayTitle}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare size={13} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3 flex items-center gap-1.5">
                  <span>Solicită o vizionare</span>
                  <span className="text-[#BE9662]">•</span>
                </h4>

                {formSent ? (
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-center space-y-2">
                    <CheckCircle2 size={24} className="text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-emerald-900">
                      Mesajul a fost transmis cu succes!
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      Agentul imobiliar te va contacta în cel mai scurt timp posibil.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                        Numele dumneavoastră *
                      </label>
                      <input 
                        type="text" 
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="ex. Radu Popescu"
                        className="w-full h-8 px-3 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:bg-white focus:border-[#051D35] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                        Număr telefon *
                      </label>
                      <input 
                        type="tel" 
                        required
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="ex. 07xx xxx xxx"
                        className="w-full h-8 px-3 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:bg-white focus:border-[#051D35] transition-colors font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                        Email (opțional)
                      </label>
                      <input 
                        type="email" 
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="nume@exemplu.ro"
                        className="w-full h-8 px-3 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:bg-white focus:border-[#051D35] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                        Mesaj pentru agent
                      </label>
                      <textarea 
                        rows={3}
                        value={formMessage}
                        onChange={(e) => setFormMessage(e.target.value)}
                        className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:bg-white focus:border-[#051D35] transition-colors resize-none leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="w-full h-9 rounded-md bg-[#051D35] hover:bg-[#0a2b4a] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
                    >
                      <Send size={13} className="text-[#BE9662]" />
                      <span>{formSubmitting ? "Se trimite..." : "Trimite Mesaj"}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* 3. OWNER CARD - STRICTLY VISIBLE ONLY INTERNALLY IN CRM (!isPublicShared) */}
            {!isPublicShared && (
              <div className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-xs">
                <div className="p-3.5 bg-amber-50/80 border-b border-amber-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <User size={15} className="text-amber-800" />
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Date Proprietar (Privat CRM)
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded border border-amber-200">
                    <Lock size={10} />
                    Ascuns pe share
                  </span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
                      Nume Proprietar
                    </span>
                    <span className="font-bold text-gray-900 text-sm">
                      {lead.ownerName || "Nespecificat"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
                      Telefon Direct
                    </span>
                    {lead.ownerPhone ? (
                      <div className="flex items-center gap-2">
                        <a 
                          href={`tel:${lead.ownerPhone}`}
                          className="font-mono font-bold text-[#051D35] hover:underline flex items-center gap-1"
                        >
                          <Phone size={13} className="text-[#BE9662]" />
                          {lead.ownerPhone}
                        </a>
                        <button
                          type="button"
                          onClick={handleCopyOwnerPhone}
                          className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                          title="Copiază telefon proprietar"
                        >
                          {copiedOwnerPhone ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Nu este specificat</span>
                    )}
                  </div>

                  {lead.ownerPhone && (
                    <div className="pt-2 border-t border-gray-100 flex gap-2">
                      <a
                        href={`tel:${lead.ownerPhone.replace(/[^0-9+]/g, "")}`}
                        className="flex-1 h-7 rounded bg-[#051D35] text-white font-medium text-xs flex items-center justify-center gap-1 hover:bg-[#0a2b4a] transition-colors"
                      >
                        <Phone size={11} className="text-[#BE9662]" />
                        <span>Apelează</span>
                      </a>
                      <a
                        href={`https://wa.me/4${lead.ownerPhone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 h-7 rounded bg-emerald-600 text-white font-medium text-xs flex items-center justify-center gap-1 hover:bg-emerald-700 transition-colors"
                      >
                        <MessageSquare size={11} />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 italic pt-1">
                    * Aceste date sunt confidențiale și sunt vizibile exclusiv consultanților agenției, nu apar pe link-ul distribuit clienților.
                  </p>
                </div>
              </div>
            )}

            {/* 4. Quick Share Link Box */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-800">
                <span className="flex items-center gap-1.5">
                  <Share2 size={13} className="text-[#BE9662]" />
                  <span>Link de acces public</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Fără date proprietar
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded p-1 pl-2">
                <span className="text-[11px] font-mono text-gray-600 truncate flex-1 select-all">
                  {getPublicShareUrl(lead.id || "")}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="h-6 px-2 rounded text-[11px] font-semibold bg-[#051D35] text-white hover:bg-[#0a2b4a] transition-colors shrink-0"
                >
                  {isCopied ? "Copiat" : "Copiază"}
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Lightbox Photo Gallery Modal */}
      {isGalleryOpen && allImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col">
          <div className="h-14 px-6 flex items-center justify-between text-white border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-1 rounded">
                {selectedPhotoIndex + 1} / {allImages.length}
              </span>
              <span className="text-xs text-gray-300 hidden sm:inline truncate max-w-md">
                {displayTitle}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsGalleryOpen(false)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Închide galeria (Esc)"
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 relative flex items-center justify-center p-4">
            <img 
              src={allImages[selectedPhotoIndex]} 
              alt={`${displayTitle} - ${selectedPhotoIndex + 1}`}
              className="max-h-[82vh] max-w-[90vw] object-contain rounded shadow-2xl transition-all"
              referrerPolicy="no-referrer"
            />

            {allImages.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedPhotoIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
                title="Fotografia anterioară"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {allImages.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedPhotoIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1))}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
                title="Următoarea fotografie"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          <div className="h-20 bg-black/60 border-t border-white/10 px-4 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedPhotoIndex(idx)}
                className={`w-14 h-12 rounded overflow-hidden border-2 transition-all shrink-0 ${
                  selectedPhotoIndex === idx 
                    ? "border-[#BE9662] scale-105" 
                    : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
