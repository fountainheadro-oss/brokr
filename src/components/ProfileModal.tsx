import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  ShieldCheck, 
  Key, 
  LogOut, 
  CheckCircle2, 
  Calendar 
} from "lucide-react";
import { auth } from "../lib/firebase";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStats?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onOpenStats }) => {
  if (!isOpen) return null;

  const currentUser = auth.currentUser;
  const userName = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Alexandru Radu');
  const userEmail = currentUser?.email || 'alexandru.radu@brokr.ro';
  const userPhoto = currentUser?.photoURL;
  const userRole = 'Broker Principal';
  const agencyName = 'Agenția brokr';
  const creationTime = currentUser?.metadata?.creationTime 
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Octombrie 2024';

  const handleLogout = async () => {
    try {
      await auth.signOut();
      onClose();
    } catch (err) {
      console.error("Eroare la deconectare:", err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-lg border border-gray-200 shadow-2xl overflow-hidden flex flex-col z-[401]"
        >
          {/* Header */}
          <div className="h-[52px] px-5 border-b border-gray-200 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#051D35]/5 border border-[#051D35]/15 flex items-center justify-center text-[#BE9662]">
                <User size={15} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-gray-900 tracking-tight">Profil Utilizator</h2>
                <p className="text-[10px] text-gray-500 font-medium">Informații de identificare și detalii cont</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Închide"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Identity Card */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50/70 border border-gray-200/80">
              <div className="w-16 h-16 rounded-lg bg-[#051D35]/5 border border-[#051D35]/15 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {userPhoto ? (
                  <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-[#051D35]">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{userName}</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 size={11} /> Activ
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{userEmail}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-semibold text-[#051D35] bg-[#BE9662]/15 px-2 py-0.5 rounded border border-[#BE9662]/30">
                    {userRole}
                  </span>
                  <span className="text-[10px] font-medium text-gray-500">
                    {agencyName}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date Profesionale</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-md border border-gray-200">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium mb-1">
                    <ShieldCheck size={12} className="text-[#BE9662]" />
                    Nivel Acces
                  </div>
                  <div className="text-xs font-semibold text-gray-900">Administrator / Senior</div>
                </div>

                <div className="p-3 bg-white rounded-md border border-gray-200">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium mb-1">
                    <Building2 size={12} className="text-[#BE9662]" />
                    Sediu / Agenție
                  </div>
                  <div className="text-xs font-semibold text-gray-900">{agencyName}</div>
                </div>

                <div className="p-3 bg-white rounded-md border border-gray-200">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium mb-1">
                    <Phone size={12} className="text-[#BE9662]" />
                    Telefon Contact
                  </div>
                  <div className="text-xs font-semibold text-gray-900 font-mono">0722 000 000</div>
                </div>

                <div className="p-3 bg-white rounded-md border border-gray-200">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium mb-1">
                    <Calendar size={12} className="text-[#BE9662]" />
                    Membru Din
                  </div>
                  <div className="text-xs font-semibold text-gray-900">{creationTime}</div>
                </div>
              </div>
            </div>

            {/* System Details */}
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-[11px] text-gray-600 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">ID Utilizator:</span>
                <span className="font-mono text-gray-800 font-medium truncate max-w-[220px]">
                  {currentUser?.uid || 'local-admin-uid'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Furnizor Autentificare:</span>
                <span className="font-medium text-gray-800">Google OAuth 2.0</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="h-[56px] px-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
            {onOpenStats ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStats();
                }}
                className="text-xs font-semibold text-[#051D35] hover:text-[#0a2b4a] underline cursor-pointer"
              >
                Vezi Statisticile Mele →
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="h-8 px-3.5 rounded-md border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <LogOut size={13} />
                Deconectare
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-4 rounded-md bg-[#051D35] hover:bg-[#0a2b4a] text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                Închide
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
