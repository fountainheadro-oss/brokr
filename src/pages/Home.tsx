import React, { useState, useEffect, useRef } from "react";
import { Header } from "../components/Header";
import { AddLeadModal } from "../components/AddLeadModal";
import { LeadList } from "../components/LeadList";
import { LeadCard } from "../components/LeadCard";
import { leadsService, Lead, LeadStatus } from "../services/leadsService";
import { contactsService, Contact } from "../services/contactsService";
import { viewingsService, Viewing } from "../services/viewingsService";
import { downloadVCard } from "../lib/vcard";
import { AddContactModal } from "../components/AddContactModal";
import { AddViewingModal } from "../components/AddViewingModal";
import { PropertyQuickViewModal } from "../components/PropertyQuickViewModal";
import { NotificationsModal } from "../components/NotificationsModal";
import { ExtractionRulesModal } from "../components/ExtractionRulesModal";
import { notificationsService, Notification as AppNotification } from "../services/notificationsService";
import { motion, AnimatePresence } from "motion/react";
import { extractData, extractBasicData } from "../services/geminiService";
import { toast } from "react-hot-toast";
import { 
  DetaliiGeneraleSection, 
  CaracteristiciSection, 
  UtilitatiSection, 
  PretSection, 
  DescriereSection, 
  ImaginiSection
} from "../components/PropertyForm";
import { FormInput, FormSelect } from "../components/FormElements";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { 
  ChevronDown, 
  ChevronLeft, 
  Zap, 
  Search, 
  Hash,
  Database, 
  Copy, 
  Download, 
  Check, 
  X, 
  Loader2,
  Trash2,
  Users,
  Plus,
  Phone,
  Clock,
  Calendar,
  Info,
  Layout,
  MessageSquare,
  Filter,
  Share2,
  ExternalLink
} from "lucide-react";
import { getPublicShareUrl } from "../utils/shareUtils";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { CATEGORIA_OPTIONS, TRANZACTIE_OPTIONS } from "../constants";

import { ViewingDetailsModal } from "../components/ViewingDetailsModal";
import { NevalidataUrlList } from "../components/NevalidataUrlList";
import { NevalidataDetailsModal } from "../components/NevalidataDetailsModal";
import { CalificataDetailsModal } from "../components/CalificataDetailsModal";

const TABS: LeadStatus[] = ["Nevalidata", "Calificata", "Activa", "AreInteres", "InNegociere", "Finalizata", "Arhiva", "Sterse"];

const STATUS_LABELS: Record<LeadStatus, string> = {
  "Nevalidata": "Nevalidate",
  "Calificata": "Calificate",
  "Activa": "Active pe piață",
  "AreInteres": "Au Interes",
  "InNegociere": "In Negociere",
  "Finalizata": "Finalizate",
  "Arhiva": "Arhivă",
  "Sterse": "Șterse"
};

type SortOption = 'newest' | 'oldest' | 'expensive' | 'cheap';
type TransactionFilter = 'Toate' | 'Vânzare' | 'Închiriere';

const parsePrice = (priceStr: string): number => {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
};

const getTimestampMs = (val: any): number => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (val && val.seconds !== undefined) return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
  if (val instanceof Date) return val.getTime();
  const dateObj = new Date(val);
  if (!isNaN(dateObj.getTime())) return dateObj.getTime();
  return 0;
};

const formatDateGroup = (timestamp: any): string => {
  if (!timestamp) return "Fără dată";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const formatted = date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const getPriceRange = (price: number): string => {
  if (price === 0) return "Fără preț";
  if (price <= 500) return "1-500€";
  if (price <= 1000) return "501-1000€";
  if (price <= 2000) return "1001-2000€";
  return "2000+";
};

const getTextFromChildren = (children: any): string => {
  if (!children) return "";
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(getTextFromChildren).join("");
  if (typeof children === "object" && children.props && children.props.children) return getTextFromChildren(children.props.children);
  return "";
};

const TableHeaderCopyButton = ({ children, isImageTable = false }: { children: any; isImageTable?: boolean }) => {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleCopyTable = (e: React.MouseEvent) => {
    e.stopPropagation();
    const table = ref.current?.closest("table");
    if (table) {
      const text = table.innerText;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const table = ref.current?.closest("table");
    if (!table) return;
    
    const images = Array.from(table.querySelectorAll("img"));
    for (let i = 0; i < images.length; i++) {
      const url = images[i].src;
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `image-${i + 1}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.error("Failed to download image", url);
      }
    }
  };

  return (
    <div ref={ref} className="group/hcell relative w-full min-h-[20px] py-1">
      <div className="break-words whitespace-normal">{children}</div>
      <div className="opacity-0 group-hover/hcell:opacity-100 flex items-center gap-1 absolute right-0 top-1 z-10 transition-opacity">
        <button 
          onClick={handleCopyTable}
          className="flex items-center justify-center w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-[#f44336] transition-all shadow-sm active:scale-90"
        >
          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
        </button>
        {isImageTable && (
          <button 
            onClick={handleDownloadAll}
            className="flex items-center justify-center w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-[#f44336] transition-all shadow-sm active:scale-90"
          >
            <Download size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

const CellCopyButton = ({ text, isImage = false, url = "", isRowDownload = false, rowRef = null }: { text: string; isImage?: boolean; url?: string; isRowDownload?: boolean; rowRef?: React.RefObject<HTMLTableRowElement> | null }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url || text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!url) return;
    downloadImage(url);
  };

  const handleDownloadRow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!rowRef?.current) return;
    const images = Array.from(rowRef.current.querySelectorAll("img"));
    for (let i = 0; i < images.length; i++) {
        await downloadImage(images[i].src, `cat-image-${i + 1}-${Date.now()}.png`);
        await new Promise(r => setTimeout(r, 300));
    }
  };

  const downloadImage = async (imgUrl: string, fileName?: string) => {
    try {
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || `property-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(imgUrl, "_blank");
    }
  };

  return (
    <div className="hidden group-hover/row:flex items-center gap-1 absolute right-1 top-1 z-20 transition-all">
      {!isRowDownload && (
        <button 
          onClick={handleCopy}
          className="flex items-center justify-center w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-[#f44336] transition-all shadow-sm active:scale-90"
        >
          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
        </button>
      )}
      {isImage && !isRowDownload && (
        <button 
          onClick={handleDownloadSingle}
          className="flex items-center justify-center w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-[#f44336] transition-all shadow-sm active:scale-90"
        >
          <Download size={12} />
        </button>
      )}
      {isRowDownload && (
        <button 
          onClick={handleDownloadRow}
          className="flex items-center justify-center w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-[#f44336] transition-all shadow-sm active:scale-90"
        >
          <Download size={12} />
        </button>
      )}
    </div>
  );
};

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LeadStatus>("Nevalidata");
  const [lastVisitedTimes, setLastVisitedTimes] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('lastVisited_tabs');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('Toate');
  const [categoryFilter, setCategoryFilter] = useState<string>('Toate');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isViewingModalOpen, setIsViewingModalOpen] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedNevalidatLead, setSelectedNevalidatLead] = useState<Lead | null>(null);
  const [selectedCalificatLead, setSelectedCalificatLead] = useState<Lead | null>(null);
  const [selectedQuickViewLead, setSelectedQuickViewLead] = useState<Lead | null>(null);
  const [selectedViewing, setSelectedViewing] = useState<Viewing | null>(null);
  const [isViewingDetailsOpen, setIsViewingDetailsOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState("");
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [editedPropertyId, setEditedPropertyId] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [editedZone, setEditedZone] = useState("");
  const [editedPrice, setEditedPrice] = useState("");
  const [editedTransactionType, setEditedTransactionType] = useState<"Vânzare" | "Închiriere">("Vânzare");
  const [editedCategoria, setEditedCategoria] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isExtractionRulesOpen, setIsExtractionRulesOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  const handleCopyDomain = async (domain: string) => {
    try {
      await navigator.clipboard.writeText(domain);
      setCopiedDomain(domain);
      setTimeout(() => setCopiedDomain(null), 3000);
      toast.success("Domeniul a fost copiat în clipboard!");
    } catch (err) {
      // Fallback for when modern clipboard API is restricted/unsupported in iframes
      try {
        const tempInput = document.createElement("input");
        tempInput.value = domain;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        setCopiedDomain(domain);
        setTimeout(() => setCopiedDomain(null), 3000);
        toast.success("Domeniul a fost copiat!");
      } catch (fallbackErr) {
        console.error("Nu s-a putut copia domeniul:", fallbackErr);
        toast.error("Vă rugăm să selectați și să copiați textul manual.");
      }
    }
  };

  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  const handleCopyShareLink = async (id: string) => {
    const url = getPublicShareUrl(id);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedShareId(id);
      setTimeout(() => setCopiedShareId(null), 3000);
      toast.success("Linkul public fără autentificare a fost copiat!");
    } catch (err) {
      try {
        const tempInput = document.createElement("input");
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        setCopiedShareId(id);
        setTimeout(() => setCopiedShareId(null), 3000);
        toast.success("Linkul public a fost copiat!");
      } catch (fallbackErr) {
        toast.error("Vă rugăm să copiați linkul manual.");
      }
    }
  };

  const lastOptimisticUpdate = useRef<{ id: string, time: number } | null>(null);

  const [activeSection, setActiveSection] = useState<string>("basicale");

  const activeSectionsList = React.useMemo(() => {
    const hasExtractionData = Boolean(selectedLead?.extractedData);
    if (hasExtractionData) {
      return [
        { id: "basicale", label: "Informații de Bază" },
        { id: "detaliigenerale", label: "Detalii Generale" },
        { id: "caracteristici", label: "Caracteristici" },
        { id: "utilitati", label: "Utilități" },
        { id: "pret", label: "Preț" },
        { id: "descriere", label: "Descriere" },
        { id: "imagini", label: "Imagini" },
        { id: "identificare", label: "Identificare" },
        { id: "contactealocate", label: "Contacte Alocate" },
        { id: "vizionaridb", label: "Vizionări" }
      ];
    } else {
      return [
        { id: "basicale", label: "Informații de Bază" },
        { id: "identificare", label: "Identificare" },
        { id: "contactealocate", label: "Contacte Alocate" },
        { id: "vizionaridb", label: "Vizionări" }
      ];
    }
  }, [selectedLead]);

  const handleDetailsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const isDesktop = window.innerWidth >= 1024;
    
    // On desktop, Column 1 sections (identificare, contactealocate, vizionaridb) are in a sticky sidebar.
    // They are relatively static on the viewport and don't scroll past the header, so we exclude them
    // from scroll tracking to allow Column 2's scrolling cards to highlight properly.
    const scrollSections = isDesktop 
      ? activeSectionsList.filter(s => !["identificare", "contactealocate", "vizionaridb"].includes(s.id))
      : activeSectionsList;

    let closestSection = activeSection;
    let minDistance = Infinity;
    const headerOffset = 130; // 96px header + extra margin for focus threshold

    for (const sect of scrollSections) {
      const el = document.getElementById(sect.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        
        // Exact overlap detection: if the section top has scrolled past the header, 
        // and its bottom hasn't cleared the header yet, it's the active view!
        if (rect.top <= headerOffset + 24 && rect.bottom > headerOffset) {
          closestSection = sect.id;
          break;
        }
        
        const distance = Math.abs(rect.top - headerOffset);
        if (distance < minDistance) {
          minDistance = distance;
          closestSection = sect.id;
        }
      }
    }

    // Auto-select the last section if scrolled fully to the bottom
    const target = e.currentTarget;
    const isAtBottom = Math.abs(target.scrollHeight - target.clientHeight - target.scrollTop) < 20;
    if (isAtBottom && scrollSections.length > 0) {
      closestSection = scrollSections[scrollSections.length - 1].id;
    }
    
    if (closestSection && closestSection !== activeSection) {
      setActiveSection(closestSection);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getCompletionState = (id: string) => {
    if (!selectedLead) return 'empty';
    const crm = selectedLead.extractedData?.crmData;
    
    switch (id) {
      case 'basicale': {
        const fields = [editedTitle, editedName, editedPhone, editedZone, editedPrice];
        const filled = fields.filter(f => f && String(f).trim() !== '').length;
        if (filled === 0) return 'empty';
        if (filled === fields.length) return 'complete';
        return 'partial';
      }
      case 'detaliigenerale': {
        const dg = crm?.detaliiGenerale;
        if (!dg) return 'empty';
        const hasOras = Boolean(dg.localizare?.oras);
        const hasZona = Array.isArray(dg.localizare?.zona) && dg.localizare.zona.length > 0;
        const hasTranzactie = Boolean(dg.tranzactie);
        const hasCategoria = Boolean(dg.categoria);
        
        const total = 4;
        const filled = [hasOras, hasZona, hasTranzactie, hasCategoria].filter(Boolean).length;
        if (filled === 0) return 'empty';
        if (filled === total) return 'complete';
        return 'partial';
      }
      case 'caracteristici': {
        const car = crm?.caracteristici;
        if (!car) return 'empty';
        const sup = car.suprafete?.utila;
        const stadiu = car.alteDetalii?.stadiuConstructie;
        const filled = [sup, stadiu].filter(f => f !== undefined && f !== null && String(f).trim() !== '').length;
        if (filled === 0) return 'empty';
        if (filled === 2) return 'complete';
        return 'partial';
      }
      case 'utilitati': {
        const ut = crm?.utilitati;
        if (!ut) return 'empty';
        const hasSomething = Object.values(ut).some((val: any) => {
          if (Array.isArray(val)) return val.length > 0;
          if (typeof val === 'object' && val !== null) return Object.values(val).some(v => v);
          return val;
        });
        return hasSomething ? 'complete' : 'empty';
      }
      case 'pret': {
        const pret = crm?.pret;
        if (!pret) return 'empty';
        const hasSomething = pret.detalii?.pret || pret.detalii?.garantie || pret.detalii?.avans;
        return hasSomething ? 'complete' : 'empty';
      }
      case 'descriere': {
        const desc = crm?.descriere;
        if (!desc) return 'empty';
        const hasSomething = desc.titlu || desc.continut;
        if (!hasSomething) return 'empty';
        if (desc.titlu && desc.continut) return 'complete';
        return 'partial';
      }
      case 'imagini': {
        const img = crm?.imagini;
        if (!img) return 'empty';
        const hasImages = Object.values(img).some((arr: any) => Array.isArray(arr) && arr.length > 0);
        return hasImages ? 'complete' : 'empty';
      }
      case 'identificare': {
        return editedPropertyId ? 'complete' : 'empty';
      }
      case 'contactealocate': {
        const count = contacts.filter(c => c.propertyId === selectedLead.id).length;
        return count > 0 ? 'complete' : 'empty';
      }
      case 'vizionaridb': {
        const count = viewings.length;
        return count > 0 ? 'complete' : 'empty';
      }
      default:
        return 'empty';
    }
  };

  const handleUpdate = React.useCallback(async (leadId: string, path: string, val: any) => {
    console.log(`[Home] handleUpdate starting for lead ${leadId}, path: ${path}`, val);
    const now = Date.now();
    lastOptimisticUpdate.current = { id: leadId, time: now };

    // Optimistic update for immediate visual feedback
    if (path.startsWith('crmData.')) {
      const updateFn = (prev: any) => {
        if (!prev) return prev;
        // Surgical shallow clone to preserve methods/Prototypes (like Timestamps)
        const next = { ...prev };
        const nextExtracted = next.extractedData ? { ...next.extractedData } : {};
        
        let current = nextExtracted;
        const parts = path.split('.');
        
        // Navigate and clone each level
        for (let i = 0; i < parts.length - 1; i++) {
          const key = parts[i];
          current[key] = current[key] ? { ...current[key] } : {};
          current = current[key];
        }
        
        // Set final value
        current[parts[parts.length - 1]] = val;
        next.extractedData = nextExtracted;

        // Sync top-level categoria if crmData.detaliiGenerale.categoria is updated
        if (path === 'crmData.detaliiGenerale.categoria') {
          next.categoria = val;
        }
        
        // Sync top-level title if crmData.descriere.titlu is updated
        if (path === 'crmData.descriere.titlu') {
          next.title = val;
        }

        return next;
      };

      setSelectedLead(prev => prev?.id === leadId ? updateFn(prev) : prev);
      setLeads(prev => prev.map(l => l.id === leadId ? updateFn(l) : l));
      console.log(`[Home] Optimistic state updated for ${path}`);
    }

    try {
      if (path === 'crmData.detaliiGenerale.categoria') {
        await leadsService.updateLeadData(leadId, { categoria: val });
      }
      if (path === 'crmData.descriere.titlu') {
        await leadsService.updateLeadData(leadId, { title: val });
      }
      await leadsService.updateNestedField(leadId, `extractedData.${path}`, val);
      console.log(`[Home] Firestore write success for ${path}`);
    } catch (e) {
      console.error('[Home] Firestore write failed:', e);
      // Optional: Rollback if needed, but usually next Firestore sync handles it
    }
  }, []);

  useEffect(() => {
    if (selectedLead?.id && user) {
      const unsub = viewingsService.subscribeToPropertyViewings(selectedLead.id, (v) => {
        setViewings(v);
      });
      return () => unsub();
    } else {
      setViewings([]);
    }
  }, [selectedLead?.id, user]);

  const triggerExtraction = React.useCallback(async (lead: Lead) => {
    setIsExtracting(true);
    setExtractionStatus("Accesare URL...");
    try {
      console.log(`[Home] Fetching /api/crawl for ${lead.url}`);
      const crawlRes = await fetch("/api/crawl", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ url: lead.url }),
      });
      
      const contentType = crawlRes.headers.get("content-type");
      if (!crawlRes.ok || !contentType || !contentType.includes("application/json")) {
        const text = await crawlRes.text();
        console.error("Server error response:", text.substring(0, 500));
        
        let errorMessage = "Eroare la accesarea URL-ului";
        try {
          const errorJson = JSON.parse(text);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          if (text.includes("<!doctype html>")) {
            errorMessage = "Eroarea serverului (Proxy timeout sau eroare de start). Reîncearcă în câteva secunde.";
          }
        }
        
        throw new Error(errorMessage);
      }

      const { text, title, images: rawImages } = await crawlRes.json();
      console.log(`[Home] Crawler found ${rawImages?.length || 0} raw images`);
      
      setExtractionStatus("Filtrare imagini...");
      const filterImagesBySize = async (urls: string[]): Promise<string[]> => {
        const filteredUrls: string[] = [];
        
        // Check in batches of 8 to keep it incredibly fast without overloading the browser or server connection pooling
        const checkChunk = async (chunk: string[]) => {
          const promises = chunk.map(url => {
            return new Promise<void>((resolve) => {
              const img = new Image();
              const timeout = setTimeout(() => {
                img.src = "";
                resolve();
              }, 6000); // 6s timeout
              
              img.onload = () => {
                clearTimeout(timeout);
                // Minimum size threshold 350px to filter out thumbnails and ads
                if (img.width >= 350 || img.height >= 350) {
                  filteredUrls.push(url);
                }
                resolve();
              };
              img.onerror = () => {
                clearTimeout(timeout);
                resolve();
              };
              img.src = `/api/proxy-image?url=${encodeURIComponent(url)}&noclean=true`;
            });
          });
          await Promise.all(promises);
        };
        
        for (let i = 0; i < urls.length; i += 8) {
          await checkChunk(urls.slice(i, i + 8));
        }
        
        return filteredUrls;
      };

      const images = await filterImagesBySize(rawImages || []);

      setExtractionStatus("Analiză Gemini...");
      const extraction = await extractData(text, title, images, lead.propertyId, lead.url);
      
      const transType = (extraction.crmData?.detaliiGenerale?.tranzactie || "").toLowerCase().includes("inchiriere") 
        ? "Închiriere" 
        : "Vânzare";

      const extractedPrice = extraction.crmData?.pret?.detalii?.pret;
      const extractedCurrency = extraction.crmData?.pret?.detalii?.moneda || "";
      const priceStr = extractedPrice 
        ? (extractedPrice.includes("€") || extractedPrice.includes("EUR") || extractedPrice.includes("lei") || extractedPrice.includes("RON")
            ? extractedPrice 
            : `${extractedPrice} ${extractedCurrency}`.trim())
        : lead.price;

      const deepCoverImage = images && images.length > 0 ? images[0] : lead.coverImage;

      const updatedFields = {
        extractedData: extraction,
        categoria: extraction.crmData?.detaliiGenerale?.categoria || lead.categoria || "Alte tipuri",
        title: extraction.crmData?.descriere?.titlu || lead.title || "Fără titlu",
        price: priceStr || "N/A",
        ownerName: (extraction.crmData?.detaliiGenerale?.proprietar && extraction.crmData.detaliiGenerale.proprietar !== "Nespecificat" && extraction.crmData.detaliiGenerale.proprietar !== "") 
          ? extraction.crmData.detaliiGenerale.proprietar 
          : lead.ownerName || "Nespecificat",
        ownerPhone: (extraction.crmData?.detaliiGenerale?.contacteAditionale && extraction.crmData.detaliiGenerale.contacteAditionale !== "Nespecificat" && extraction.crmData.detaliiGenerale.contacteAditionale !== "") 
          ? extraction.crmData.detaliiGenerale.contacteAditionale 
          : lead.ownerPhone || "Nespecificat",
        transactionType: transType as "Închiriere" | "Vânzare",
        zone: (extraction.crmData?.detaliiGenerale?.localizare?.zona?.[0] || extraction.crmData?.detaliiGenerale?.localizare?.oras || lead.zone || "București"),
        coverImage: deepCoverImage
      };

      await leadsService.updateLeadData(lead.id!, updatedFields);
      
      // Update local leads list
      setLeads(prev => prev.map(l => l.id === lead.id ? {
        ...l,
        ...updatedFields
      } : l));
      
      // Update local selected lead to show results
      setSelectedLead(prev => prev?.id === lead.id ? { 
        ...prev, 
        ...updatedFields
      } : prev);

      // Also update selectedCalificatLead state so that the modal stays in sync
      setSelectedCalificatLead(prev => prev?.id === lead.id ? {
        ...prev,
        ...updatedFields
      } : prev);
    } catch (error) {
      console.error(error);
      setExtractionStatus("Eroare la extracție");
    } finally {
      setIsExtracting(false);
      setExtractionStatus("");
    }
  }, []);

  const groupedLeads = React.useMemo(() => {
    const filtered = leads
      .filter(lead => lead.status === activeTab)
      .filter(lead => {
        if (transactionFilter === 'Toate') return true;
        const type = lead.transactionType as string;
        if (!type) return false;
        // Robust check for diacritics
        if (transactionFilter === 'Închiriere') return type === 'Închiriere' || type === 'Inchiriere';
        if (transactionFilter === 'Vânzare') return type === 'Vânzare' || type === 'Vanzare';
        return type === transactionFilter;
      })
      .filter(lead => {
        if (categoryFilter === 'Toate') return true;
        // Check top-level lead.categoria first, fallback to extractedData
        const leadCat = lead.categoria || lead.extractedData?.crmData?.detaliiGenerale?.categoria;
        if (!leadCat) return false;
        
        // Robust check for singular/plural mismatch
        const normalizedLead = String(leadCat || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const normalizedFilter = String(categoryFilter || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        if (normalizedLead === normalizedFilter) return true;
        
        // Basic singular/plural check (e.g., "spatiu comercial" vs "spatii comerciale")
        // This is a bit complex in Romanian, but let's at least handle the common patterns
        const isCommMatch = (normalizedFilter.includes("comercial") && normalizedLead.includes("comercial"));
        const isOfficeMatch = (normalizedFilter.includes("birou") && normalizedLead.includes("birou"));
        const isIndMatch = (normalizedFilter.includes("industrial") && normalizedLead.includes("industrial"));
        const isDepMatch = (normalizedFilter.includes("depozitare") && normalizedLead.includes("depozitare"));
        const isHaleMatch = (normalizedFilter.includes("hale") && normalizedLead.includes("hale"));
        const isAppMatch = (normalizedFilter.includes("apartament") && normalizedLead.includes("apartament"));
        const isHouseMatch = (normalizedFilter.includes("casa") && normalizedLead.includes("casa"));
        const isLandMatch = (normalizedFilter.includes("teren") && normalizedLead.includes("teren"));

        return isCommMatch || isOfficeMatch || isIndMatch || isDepMatch || isHaleMatch || isAppMatch || isHouseMatch || isLandMatch;
      });

    const sorted = [...filtered].sort((a, b) => {
      if (sortOption === 'newest') {
        const timeA = a.updatedAt?.toMillis?.() || 0;
        const timeB = b.updatedAt?.toMillis?.() || 0;
        return timeB - timeA;
      }
      if (sortOption === 'oldest') {
        const timeA = a.updatedAt?.toMillis?.() || 0;
        const timeB = b.updatedAt?.toMillis?.() || 0;
        return timeA - timeB;
      }
      if (sortOption === 'expensive') {
        return parsePrice(b.price) - parsePrice(a.price);
      }
      if (sortOption === 'cheap') {
        return parsePrice(a.price) - parsePrice(b.price);
      }
      return 0;
    });

    const groups: { [key: string]: Lead[] } = {};
    
    sorted.forEach(lead => {
      let groupKey = "";
      if (sortOption === 'newest' || sortOption === 'oldest') {
        groupKey = formatDateGroup(lead.updatedAt);
      } else {
        groupKey = getPriceRange(parsePrice(lead.price));
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(lead);
    });

    return groups;
  }, [leads, activeTab, sortOption, transactionFilter, categoryFilter]);

  const handleLeadClick = React.useCallback((lead: Lead) => {
    if (lead.status === "Nevalidata") {
      setSelectedNevalidatLead(lead);
      return;
    }
    if (lead.status === "Calificata") {
      setSelectedCalificatLead(lead);
      return;
    }

    setSelectedLead(lead);
    setShowDeleteConfirm(false);
    setEditedName(lead.ownerName || "");
    setEditedPhone(lead.ownerPhone || "");
    setEditedPropertyId(lead.propertyId || "");
    setEditedTitle(lead.title || "");
    setEditedZone(lead.zone || "");
    setEditedPrice(lead.price || "");
    setEditedTransactionType(lead.transactionType || "Vânzare");
    setEditedCategoria(lead.categoria || "");
    setIsEditingDetails(false);
    if (lead.status === "Activa" && !lead.extractedData && !isExtracting) {
      triggerExtraction(lead);
    }
  }, [triggerExtraction]);

  useEffect(() => {
    setLastVisitedTimes(prev => {
      const updated = { ...prev, [activeTab]: Date.now() };
      localStorage.setItem('lastVisited_tabs', JSON.stringify(updated));
      return updated;
    });
  }, [activeTab, leads]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkAutoArchive = async () => {
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

      const toArchive = leads.filter(lead => {
        if (lead.status === 'Arhiva' || lead.status === 'Sterse') return false;
        
        // Ensure we have valid timestamps before checking age
        // serverTimestamp() returns null or a FieldValue proxy initially in local state
        if (!lead.createdAt && !lead.updatedAt) return false;

        // Use createdAt as requested by user. Fallback to updatedAt if missing.
        let effectiveDate: Date | null = null;
        
        if (lead.createdAt) {
          if (lead.createdAt.toDate) effectiveDate = lead.createdAt.toDate();
          else if (typeof lead.createdAt.toMillis === 'function') effectiveDate = new Date(lead.createdAt.toMillis());
          else if (lead.createdAt instanceof Date) effectiveDate = lead.createdAt;
          else if (typeof lead.createdAt === 'string' || typeof lead.createdAt === 'number') effectiveDate = new Date(lead.createdAt);
        }
        
        if (!effectiveDate && lead.updatedAt) {
          if (lead.updatedAt.toDate) effectiveDate = lead.updatedAt.toDate();
          else if (typeof lead.updatedAt.toMillis === 'function') effectiveDate = new Date(lead.updatedAt.toMillis());
          else if (lead.updatedAt instanceof Date) effectiveDate = lead.updatedAt;
          else if (typeof lead.updatedAt === 'string' || typeof lead.updatedAt === 'number') effectiveDate = new Date(lead.updatedAt);
        }

        // If date is still invalid or null, skip (it's likely a pending server timestamp)
        if (!effectiveDate || isNaN(effectiveDate.getTime())) return false;

        return effectiveDate < thirtyOneDaysAgo;
      });

      for (const lead of toArchive) {
        try {
          await leadsService.updateLeadStatus(lead.id!, 'Arhiva');
          toast.success(`Proprietatea "${lead.title}" a fost mutată automat în Arhivă după 31 de zile.`);
        } catch (e) {
          console.error("Auto-archive failed for", lead.id, e);
        }
      }
    };

    if (leads.length > 0) {
      checkAutoArchive();
    }
  }, [leads]);

  useEffect(() => {
    if (user) {
      const unsubLeads = leadsService.subscribeToLeads((updatedLeads) => {
        setLeads(updatedLeads);
      });
      const unsubContacts = contactsService.subscribeToContacts((updatedContacts) => {
        setContacts(updatedContacts);
      });
      const unsubNotifications = notificationsService.getNotifications((updatedNotifications) => {
        setNotifications(updatedNotifications);
      });
      return () => {
        unsubLeads();
        unsubContacts();
        unsubNotifications();
      };
    } else {
      setLeads([]);
      setContacts([]);
    }
  }, [user]);

  useEffect(() => {
    if (selectedLead && leads.length > 0) {
      const currentLead = leads.find(l => l.id === selectedLead.id);
      if (currentLead) {
        // Skip sync if we just did an optimistic update on this lead in the last 10 seconds
        // Increased from 5s to 10s to be very safe against slow Firestore propagation
        if (lastOptimisticUpdate.current?.id === selectedLead.id && (Date.now() - lastOptimisticUpdate.current.time < 10000)) {
          // Still check if it's the SAME lead ID, if not, we should probably allow sync
          return;
        }

        // Simple comparison of stable fields to avoid Timestamp serialization mismatches
        const leadCompare = { ...currentLead, createdAt: null, updatedAt: null, lastMovedAt: null };
        const selectedCompare = { ...selectedLead, createdAt: null, updatedAt: null, lastMovedAt: null };
        
        if (JSON.stringify(leadCompare) !== JSON.stringify(selectedCompare)) {
          console.log('[Home] Syncing selectedLead from leads array (mismatch found)', { leadCompare, selectedCompare });
          setSelectedLead(currentLead);
          if (!isEditingDetails) {
            setEditedName(currentLead.ownerName || "");
            setEditedPhone(currentLead.ownerPhone || "");
            setEditedPropertyId(currentLead.propertyId || "");
            setEditedTitle(currentLead.title || "");
            setEditedZone(currentLead.zone || "");
            setEditedPrice(currentLead.price || "");
            setEditedTransactionType(currentLead.transactionType || "Vânzare");
            setEditedCategoria(currentLead.categoria || "");
          }
        }
      }
    }
  }, [leads, selectedLead?.id]);

  const handleLogin = async () => {
    try {
      setLoginError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed:", error);
      setLoginError(error?.message || String(error));
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#f44336]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mb-10 border border-gray-50">
           <Zap size={48} fill="currentColor" className="text-[--color-accent]" />
        </div>
        <div className="mb-10">
          <span className="font-montserrat text-5xl font-extrabold tracking-tight text-gray-900">
            brokr<span className="ml-[-1px]" style={{ color: "var(--color-accent)" }}>.</span>
          </span>
          <p className="mt-4 text-[--color-text-secondary] font-medium text-base max-w-xs mx-auto">Extracție de date imobiliare asistată de AI. Transformă URL-urile în date structurate.</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleLogin}
          className="w-full max-w-xs bg-[#000000] text-white hover:bg-[#333333] transition-colors rounded-full h-14 font-semibold flex items-center justify-center gap-3"
        >
          <span>Login cu Google</span>
        </motion.button>

        {loginError && (
          <div className="mt-6 p-5 bg-red-50 border border-red-200 rounded-2xl text-left max-w-md mx-auto text-sm text-red-800">
            {loginError.includes("auth/configuration-not-found") ? (
              <>
                <h3 className="font-bold text-red-900 mb-2">Eroare de configurare Firebase</h3>
                <p className="mb-3 text-red-700">
                  Eroarea <code className="bg-red-100 px-1 py-0.5 rounded font-mono font-semibold">auth/configuration-not-found</code> indică faptul că serviciul de <strong>Authentication</strong> și furnizorul <strong>Google Sign-In</strong> nu sunt activate în noul dvs. proiect Firebase <strong>brokr-42038</strong>.
                </p>
                <h4 className="font-semibold text-red-900 mb-1">Câțiva pași simpli de urmat:</h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-red-700">
                  <li>
                    Accesați direct:{" "}
                    <a
                      href="https://console.firebase.google.com/project/brokr-42038/authentication"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold text-red-600 hover:text-red-950"
                    >
                      Consola Firebase Auth (brokr-42038)
                    </a>
                  </li>
                  <li>
                    Dacă este prima dată când accesați această secțiune, apăsați pe butonul albastru <strong>Get Started</strong> (sau <strong>Începeți</strong>).
                  </li>
                  <li>
                    În tab-ul <strong>Sign-in method</strong>, apăsați pe <strong>Add new provider</strong> și selectați <strong>Google</strong>. Activați-l, introduceți opțiunile cerute (email de asistență, etc.) și apăsați pe <strong>Save</strong>.
                  </li>
                  <li>
                    Reveniți în această fereastră și reîncercați autentificarea cu Google!
                  </li>
                </ol>
              </>
            ) : loginError.includes("auth/unauthorized-domain") ? (
              <>
                <h3 className="font-bold text-red-900 mb-2">Domeniu neautorizat (Unauthorized Domain)</h3>
                <p className="mb-3 text-red-700">
                  Eroarea <code className="bg-red-100 px-1 py-0.5 rounded font-mono font-semibold">auth/unauthorized-domain</code> apare deoarece domeniile în care rulează aplicația nu sunt încă înregistrate în lista de domenii de încredere a noului dvs. proiect Firebase.
                </p>
                <h4 className="font-semibold text-red-900 mb-1">Câțiva pași rapizi pentru rezolvare:</h4>
                <ol className="list-decimal pl-5 space-y-2 text-red-700 mb-4">
                  <li>
                    Accesați direct tab-ul de setări:{" "}
                    <a
                      href="https://console.firebase.google.com/project/brokr-42038/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold text-red-600 hover:text-red-950"
                    >
                      Setări Firebase Auth &gt; Authorized domains
                    </a>
                  </li>
                  <li>
                    Mergeți la rândul <strong>Authorized domains</strong> (Domenii autorizate) și apăsați pe butonul <strong>Add domain</strong> (Adaugă domeniu).
                  </li>
                  <li>
                    Copiați și adăugați rând pe rând următoarele domenii pentru a asigura funcționarea atât în mod de Dezvoltare (Dev), cât și când distribuiți (Shared) aplicația:
                  </li>
                </ol>
                <div className="bg-white/90 p-3 rounded-xl border border-red-200/60 space-y-2 font-mono text-xs text-red-900 mb-4 select-all">
                  <div className="flex justify-between items-center bg-gray-50/80 px-2.5 py-2 rounded-lg border border-gray-100 gap-2">
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-gray-800">{window.location.hostname}</span>
                      <span className="text-[9px] text-gray-400 font-sans mt-0.5">Domeniu curent</span>
                    </div>
                    <button
                      onClick={() => handleCopyDomain(window.location.hostname)}
                      className="p-1.5 hover:bg-gray-200/80 rounded transition-colors flex items-center justify-center shrink-0"
                      title="Copiază"
                    >
                      {copiedDomain === window.location.hostname ? (
                        <Check size={14} className="text-green-600 font-bold" />
                      ) : (
                        <Copy size={13} className="text-gray-400 hover:text-gray-755" />
                      )}
                    </button>
                  </div>
                  {window.location.hostname.includes("ais-dev") && (
                    <div className="flex justify-between items-center bg-gray-50/80 px-2.5 py-2 rounded-lg border border-gray-100 gap-2">
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-gray-800">{window.location.hostname.replace("ais-dev", "ais-pre")}</span>
                        <span className="text-[9px] text-gray-400 font-sans mt-0.5">Domeniu distributie (Shared)</span>
                      </div>
                      <button
                        onClick={() => handleCopyDomain(window.location.hostname.replace("ais-dev", "ais-pre"))}
                        className="p-1.5 hover:bg-gray-200/80 rounded transition-colors flex items-center justify-center shrink-0"
                        title="Copiază"
                      >
                        {copiedDomain === window.location.hostname.replace("ais-dev", "ais-pre") ? (
                          <Check size={14} className="text-green-600 font-bold" />
                        ) : (
                          <Copy size={13} className="text-gray-400 hover:text-gray-755" />
                        )}
                      </button>
                    </div>
                  )}
                  {window.location.hostname.includes("ais-pre") && (
                    <div className="flex justify-between items-center bg-gray-50/80 px-2.5 py-2 rounded-lg border border-gray-100 gap-2">
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-gray-800">{window.location.hostname.replace("ais-pre", "ais-dev")}</span>
                        <span className="text-[9px] text-gray-400 font-sans mt-0.5">Domeniu dev</span>
                      </div>
                      <button
                        onClick={() => handleCopyDomain(window.location.hostname.replace("ais-pre", "ais-dev"))}
                        className="p-1.5 hover:bg-gray-200/80 rounded transition-colors flex items-center justify-center shrink-0"
                        title="Copiază"
                      >
                        {copiedDomain === window.location.hostname.replace("ais-pre", "ais-dev") ? (
                          <Check size={14} className="text-green-600 font-bold" />
                        ) : (
                          <Copy size={13} className="text-gray-400 hover:text-gray-755" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-red-700 text-xs mt-2">
                  💡 <em>După adăugarea domeniilor, reveniți în această pagină și reîncercați „Login cu Google”. Totul va rula impecabil direct pe noul dvs. proiect <strong>brokr</strong>!</em>
                </p>
              </>
            ) : (
              <>
                <h3 className="font-bold text-red-900 mb-1">Eroare la autentificare</h3>
                <p className="text-red-700">{loginError}</p>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  const updateDescriptionId = (text: string, newId: string): string => {
    if (!text) return "";
    const lines = text.split("\n");
    const updatedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith("📌 ID Proprietate:")) {
        return `📌 ID Proprietate: ${newId}`;
      }
      if (trimmed.startsWith("📌 ID")) {
        return `📌 ID ${newId}`;
      }
      return line;
    });
    return updatedLines.join("\n");
  };

  const handleSaveDetails = async () => {
    if (!selectedLead?.id) return;
    try {
      let updatedExtractedData = undefined;
      if (selectedLead.extractedData) {
        updatedExtractedData = { ...selectedLead.extractedData };
        if (updatedExtractedData.crmData?.descriere) {
          updatedExtractedData.crmData.descriere = {
            ...updatedExtractedData.crmData.descriere,
            continut: updateDescriptionId(updatedExtractedData.crmData.descriere.continut || "", editedPropertyId)
          };
        }
        if (updatedExtractedData.markdownMarketing) {
          updatedExtractedData.markdownMarketing = updateDescriptionId(updatedExtractedData.markdownMarketing, editedPropertyId);
        }
      }

      const updatePayload: any = {
        ownerName: editedName,
        ownerPhone: editedPhone,
        propertyId: editedPropertyId,
        title: editedTitle,
        zone: editedZone,
        price: editedPrice,
        transactionType: editedTransactionType,
        categoria: editedCategoria,
      };

      if (updatedExtractedData) {
        updatePayload.extractedData = updatedExtractedData;
      }

      await leadsService.updateLeadData(selectedLead.id, updatePayload);

      setSelectedLead(prev => {
        if (!prev) return null;
        return { 
          ...prev, 
          ownerName: editedName, 
          ownerPhone: editedPhone,
          propertyId: editedPropertyId,
          title: editedTitle,
          zone: editedZone,
          price: editedPrice,
          transactionType: editedTransactionType,
          categoria: editedCategoria,
          ...(updatedExtractedData ? { extractedData: updatedExtractedData } : {})
        };
      });

      setLeads(prev => prev.map(l => {
        if (l.id === selectedLead.id) {
          return {
            ...l,
            ownerName: editedName, 
            ownerPhone: editedPhone,
            propertyId: editedPropertyId,
            title: editedTitle,
            zone: editedZone,
            price: editedPrice,
            transactionType: editedTransactionType,
            categoria: editedCategoria,
            ...(updatedExtractedData ? { extractedData: updatedExtractedData } : {})
          };
        }
        return l;
      }));

      setIsEditingDetails(false);
    } catch (error) {
      console.error("Failed to save lead details:", error);
    }
  };

  const handleCloseDetails = async () => {
    await handleSaveDetails();
    setShowDeleteConfirm(false);
    setSelectedLead(null);
  };

  const updateStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      // Set optimistic guard
      lastOptimisticUpdate.current = { id: leadId, time: Date.now() };

      // Update local state first for immediate feedback
      setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      await leadsService.updateLeadData(leadId, {
        ownerName: editedName,
        ownerPhone: editedPhone,
        propertyId: editedPropertyId,
        title: editedTitle,
        zone: editedZone,
        price: editedPrice,
        transactionType: editedTransactionType,
        status: newStatus,
        lastMovedAt: new Date()
      });
      
      if (newStatus === "Activa" || newStatus === "Calificata") {
        const lead = leads.find(l => l.id === leadId) || selectedLead;
        if (lead && lead.id && (!lead.extractedData || !lead.extractedData.summary)) {
          triggerExtraction(lead as Lead);
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDeleteLead = async () => {
    if (!selectedLead?.id) return;
    try {
      await leadsService.deleteLead(selectedLead.id);
      setSelectedLead(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Failed to delete lead:", error);
      alert("Eroare la ștergere. Verifică permisiunile.");
    }
  };

  const handleSaveNevalidatLead = async (leadId: string, updatedData: Partial<Lead>) => {
    try {
      await leadsService.updateLeadData(leadId, updatedData);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updatedData } : l));
    } catch (e) {
      console.error("Failed to save nevalidat lead:", e);
      throw e;
    }
  };

  const handleMoveToCalificata = async (leadId: string, updatedData: Partial<Lead>) => {
    try {
      const finalPayload = {
        ...updatedData,
        status: "Calificata" as LeadStatus,
        lastMovedAt: new Date()
      };
      await leadsService.updateLeadData(leadId, finalPayload);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...finalPayload } : l));

      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        const mergedLead = { ...lead, ...finalPayload };
        if (!mergedLead.extractedData || !mergedLead.extractedData.summary) {
          triggerExtraction(mergedLead);
        }
      }
    } catch (e) {
      console.error("Failed to move lead to calificata:", e);
      throw e;
    }
  };

  const handleDeleteNevalidatLead = async (leadId: string) => {
    try {
      await leadsService.deleteLead(leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (e) {
      console.error("Failed to delete lead:", e);
      throw e;
    }
  };

  const handleActivateCalificatLead = async (leadId: string) => {
    try {
      await leadsService.updateLeadStatus(leadId, 'Activa');
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'Activa' } : l));
      
      const lead = leads.find(l => l.id === leadId);
      if (lead && (!lead.extractedData || !lead.extractedData.summary)) {
        triggerExtraction(lead);
      }
    } catch (e) {
      console.error("Failed to activate lead:", e);
      throw e;
    }
  };

  const handleDeleteCalificatLead = async (leadId: string) => {
    try {
      await leadsService.deleteLead(leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (e) {
      console.error("Failed to delete lead:", e);
      throw e;
    }
  };

  const handleOpenFullFormFromCalificat = () => {
    if (selectedCalificatLead) {
      const lead = selectedCalificatLead;
      setSelectedCalificatLead(null);
      setTimeout(() => {
        setSelectedLead(lead);
        setShowDeleteConfirm(false);
        setEditedName(lead.ownerName || "");
        setEditedPhone(lead.ownerPhone || "");
        setEditedPropertyId(lead.propertyId || "");
        setEditedTitle(lead.title || "");
        setEditedZone(lead.zone || "");
        setEditedPrice(lead.price || "");
        setEditedTransactionType(lead.transactionType || "Vânzare");
        setEditedCategoria(lead.categoria || "");
        setIsEditingDetails(false);
      }, 100);
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden relative">
      <AnimatePresence mode="popLayout" initial={false}>
        {!selectedLead ? (
          <motion.div
            key="list-view"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 flex flex-col bg-gray-50"
          >
            <Header 
              onAddClick={() => setIsModalOpen(true)} 
              onAddContactClick={() => setIsContactModalOpen(true)}
              onNotificationsClick={() => setIsNotificationsOpen(true)} 
              onExtractionRulesClick={() => setIsExtractionRulesOpen(true)}
            />

            {/* Tabs & Filters */}
            <div className="bg-white border-b border-gray-200 shrink-0 h-[64px] overflow-hidden">
              <div className="px-5 w-full h-full">
                <div className="flex items-center justify-between overflow-x-auto no-scrollbar overflow-y-hidden h-full">
                  <div className="flex gap-8 h-full">
                    {TABS.slice(0, 6).map(tab => {
                      const tabCount = leads.filter(l => l.status === tab).length;
                      const hasNew = leads.some(lead => {
                        if (lead.status !== tab) return false;
                        const itemTime = getTimestampMs(lead.lastMovedAt) || getTimestampMs(lead.updatedAt) || getTimestampMs(lead.createdAt);
                        return tab !== activeTab && itemTime > (lastVisitedTimes[tab] || 0);
                      });
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`relative px-2 h-full flex items-center text-[16px] font-bold transition-all whitespace-nowrap ${
                            activeTab === tab 
                            ? "text-gray-900" 
                            : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {STATUS_LABELS[tab]}
                            <span className="text-[13px] font-medium opacity-80">({tabCount})</span>
                            {hasNew && (
                              <span className="w-2 h-2 rounded-full bg-[rgb(224,72,57)] animate-pulse" />
                            )}
                          </span>
                          {activeTab === tab && (
                            <motion.div 
                              layoutId="activeTab"
                              className="absolute bottom-0 left-0 right-0 h-[6px] bg-[rgb(224,72,57)] rounded-t-full"
                              initial={false}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-8 ml-8 h-full">
                    {TABS.slice(6).map(tab => {
                      const tabCount = leads.filter(l => l.status === tab).length;
                      const hasNew = leads.some(lead => {
                        if (lead.status !== tab) return false;
                        const itemTime = getTimestampMs(lead.lastMovedAt) || getTimestampMs(lead.updatedAt) || getTimestampMs(lead.createdAt);
                        return tab !== activeTab && itemTime > (lastVisitedTimes[tab] || 0);
                      });
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`relative px-2 h-full flex items-center text-[16px] font-bold transition-all whitespace-nowrap ${
                            activeTab === tab 
                            ? "text-gray-900" 
                            : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {STATUS_LABELS[tab]}
                            <span className="text-[13px] font-medium opacity-80">({tabCount})</span>
                            {hasNew && (
                              <span className="w-2 h-2 rounded-full bg-[rgb(224,72,57)] animate-pulse" />
                            )}
                          </span>
                          {activeTab === tab && (
                            <motion.div 
                              layoutId="activeTab"
                              className="absolute bottom-0 left-0 right-0 h-[6px] bg-[rgb(224,72,57)] rounded-t-full"
                              initial={false}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Sub-header */}
            <div className="bg-gray-50 border-b border-gray-200 shrink-0 h-[72px] flex items-center">
              <div className="px-5 py-2 flex-1 flex items-center justify-between relative">
                {/* Left Side: Transaction */}
                <div className="flex items-center gap-4">
                  {/* Transaction Filter Radio Buttons */}
                  <div className="flex items-center gap-6">
                    {(['Toate', 'Vânzare', 'Închiriere'] as TransactionFilter[]).map((type) => (
                      <label
                        key={type}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <div className="relative flex items-center justify-center">
                          <input
                            type="radio"
                            name="transactionType"
                            checked={transactionFilter === type}
                            onChange={() => setTransactionFilter(type)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                            transactionFilter === type
                            ? "border-[rgb(224,72,57)]"
                            : "border-gray-300 group-hover:border-gray-400"
                          }`} />
                          {transactionFilter === type && (
                            <div className="absolute w-2.5 h-2.5 rounded-full bg-[rgb(224,72,57)]" />
                          )}
                        </div>
                        <span className={`text-[14px] font-bold transition-colors ${
                          transactionFilter === type
                          ? "text-gray-900"
                          : "text-gray-400 group-hover:text-gray-600"
                        }`}>
                          {type}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Middle: Count */}
                <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest absolute left-1/2 -translate-x-1/2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-1" />
                  <span>{Object.values(groupedLeads).flat().length} proprietăți găsite</span>
                </div>

                {/* Right Side: Category & Sort */}
                <div className="flex items-center gap-3">
                  {/* Category Filter */}
                  <div className="relative w-56">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full h-[48px] bg-white border border-[--color-border] rounded-[8px] px-5 pr-12 text-[15px] font-bold text-[--color-text-main] appearance-none focus:outline-none focus:border-[--color-border-hover] focus:bg-[--color-bg-focus] transition-all shadow-none cursor-pointer hover:border-[--color-border-hover] hover:bg-[--color-bg-focus]"
                    >
                      <option value="Toate">Toate</option>
                      {CATEGORIA_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[--color-text-placeholder]">
                      <ChevronDown size={18} />
                    </div>
                  </div>

                  <div className="relative w-56">
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as SortOption)}
                      className="w-full h-[48px] bg-white border border-[--color-border] rounded-[8px] px-5 pr-12 text-[15px] font-bold text-[--color-text-main] appearance-none focus:outline-none focus:border-[--color-border-hover] focus:bg-[--color-bg-focus] transition-all shadow-none cursor-pointer hover:border-[--color-border-hover] hover:bg-[--color-bg-focus]"
                    >
                      <option value="newest">Cele mai noi</option>
                      <option value="oldest">Cele mai vechi</option>
                      <option value="expensive">Cele mai scumpe</option>
                      <option value="cheap">Cele mai ieftine</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[--color-text-placeholder]">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
              {activeTab === "Nevalidata" ? (
                <NevalidataUrlList 
                  groupedLeads={groupedLeads}
                  onItemClick={handleLeadClick}
                />
              ) : (
                <LeadList 
                  groupedLeads={groupedLeads} 
                  contacts={contacts}
                  onLeadClick={handleLeadClick} 
                  onContactClick={(contact) => setSelectedContact(contact)}
                  onQuickViewClick={(lead) => {
                    setSelectedQuickViewLead(lead);
                    setIsQuickViewOpen(true);
                  }}
                />
              )}
            </div>
          </motion.div>
        ) : selectedContact ? (
          <motion.div
            key="contact-detail"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 bg-gray-50 z-[300] overflow-y-auto flex flex-col"
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 min-h-[68px] flex items-center gap-3 z-10 shadow-sm">
              <button 
                onClick={() => setSelectedContact(null)}
                className="w-10 h-10 flex items-center justify-center bg-white rounded-full cursor-pointer hover:bg-gray-50 transition-colors shrink-0 border border-gray-100 shadow-sm"
              >
                <ChevronLeft size={20} strokeWidth={2.5} className="text-gray-400 hover:text-gray-900" />
              </button>

              <div className="flex-1 min-w-0">
                <h2 className="text-[16px] font-bold text-[--color-text-main] truncate tracking-tight">{selectedContact.firstName} {selectedContact.lastName}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[--color-accent] uppercase tracking-[0.15em]">{selectedContact.type}</span>
                  <div className="w-1 h-1 bg-gray-200 rounded-full" />
                  <span className="text-[11px] text-[--color-text-secondary] font-bold uppercase tracking-wider">{selectedContact.phone}</span>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-6 flex-1">
              <div className="bg-white rounded-[16px] border border-gray-100 p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[12px] font-bold text-[--color-text-placeholder] uppercase tracking-wider">Prenume</span>
                    <span className="text-[15px] text-[--color-text-main] font-medium px-4 py-3 bg-gray-50 rounded-[16px]">{selectedContact.firstName}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[12px] font-bold text-[--color-text-placeholder] uppercase tracking-wider">Nume</span>
                    <span className="text-[15px] text-[--color-text-main] font-medium px-4 py-3 bg-gray-50 rounded-[16px]">{selectedContact.lastName}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[12px] font-bold text-[--color-text-placeholder] uppercase tracking-wider">Telefon</span>
                    <span className="text-[15px] text-[--color-text-main] font-medium px-4 py-3 bg-gray-50 rounded-[16px]">{selectedContact.phone}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[12px] font-bold text-[--color-text-placeholder] uppercase tracking-wider">Tip Contact</span>
                    <span className="text-[15px] text-[--color-text-main] font-medium px-4 py-3 bg-gray-50 rounded-[16px]">{selectedContact.type}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[12px] font-bold text-[--color-text-placeholder] uppercase tracking-wider">ID Proprietate Asociată</span>
                  <span className="text-[15px] text-[--color-text-main] font-medium px-4 py-3 bg-gray-50 rounded-[16px]">{selectedContact.propertyId}</span>
                </div>
              </div>

              {/* Find associated lead if possible */}
              {leads.find(l => l.id === selectedContact.propertyId) && (
                <div className="mt-6">
                   <h3 className="text-[13px] font-bold text-[--color-text-placeholder] uppercase tracking-wider mb-4">Proprietate Asociată</h3>
                   <LeadCard 
                    lead={leads.find(l => l.id === selectedContact.propertyId)!} 
                    contacts={contacts.filter(c => c.propertyId === selectedContact.propertyId)}
                    onClick={() => {
                      const lead = leads.find(l => l.id === selectedContact.propertyId)!;
                      handleLeadClick(lead);
                      setSelectedContact(null);
                    }} 
                   />
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail-view"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 bg-gray-50 z-[200] overflow-y-auto flex flex-col"
            onScroll={handleDetailsScroll}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 h-[96px] min-h-[96px] max-h-[96px] shrink-0 box-border flex items-center px-5 gap-3 z-10 shadow-sm">
              <button 
                onClick={handleCloseDetails}
                className="w-10 h-10 flex items-center justify-center bg-white rounded-full cursor-pointer hover:bg-gray-50 transition-colors shrink-0 border border-gray-100 shadow-sm"
              >
                <ChevronLeft size={20} strokeWidth={2.5} className="text-gray-400 hover:text-gray-900" />
              </button>
 
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-[16px] font-bold text-[--color-text-main] truncate tracking-tight leading-none mb-1">{selectedLead.title}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[--color-accent] uppercase tracking-[0.15em] leading-none">{selectedLead.price}</span>
                  <div className="w-1 h-1 bg-gray-200 rounded-full" />
                  <span className="text-[11px] text-[--color-text-secondary] font-bold uppercase tracking-wider leading-none">{selectedLead.ownerName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={async () => {
                    if (selectedLead.status === 'Sterse') {
                      setShowDeleteConfirm(true);
                      document.getElementById('delete-section')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      await updateStatus(selectedLead.id!, 'Sterse');
                      toast.success('Proprietate mutată în Șterse');
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors shrink-0 shadow-sm"
                  title={selectedLead.status === 'Sterse' ? "Ștergere Definitivă" : "Mută în Șterse"}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            {/* Sticky Mobile Section Navigator */}
            <div className="sticky top-[96px] lg:hidden z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth items-center">
              {activeSectionsList.map((sect) => {
                const status = getCompletionState(sect.id);
                const isSelected = activeSection === sect.id;
                return (
                  <button
                    key={sect.id}
                    onClick={() => scrollToSection(sect.id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
                      isSelected
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-500 border-gray-100 hover:text-gray-900 hover:border-gray-200"
                    }`}
                  >
                    <span>{sect.label}</span>
                    {status === "complete" && (
                      <span className="w-4 h-4 rounded-full bg-green-550 bg-green-500 text-white text-[9px] flex items-center justify-center font-black">✓</span>
                    )}
                    {status === "partial" && (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-black">!</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-5 flex-1 w-full max-w-none px-4 lg:px-12 mx-0">
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6 items-start h-full pb-10">
                
                {/* Column 1: Left Persistent Sidebar */}
                <div className="col-span-1 space-y-5 lg:sticky lg:top-[120px] lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto no-scrollbar order-3 lg:order-1">
                  
                  {/* ID Info Section */}
                  <div id="identificare" className="bg-white p-5 rounded-[16px] border border-gray-100 shadow-sm space-y-5 scroll-mt-24">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[16px] bg-[--color-accent]/10 flex items-center justify-center">
                        <Hash size={20} className="text-[--color-accent]" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-gray-900 leading-none">Identificare</h3>
                        <p className="text-[11px] text-gray-500 font-medium tracking-tight mt-1">Status și Cod Proprietate</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-[--color-text-placeholder] uppercase tracking-wider">ID Proprietate</span>
                        <FormInput 
                          value={editedPropertyId}
                          onChange={setEditedPropertyId}
                          onBlur={handleSaveDetails}
                          placeholder="Cod proprietate..."
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-[--color-text-placeholder] uppercase tracking-wider">Status Proprietate</span>
                        <div className="relative">
                          <select 
                            value={selectedLead.status}
                            onChange={(e) => updateStatus(selectedLead.id!, e.target.value as LeadStatus)}
                            className="input-base w-full appearance-none pr-12 cursor-pointer"
                          >
                            {TABS.map(status => (
                              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                            ))}
                          </select>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[--color-text-placeholder]">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contacte Alocate Section */}
                  <div id="contactealocate" className="bg-white p-5 rounded-[16px] border border-gray-100 flex flex-col min-h-[356px] shadow-sm scroll-mt-24">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[--color-accent]/10 flex items-center justify-center">
                          <Users size={20} className="text-[--color-accent]" />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-bold text-gray-900 leading-none">Contacte Alocate</h3>
                          <p className="text-[11px] text-gray-500 font-medium tracking-tight mt-1">Proprietari și Clienți</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsContactModalOpen(true)}
                        className="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors text-gray-600"
                        title="Adaugă Contact"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {contacts.filter(c => c.propertyId === selectedLead.id).length > 0 ? (
                      <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                        {contacts
                          .filter(c => c.propertyId === selectedLead.id)
                          .sort((a, b) => {
                            const timeA = b.createdAt?.toMillis?.() || 0;
                            const timeB = a.createdAt?.toMillis?.() || 0;
                            return timeA - timeB;
                          })
                          .map((contact, idx) => (
                          <motion.div
                            key={contact.id || `${contact.firstName}-${contact.lastName}-${contact.phone}-${idx}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white hover:shadow-md p-3 rounded-[12px] transition-all border border-gray-100 hover:border-[--color-accent] group"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h4 className="text-[13px] font-bold text-gray-900 leading-tight truncate">
                                  {contact.firstName} {contact.lastName}
                                </h4>
                                <div className="mt-1">
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                    contact.type === "Owner" 
                                    ? "bg-blue-50 text-blue-600" 
                                    : contact.type === "Buyer" 
                                    ? "bg-green-50 text-green-600" 
                                    : "bg-purple-50 text-purple-600"
                                  }`}>
                                    {contact.type}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <a 
                                  href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-all"
                                  title="WhatsApp Message"
                                >
                                  <MessageSquare size={14} />
                                </a>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadVCard(contact, selectedLead?.propertyId);
                                  }}
                                  className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-all"
                                  title="Save Contact (vCard)"
                                >
                                  <Download size={14} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-6">
                        <Users size={36} className="text-gray-300 mb-2" />
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Niciun contact</p>
                      </div>
                    )}
                  </div>

                  {/* Vizionări Section */}
                  <div id="vizionaridb" className="bg-white p-5 rounded-[16px] border border-gray-100 flex flex-col min-h-[356px] shadow-sm scroll-mt-24 animate-fade-in">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[--color-accent]/10 flex items-center justify-center">
                          <Calendar size={20} className="text-[--color-accent]" />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-bold text-gray-900 leading-none">Vizionări</h3>
                          <p className="text-[11px] text-gray-500 font-medium tracking-tight mt-1">Calendar Întâlniri</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsViewingModalOpen(true)}
                        className="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors text-gray-600"
                        title="Programează Vizionare"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {viewings.length > 0 ? (
                      <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                        {viewings.map((viewing, idx) => (
                          <motion.div
                            key={viewing.id || `${viewing.date}-${viewing.hour}-${viewing.contactName}-${idx}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => {
                              setSelectedViewing(viewing);
                              setIsViewingDetailsOpen(true);
                            }}
                            className="bg-white hover:shadow-md p-3 rounded-[12px] transition-all border border-gray-100 hover:border-[--color-accent] group cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-10 h-10 rounded-[10px] bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-[9px] font-black shrink-0 group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
                                  <span className="text-[--color-accent] leading-none mb-0.5">{viewing.date.split('-')[2]}</span>
                                  <span className="text-gray-400 uppercase tracking-tighter leading-none">{new Date(viewing.date).toLocaleDateString('ro-RO', { month: 'short' })}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-[13px] font-bold text-gray-900 leading-tight truncate">{viewing.contactName}</h4>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <Clock size={10} className="text-gray-400" />
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{viewing.hour}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                {contacts.find(c => c.firstName + " " + c.lastName === viewing.contactName)?.phone && (
                                  <a 
                                    href={`https://wa.me/${contacts.find(c => c.firstName + " " + c.lastName === viewing.contactName)?.phone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-all text-xs"
                                    title="WhatsApp Business"
                                  >
                                    <MessageSquare size={12} />
                                  </a>
                                )}
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await viewingsService.deleteViewing(viewing.id!);
                                      toast.success('Vizionare ștearsă');
                                    } catch (error) {
                                      toast.error('Eroare la ștergere');
                                    }
                                  }}
                                  className="w-6 h-6 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 hover:text-red-500 hover:border-red-100 transition-all opacity-0 group-hover:opacity-100 text-xs"
                                  title="Șterge"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-6">
                        <Calendar size={36} className="text-gray-300 mb-2" />
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Nicio vizionare</p>
                      </div>
                    )}
                  </div>

                  {/* Delete Action Section - Only shown when status is 'Sterse' */}
                  {selectedLead.status === 'Sterse' && (
                    <div id="delete-section" className="pt-4 scroll-mt-24">
                      <div className="bg-red-50 p-5 rounded-[16px] border border-red-100 flex flex-col items-center text-center shadow-sm">
                        <div className="w-12 h-12 bg-white rounded-[16px] flex items-center justify-center text-red-500 mb-4 border border-red-50 shadow-sm">
                          <Trash2 size={24} />
                        </div>
                        <h3 className="text-md font-bold text-red-900 mb-2">Ștergere Definitivă</h3>
                        <p className="text-[11px] text-red-600 mb-6 max-w-xs leading-relaxed font-medium">
                          Această acțiune este ireversibilă. Toate datele vor fi șterse definitiv din baza de date.
                        </p>
                        
                        {!showDeleteConfirm ? (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-[16px] font-bold transition-all flex items-center justify-center gap-2 text-[13px] shadow-sm active:scale-95"
                          >
                            <Trash2 size={16} />
                            Șterge Proprietate Definitiv
                          </button>
                        ) : (
                          <div className="flex flex-col gap-3 w-full">
                            <p className="text-[10px] font-extrabold text-red-700 uppercase tracking-widest mb-1">Confirmați ștergerea?</p>
                            <div className="flex gap-2 w-full">
                              <button
                                onClick={handleDeleteLead}
                                className="flex-1 h-11 bg-red-600 text-white rounded-[16px] font-bold text-xs hover:bg-red-700 transition-colors shadow-sm"
                              >
                                Da, Șterge
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 h-11 bg-white border border-gray-200 text-gray-500 rounded-[16px] font-bold text-xs hover:bg-gray-50 transition-colors shadow-sm"
                              >
                                Nu
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* Column 2: Main Content Area */}
                <div className="col-span-1 min-w-0 space-y-6 order-1 lg:order-2">
                  
                  {/* Basic Info Card */}
                  <div id="basicale" className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden scroll-mt-24">
                    <div className="h-14 flex items-center px-6 bg-gray-50/50 border-b border-gray-100">
                      <span className="text-[14px] font-bold text-[--color-text-main] uppercase tracking-wider">Informații de Bază</span>
                    </div>
                    <div className="p-6">
                      <BasicInfoSection 
                        editedTitle={editedTitle} setEditedTitle={setEditedTitle}
                        editedName={editedName} setEditedName={setEditedName}
                        editedPhone={editedPhone} setEditedPhone={setEditedPhone}
                        editedZone={editedZone} setEditedZone={setEditedZone}
                        editedPrice={editedPrice} setEditedPrice={setEditedPrice}
                        editedTransactionType={editedTransactionType} setEditedTransactionType={setEditedTransactionType}
                        editedCategoria={editedCategoria} setEditedCategoria={setEditedCategoria}
                        url={selectedLead.url}
                        coverImage={selectedLead.coverImage}
                        handleSaveDetails={handleSaveDetails}
                        extractedData={selectedLead.extractedData}
                      />
                    </div>
                  </div>

                  {/* Extraction Section or Viewer */}
                  {isExtracting ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[16px] border border-gray-100 shadow-sm">
                      <Loader2 className="animate-spin text-[#f44336] mb-4" />
                      <p className="text-[14px] font-bold tracking-[0.3em] text-gray-300 uppercase">{extractionStatus}</p>
                    </div>
                  ) : selectedLead.extractedData ? (
                    <ExtractionViewer 
                      data={selectedLead.extractedData} 
                      leadId={selectedLead.id!} 
                      propertyId={editedPropertyId}
                      onUpdate={handleUpdate}
                      basicInfoProps={{
                        editedTitle, setEditedTitle,
                        editedName, setEditedName,
                        editedPhone, setEditedPhone,
                        editedZone, setEditedZone,
                        editedPrice, setEditedPrice,
                        editedTransactionType, setEditedTransactionType,
                        editedCategoria, setEditedCategoria,
                        url: selectedLead.url,
                        coverImage: selectedLead.coverImage,
                        handleSaveDetails,
                        extractedData: selectedLead.extractedData
                      }} 
                      status={selectedLead.status}
                    />
                  ) : (
                    selectedLead.status === "Activa" && (
                      <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[16px] border border-gray-100">
                        <Database className="text-gray-100 mb-4" size={60} />
                        <p className="text-[14px] font-bold text-gray-300 uppercase tracking-widest mb-6">Așteptare extracție sau eroare</p>
                        <button 
                          onClick={() => triggerExtraction(selectedLead)}
                          className="bg-[#000000] text-white hover:bg-[#333333] transition-colors rounded-full px-8 h-12 font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                        >
                           <Zap size={16} fill="currentColor" className="text-[--color-accent]" />
                           Extrage Date AI
                        </button>
                      </div>
                    )
                  )}

                </div>

                {/* Column 3: Right Sticky Navigator (Desktop only) */}
                <div className="hidden lg:block lg:sticky lg:top-[120px] lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto no-scrollbar order-2 lg:order-3">
                  <div className="bg-white p-5 rounded-[16px] border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Navigare Secțiuni</h3>
                    <div className="space-y-1.5 relative">
                      <div className="absolute left-[13px] top-3 bottom-3 w-0.5 bg-gray-100" />
                      
                      {activeSectionsList
                        .filter((sect) => !["identificare", "contactealocate", "vizionaridb"].includes(sect.id))
                        .map((sect) => {
                          const status = getCompletionState(sect.id);
                          const isSelected = activeSection === sect.id;
                          
                          return (
                            <button
                              key={sect.id}
                              onClick={() => scrollToSection(sect.id)}
                              className={`w-full flex items-center justify-between text-left h-[48px] pl-7 pr-3 rounded-lg text-[16px] font-normal transition-all group relative ${
                                isSelected 
                                  ? "text-gray-900 bg-gray-100/80" 
                                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50/40"
                              }`}
                            >
                              <div className={`absolute left-[14px] top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border transition-all ${
                                isSelected 
                                  ? "bg-[--color-accent] border-[--color-accent] scale-125" 
                                  : "bg-white border-gray-200 group-hover:border-gray-400"
                              }`} />

                              <span className="truncate">{sect.label}</span>
                              
                              <span className="flex items-center shrink-0 ml-2">
                                {status === "complete" && (
                                  <span className="w-4 h-4 rounded-full bg-green-50 text-green-600 font-bold text-[10px] flex items-center justify-center border border-green-100" title="Complet">✓</span>
                                )}
                                {status === "partial" && (
                                  <span className="w-4 h-4 rounded-full bg-amber-50 text-amber-600 font-bold text-[10px] flex items-center justify-center border border-amber-100" title="Parțial completat">!</span>
                                )}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Share Link Card (under page navigation) */}
                  <div className="mt-4 bg-white p-5 rounded-[16px] border border-gray-100 shadow-sm space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 text-[--color-accent] flex items-center justify-center shrink-0">
                        <Share2 size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider">Distribuie Link</h4>
                        <p className="text-[10px] text-gray-400 font-medium truncate">Accesibil oricui pe internet</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl p-1.5 pl-3">
                      <span className="text-[11px] text-gray-500 font-mono truncate flex-1 select-all" title={getPublicShareUrl(selectedLead.id!)}>
                        {getPublicShareUrl(selectedLead.id!)}
                      </span>
                      <button
                        onClick={() => handleCopyShareLink(selectedLead.id!)}
                        className={`h-8 px-3 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm ${
                          copiedShareId === selectedLead.id
                            ? "bg-green-600 text-white"
                            : "bg-gray-900 text-white hover:bg-gray-800"
                        }`}
                        title="Copiază link-ul"
                      >
                        {copiedShareId === selectedLead.id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedShareId === selectedLead.id ? "Copiat" : "Copiază"}</span>
                      </button>
                    </div>

                    <a
                      href={getPublicShareUrl(selectedLead.id!)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold text-gray-600 hover:text-gray-900 transition-colors border border-gray-100 rounded-xl hover:bg-gray-50"
                    >
                      <ExternalLink size={12} />
                      <span>Deschide link-ul</span>
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <NotificationsModal 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
        notifications={notifications}
      />

      <AddLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <ExtractionRulesModal isOpen={isExtractionRulesOpen} onClose={() => setIsExtractionRulesOpen(false)} />
      <AddContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
        defaultPropertyId={selectedLead?.id} 
      />
      <AddViewingModal 
        isOpen={isViewingModalOpen} 
        onClose={() => setIsViewingModalOpen(false)} 
        propertyId={selectedLead?.id || ""} 
        contacts={contacts.filter(c => c.propertyId === selectedLead?.id)}
      />
      <ViewingDetailsModal 
        isOpen={isViewingDetailsOpen}
        onClose={() => setIsViewingDetailsOpen(false)}
        viewing={selectedViewing}
      />
      <PropertyQuickViewModal 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
        lead={selectedQuickViewLead}
        contacts={contacts.filter(c => c.propertyId === selectedQuickViewLead?.id)}
        onContactClick={(contact) => setSelectedContact(contact)}
        onAddContactClick={() => {
          setIsQuickViewOpen(false);
          setIsContactModalOpen(true);
        }}
      />

      <NevalidataDetailsModal
        isOpen={!!selectedNevalidatLead}
        lead={selectedNevalidatLead}
        onClose={() => setSelectedNevalidatLead(null)}
        onSaveLead={handleSaveNevalidatLead}
        onMoveToCalificata={handleMoveToCalificata}
        onDeleteLead={handleDeleteNevalidatLead}
      />

      <CalificataDetailsModal
        isOpen={!!selectedCalificatLead}
        lead={selectedCalificatLead}
        onClose={() => setSelectedCalificatLead(null)}
        onActivate={handleActivateCalificatLead}
        onDeleteLead={handleDeleteCalificatLead}
        onOpenFullForm={handleOpenFullFormFromCalificat}
      />
    </div>
  );
};

const BasicInfoSection = ({ 
  editedTitle, setEditedTitle, 
  editedName, setEditedName, 
  editedPhone, setEditedPhone, 
  editedZone, setEditedZone, 
  editedPrice, setEditedPrice, 
  editedTransactionType, setEditedTransactionType,
  editedCategoria, setEditedCategoria,
  url, coverImage, handleSaveDetails, extractedData
}: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    {/* Column 1: Info Fields */}
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-bold text-[--color-text-placeholder] tracking-wider">Titlu Proprietate</span>
        <FormInput 
          value={editedTitle}
          onChange={setEditedTitle}
          onBlur={handleSaveDetails}
          placeholder="Introduceți titlul..."
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-bold text-[--color-text-placeholder] tracking-wider">Nume Contact</span>
          <FormInput 
            value={editedName}
            onChange={setEditedName}
            onBlur={handleSaveDetails}
            placeholder="Nume..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-bold text-[--color-text-placeholder] tracking-wider">Telefon</span>
          <FormInput 
            value={editedPhone}
            onChange={setEditedPhone}
            onBlur={handleSaveDetails}
            placeholder="Telefon..."
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-bold text-[--color-text-placeholder] tracking-wider">Zonă</span>
          <FormInput 
            value={editedZone}
            onChange={setEditedZone}
            onBlur={handleSaveDetails}
            placeholder="Zonă..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-bold text-[--color-text-placeholder] tracking-wider">Preț</span>
          <FormInput 
            value={editedPrice}
            onChange={setEditedPrice}
            onBlur={handleSaveDetails}
            placeholder="Preț..."
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-bold text-[--color-text-placeholder] tracking-wider">Tranzacție</span>
          <FormSelect 
            value={editedTransactionType}
            onChange={setEditedTransactionType}
            onBlur={handleSaveDetails}
            options={TRANZACTIE_OPTIONS}
            showEmpty={false}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-bold text-[--color-text-placeholder] tracking-wider">Categorie</span>
          <FormSelect 
            value={editedCategoria}
            onChange={setEditedCategoria}
            onBlur={handleSaveDetails}
            options={CATEGORIA_OPTIONS}
            showEmpty={false}
          />
        </div>
      </div>
      <InfoRow label="URL Sursă" value={url} isLink />
    </div>

    {/* Column 2: Property Image */}
    <div>
      <div className="flex flex-col gap-1 h-full">
        <span className="text-[12px] font-bold text-[--color-text-placeholder] tracking-wider mb-2">Imagine Principală</span>
        <div className="relative aspect-square md:aspect-auto md:flex-1 w-full bg-gray-50 rounded-[16px] overflow-hidden border border-gray-100 group/img">
          {(() => {
            const images = extractedData?.crmData?.imagini;
            const categoriaLower = editedCategoria.toLowerCase();
            const isResidential = !categoriaLower.includes('comercial') && 
                                   !categoriaLower.includes('spatiu') && 
                                   !categoriaLower.includes('depozit') && 
                                   !categoriaLower.includes('hala') && 
                                   !categoriaLower.includes('industrial') && 
                                   !categoriaLower.includes('birou');

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
              : (typeof rawFirstImage === 'string' ? rawFirstImage : (coverImage || null));

            return displayImage ? (
              <img 
                src={displayImage} 
                alt="Property"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-200">
                <Database size={40} className="mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Nicio imagine</span>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  </div>
);

const InfoRow = ({ label, value, isLink }: { label: string, value: string, isLink?: boolean }) => (
  <div className="flex flex-col gap-1 py-4 border-b border-gray-50 last:border-0">
    <span className="text-[12px] font-bold text-[--color-text-placeholder] uppercase tracking-wider">{label}</span>
    {isLink ? (
      <a href={value} target="_blank" rel="noreferrer" className="text-[15px] text-[--color-accent] font-medium truncate hover:opacity-80">
        Deschide URL
      </a>
    ) : (
      <span className="text-[15px] text-[--color-text-main] font-medium">{value}</span>
    )}
  </div>
);

const SectionCard = ({ id, title, children }: { id: string, title: string, children: React.ReactNode }) => (
  <div 
    id={id} 
    className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden scroll-mt-24"
  >
    <div className="h-14 flex items-center px-6 bg-gray-50/50 border-b border-gray-100">
      <span className="text-[14px] font-bold text-[--color-text-main] uppercase tracking-wider">{title}</span>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const ExtractionViewer = ({ data, leadId, propertyId, onUpdate, basicInfoProps, status }: { data: any, leadId: string, propertyId?: string, onUpdate: (id: string, path: string, val: any) => void, basicInfoProps: any, status?: LeadStatus }) => {
  const wrapUpdate = (path: string, val: any) => {
    onUpdate(leadId, path, val);
  };

  return (
    <div className="space-y-6">
      <SectionCard id="detaliigenerale" title="Detalii Generale">
        <DetaliiGeneraleSection 
          data={data?.crmData?.detaliiGenerale} 
          onUpdate={wrapUpdate} 
          categoria={data?.crmData?.detaliiGenerale?.categoria}
        />
      </SectionCard>
      <SectionCard id="caracteristici" title="Caracteristici">
        <CaracteristiciSection 
          data={data?.crmData?.caracteristici} 
          onUpdate={wrapUpdate} 
          categoria={data?.crmData?.detaliiGenerale?.categoria}
        />
      </SectionCard>
      <SectionCard id="utilitati" title="Utilități">
        <UtilitatiSection 
          data={data?.crmData?.utilitati} 
          onUpdate={wrapUpdate} 
          categoria={data?.crmData?.detaliiGenerale?.categoria}
        />
      </SectionCard>
      <SectionCard id="pret" title="Preț">
        <PretSection 
          data={data?.crmData?.pret} 
          tranzactie={data?.crmData?.detaliiGenerale?.tranzactie} 
          onUpdate={wrapUpdate}
        />
      </SectionCard>
      <SectionCard id="descriere" title="Descriere">
        <DescriereSection data={data?.crmData?.descriere} onUpdate={wrapUpdate} fullCRMData={data?.crmData} />
      </SectionCard>
      <SectionCard id="imagini" title="Imagini">
        <ImaginiSection data={data?.crmData?.imagini} onUpdate={wrapUpdate} fullCRMData={data?.crmData} propertyId={propertyId} />
      </SectionCard>
    </div>
  );
};

const Accordion = ({ title, children, isOpen: isOpenProp, onToggle, defaultOpen = false }: { title: string, children: React.ReactNode, isOpen?: boolean, onToggle?: () => void, defaultOpen?: boolean }) => {
  const [isInternalOpen, setIsInternalOpen] = useState(defaultOpen);
  const isOpen = isOpenProp !== undefined ? isOpenProp : isInternalOpen;
  const toggle = onToggle || (() => setIsInternalOpen(!isInternalOpen));

  return (
    <div className="rounded-[16px] border border-gray-100 overflow-hidden bg-white shadow-sm">
      <button 
        onClick={toggle}
        className="w-full h-14 flex items-center justify-between px-6 text-left transition-colors hover:bg-gray-50"
      >
        <span className="text-[14px] font-bold text-[--color-text-main] uppercase tracking-wider">{title}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="text-[--color-text-placeholder]"><ChevronDown size={18} /></motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="p-5 border-t border-[#e5e7eb]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const markdownComponents = {
  h1: () => null,
  h2: ({children}: any) => (
    <h2 className="text-[18px] font-medium text-black tracking-tight mt-0 mb-3 font-sans capitalize">
      {children}
    </h2>
  ),
  ul: ({children}: any) => <ul className="space-y-1 mb-6">{children}</ul>,
  li: ({children}: any) => <li className="text-gray-600 border-b border-gray-50 py-2 last:border-0">{children}</li>,
  table: ({children}: any) => {
    return (
      <div className="mb-6 rounded-[16px] border border-gray-100 overflow-x-auto w-full group/table">
        <table className="w-full text-left border-collapse min-w-full table-auto">
          {children}
        </table>
      </div>
    );
  },
  thead: ({children}: any) => <thead className="bg-gray-50 border-b border-gray-100 text-gray-400">{children}</thead>,
  th: ({children}: any) => {
    const isImageTable = getTextFromChildren(children).toLowerCase().includes("imagine");
    return (
      <th className="px-5 py-3 text-[14px] font-bold capitalize tracking-wide first:w-[20%] first:min-w-[150px]">
        <TableHeaderCopyButton isImageTable={isImageTable}>{children}</TableHeaderCopyButton>
      </th>
    );
  },
  td: ({children, rowRef}: any) => {
    const imageUrls: string[] = [];
    const findAllImageUrls = (node: any) => {
      if (!node) return;
      if (node.type === "img" || (node.props && node.props.src)) imageUrls.push(node.props.src);
      if (Array.isArray(node)) node.forEach(findAllImageUrls);
      if (typeof node === "object" && node.props && node.props.children) findAllImageUrls(node.props.children);
    };
    
    findAllImageUrls(children);
    const isImageCell = imageUrls.length > 0;
    const textContent = getTextFromChildren(children).toLowerCase();
    const isCategoryLabel = (textContent === "living" || textContent === "bucătărie" || textContent === "dormitor" || textContent === "baie" || textContent === "alte spații");

    return (
      <td className="px-5 py-5 text-[13px] border-b border-gray-50 text-gray-600 first:font-bold first:text-black first:w-[20%] first:min-w-[150px] relative group/row align-top">
         <div className={`break-words whitespace-normal w-full overflow-hidden flex ${isImageCell ? 'flex-row flex-wrap gap-3' : 'flex-col gap-2'}`}>
            {children}
         </div>
         {isCategoryLabel ? (
           <CellCopyButton text={getTextFromChildren(children)} isRowDownload={true} rowRef={rowRef} />
         ) : (
           <CellCopyButton 
             text={getTextFromChildren(children)} 
             isImage={isImageCell} 
             url={imageUrls.length === 1 ? imageUrls[0] : ""} 
           />
         )}
      </td>
    );
  },
  tr: ({children}: any) => {
    const rowRef = useRef<HTMLTableRowElement>(null);
    return (
      <tr ref={rowRef} className="group/row hover:bg-gray-50/50 transition-colors relative">
        {React.Children.map(children, (child: any) => {
          if (React.isValidElement(child)) return React.cloneElement(child as React.ReactElement, { rowRef } as any);
          return child;
        })}
      </tr>
    );
  },
  img: ({src, alt}: any) => src ? (
    <div className="relative group/img inline-block" style={{ width: '80px' }}>
      <img src={src} alt={alt} className="rounded-[16px] w-full h-20 object-cover border border-gray-100 shadow-sm transition-all" referrerPolicy="no-referrer" />
    </div>
  ) : null,
};
