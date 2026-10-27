import React, { useState, useMemo } from "react";
import { 
  UserCheck, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Trash2, 
  Copy, 
  Check, 
  MapPin, 
  Edit3, 
  X,
  Briefcase
} from "lucide-react";
import { PersonalMember, personalService, PersonalStatus } from "../services/personalService";
import toast from "react-hot-toast";

interface PersonalViewProps {
  personal: PersonalMember[];
  onAddMemberClick?: () => void;
}

const COMMON_ROLES = [
  "Agent Imobiliar",
  "Broker Senior",
  "Broker Junior",
  "Manager Vânzări",
  "Team Leader",
  "Coordonator Tranzacții",
  "Asistent",
  "Fotograf Imobiliar",
  "Jurist",
  "Administrator"
];

export const PersonalView: React.FC<PersonalViewProps> = ({
  personal,
  onAddMemberClick
}) => {
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("Toți");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Edit modal state
  const [editingMember, setEditingMember] = useState<PersonalMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("Agent Imobiliar");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formZone, setFormZone] = useState("");
  const [formStatus, setFormStatus] = useState<PersonalStatus>("Activ");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(id);
      setTimeout(() => setCopiedField(null), 2000);
      toast.success("Copiat în clipboard!");
    } catch {
      toast.error("Nu s-a putut copia.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await personalService.deletePersonalMember(id);
      setConfirmDeleteId(null);
      toast.success("Membrul a fost șters!");
    } catch (e) {
      console.error(e);
      toast.error("Eroare la ștergerea membrului.");
    }
  };

  const handleOpenAdd = () => {
    if (onAddMemberClick) {
      onAddMemberClick();
      return;
    }
    setEditingMember(null);
    setFormName("");
    setFormRole("Agent Imobiliar");
    setFormPhone("");
    setFormEmail("");
    setFormZone("");
    setFormStatus("Activ");
    setFormNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: PersonalMember) => {
    setEditingMember(member);
    setFormName(member.name || "");
    setFormRole(member.role || "Agent Imobiliar");
    setFormPhone(member.phone || "");
    setFormEmail(member.email || "");
    setFormZone(member.zone || "");
    setFormStatus(member.status || "Activ");
    setFormNotes(member.notes || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      toast.error("Numele și telefonul sunt obligatorii.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMember?.id) {
        await personalService.updatePersonalMember(editingMember.id, {
          name: formName.trim(),
          role: formRole.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          zone: formZone.trim(),
          status: formStatus,
          notes: formNotes.trim()
        });
        toast.success("Datele membrului au fost actualizate!");
      } else {
        await personalService.addPersonalMember({
          name: formName.trim(),
          role: formRole.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          zone: formZone.trim(),
          status: formStatus,
          notes: formNotes.trim()
        });
        toast.success("Membru nou adăugat în echipă!");
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Eroare la salvarea membrului.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = useMemo(() => {
    return personal.filter((m, idx) => {
      // Category / Status Filter
      if (selectedFilter === "Activi" && m.status !== "Activ") return false;
      if (selectedFilter === "Inactivi" && m.status !== "Inactiv") return false;
      if (selectedFilter === "Agenți" && !m.role.toLowerCase().includes("agent")) return false;
      if (selectedFilter === "Brokeri" && !m.role.toLowerCase().includes("broker")) return false;
      if (selectedFilter === "Management" && 
          !m.role.toLowerCase().includes("manager") && 
          !m.role.toLowerCase().includes("leader") && 
          !m.role.toLowerCase().includes("administrator")) {
        return false;
      }

      // Search filter
      const q = search.toLowerCase().trim();
      if (!q) return true;

      const formattedId = (m.personalId || `S${idx + 1}`).toLowerCase();
      const nameMatch = (m.name || "").toLowerCase().includes(q);
      const roleMatch = (m.role || "").toLowerCase().includes(q);
      const phoneMatch = (m.phone || "").toLowerCase().includes(q);
      const emailMatch = (m.email || "").toLowerCase().includes(q);
      const zoneMatch = (m.zone || "").toLowerCase().includes(q);

      return formattedId.includes(q) || nameMatch || roleMatch || phoneMatch || emailMatch || zoneMatch;
    });
  }, [personal, search, selectedFilter]);

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Top Header / Action Bar */}
      <div className="bg-white border-b border-gray-200 shrink-0 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#051D35]/5 border border-[#051D35]/10 flex items-center justify-center text-[#051D35]">
            <UserCheck size={16} className="text-[#BE9662]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold tracking-tight text-[#051D35]">
                Personal
              </h2>
              <span className="text-[11px] font-mono font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {personal.length} total
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Echipa agenției: agenți, brokeri, manageri și coordonatori de tranzacții
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Search */}
          <div className="relative w-56 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută după nume, ID (#S...), telefon..."
              className="w-full h-8 pl-9 pr-3 text-xs bg-gray-50 border border-gray-200 rounded-md placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-400 transition-colors font-sans"
            />
          </div>

          {/* Add Personal Member Button */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium bg-[#051D35] hover:bg-[#0a2b4a] text-white rounded-md transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <Plus size={14} className="text-[#BE9662]" />
            <span>Adaugă Personal</span>
          </button>
        </div>
      </div>

      {/* Sub-header Filter Tabs */}
      <div className="bg-white border-b border-gray-200 shrink-0 px-6 h-[40px] flex items-center gap-2 overflow-x-auto no-scrollbar">
        {["Toți", "Agenți", "Brokeri", "Management", "Activi", "Inactivi"].map((f) => {
          let count = personal.length;
          if (f === "Activi") count = personal.filter(p => p.status === "Activ").length;
          else if (f === "Inactivi") count = personal.filter(p => p.status === "Inactiv").length;
          else if (f === "Agenți") count = personal.filter(p => p.role.toLowerCase().includes("agent")).length;
          else if (f === "Brokeri") count = personal.filter(p => p.role.toLowerCase().includes("broker")).length;
          else if (f === "Management") count = personal.filter(p => 
            p.role.toLowerCase().includes("manager") || 
            p.role.toLowerCase().includes("leader") || 
            p.role.toLowerCase().includes("administrator")
          ).length;

          return (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`h-7 px-2.5 flex items-center gap-1.5 text-xs rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedFilter === f
                  ? "bg-[#051D35] text-white font-medium shadow-xs"
                  : "text-gray-600 hover:text-[#051D35] hover:bg-gray-100"
              }`}
            >
              <span>{f}</span>
              <span className={`text-[10px] font-mono px-1 rounded ${
                selectedFilter === f ? "bg-white/15 text-[#BE9662]" : "bg-gray-100 text-gray-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center bg-white rounded-xl border border-gray-200 p-8">
            <div className="w-10 h-10 bg-[#BE9662]/10 border border-[#BE9662]/20 rounded-full flex items-center justify-center text-[#BE9662] mb-3">
              <UserCheck size={20} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Niciun membru găsit</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              {search 
                ? `Nu există niciun membru care să corespundă căutării "${search}".` 
                : "Nu aveți membri înregistrați în această categorie a personalului."}
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 h-8 px-3.5 flex items-center gap-1.5 text-xs font-medium bg-[#051D35] text-white rounded-md hover:bg-[#0a2b4a] transition-colors"
            >
              <Plus size={14} className="text-[#BE9662]" />
              <span>Adaugă primul membru</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-28">ID Personal</th>
                  <th className="py-3 px-4">Nume și Prenume</th>
                  <th className="py-3 px-4">Funcție / Rol</th>
                  <th className="py-3 px-4">Telefon</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Zonă / Cartiere</th>
                  <th className="py-3 px-4 w-24">Status</th>
                  <th className="py-3 px-4 text-right w-28">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.map((member, idx) => {
                  const displayId = member.personalId || `S${idx + 1}`;
                  const isConfirmingDelete = confirmDeleteId === member.id;

                  return (
                    <tr key={member.id || idx} className="hover:bg-gray-50/70 transition-colors group">
                      {/* ID Badge */}
                      <td className="py-3 px-4 font-mono font-medium text-gray-900">
                        <span className="bg-[#BE9662]/10 text-[#BE9662] border border-[#BE9662]/20 px-2 py-0.5 rounded text-[11px] font-semibold">
                          #{displayId}
                        </span>
                      </td>

                      {/* Name with Avatar */}
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#051D35] text-[#BE9662] flex items-center justify-center text-[11px] font-bold uppercase tracking-wider shadow-xs">
                            {(member.name.split(" ")[0]?.[0] || "") + (member.name.split(" ")[1]?.[0] || "")}
                          </div>
                          <div>
                            <span className="text-[#051D35] font-medium">{member.name}</span>
                            {member.notes && (
                              <p className="text-[10px] text-gray-400 font-normal truncate max-w-[180px]">
                                {member.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                          <Briefcase size={11} className="text-gray-400" />
                          {member.role}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <a 
                            href={`tel:${member.phone}`}
                            className="font-mono text-gray-700 hover:text-[#BE9662] hover:underline flex items-center gap-1"
                          >
                            <Phone size={12} className="text-gray-400" />
                            {member.phone}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(member.phone, `phone-${member.id || displayId}`)}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                            title="Copiază telefonul"
                          >
                            {copiedField === `phone-${member.id || displayId}` ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4">
                        {member.email ? (
                          <div className="flex items-center gap-1.5">
                            <a 
                              href={`mailto:${member.email}`}
                              className="text-gray-700 hover:text-[#BE9662] hover:underline truncate max-w-[160px]"
                            >
                              {member.email}
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopy(member.email!, `mail-${member.id || displayId}`)}
                              className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                              title="Copiază emailul"
                            >
                              {copiedField === `mail-${member.id || displayId}` ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Zone */}
                      <td className="py-3 px-4">
                        {member.zone ? (
                          <div className="flex items-center gap-1 text-gray-700">
                            <MapPin size={11} className="text-gray-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{member.zone}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Toate zonele</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          member.status === "Activ"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            member.status === "Activ" ? "bg-emerald-500" : "bg-gray-400"
                          }`} />
                          {member.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(member)}
                            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                            title="Editează"
                          >
                            <Edit3 size={13} />
                          </button>

                          {member.id && (
                            isConfirmingDelete ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(member.id!)}
                                  className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded hover:bg-red-700 transition-colors"
                                >
                                  Șterge
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-[10px] rounded hover:bg-gray-300 transition-colors"
                                >
                                  Anulează
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(member.id!)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Șterge membru"
                              >
                                <Trash2 size={13} />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#051D35]/5 border border-[#051D35]/10 flex items-center justify-center text-[#BE9662]">
                  <UserCheck size={14} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#051D35]">
                    {editingMember ? "Editează membru personal" : "Adaugă membru personal"}
                  </h3>
                  {editingMember?.personalId && (
                    <span className="text-[10px] font-mono text-[#BE9662]">
                      ID: #{editingMember.personalId}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Nume și prenume *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ex: Alexandru Popescu"
                  className="w-full h-8 px-3 border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Rol / Funcție
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full h-8 px-2.5 border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 bg-white cursor-pointer"
                  >
                    {COMMON_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as PersonalStatus)}
                    className="w-full h-8 px-2.5 border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 bg-white cursor-pointer"
                  >
                    <option value="Activ">Activ</option>
                    <option value="Inactiv">Inactiv</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="ex: 0722 000 000"
                    className="w-full h-8 px-3 border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="agent@cautlocuinta.ro"
                    className="w-full h-8 px-3 border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Zonă / Cartiere atribuite
                </label>
                <input
                  type="text"
                  value={formZone}
                  onChange={(e) => setFormZone(e.target.value)}
                  placeholder="ex: Nord, Aviatiei, Floreasca, Pipera"
                  className="w-full h-8 px-3 border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Notițe interne
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Detalii adiționale, limbi vorbite, orar..."
                  className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 bg-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-8 px-4 bg-[#051D35] hover:bg-[#0a2b4a] text-white font-medium rounded-md transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Se salvează..." : editingMember ? "Salvează modificările" : "Creează membru (#S...)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
