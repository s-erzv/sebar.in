"use client";

import { useState, useCallback } from "react";
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Globe, 
  Palette, 
  Users, 
  FileText,
  Plus, 
  Trash2, 
  UserPlus,
  Music,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { SECTION_ICONS } from "./constants";
import DynamicField from "./DynamicField";

export default function StepFillContent({ 
  template, 
  content, 
  onChange, 
  slug, 
  onSlugChange,
  planType = "standard",
  guests = [],
  onGuestsChange
}) {
  const [activeTab, setActiveTab] = useState("content"); 
  const [activeSection, setActiveSection] = useState(0);
  const [expandedGuest, setExpandedGuest] = useState(null);
  
  const sections = template?.content_schema?.sections ?? [];
  const extraGuestFields = template?.guest_schema?.extra_fields ?? [];
  
  // Fitur tamu aktif jika ada schema tamu (meskipun extra_fields kosong, minimal ada name/wa)
  const supportsGuests = template?.guest_schema != null;

  const currentSection = sections[activeSection];
  const filledCount = currentSection?.fields?.filter((f) => content[f.key] != null && content[f.key] !== "").length ?? 0;
  const totalCount = currentSection?.fields?.length ?? 0;

  const autoSlug = useCallback((contentData) => {
    const nameKeys = ["groom_name", "bride_name", "name", "nama", "full_name", "event_name"];
    const parts = [];
    for (const key of nameKeys) {
      if (contentData[key] && typeof contentData[key] === "string") {
        parts.push(contentData[key]);
        if (parts.length >= 2) break;
      }
    }
    if (!parts.length) return "";
    return parts.join("-").toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60);
  }, []);

  const handleFieldChange = (key, value) => {
    const newContent = { ...content, [key]: value };
    onChange(newContent);
    if (!slug) {
      const gen = autoSlug(newContent);
      if (gen) onSlugChange(gen);
    }
  };

  const handleAddGuest = () => {
    const newGuest = { id: crypto.randomUUID(), name: "", whatsapp: "", custom_data: {} };
    onGuestsChange([...guests, newGuest]);
    setExpandedGuest(newGuest.id);
  };

  const handleUpdateGuest = (id, key, value, isCustom = false) => {
    onGuestsChange(guests.map(g => {
      if (g.id !== id) return g;
      if (isCustom) {
        return { ...g, custom_data: { ...(g.custom_data || {}), [key]: value } };
      }
      return { ...g, [key]: value };
    }));
  };

  const handleRemoveGuest = (id) => {
    onGuestsChange(guests.filter(g => g.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex p-1 bg-gray-100 rounded-2xl">
        <button onClick={() => setActiveTab("content")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === "content" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}><FileText className="w-4 h-4" /> Isi Konten</button>
        <button onClick={() => setActiveTab("style")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === "style" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}><Palette className="w-4 h-4" /> Kustomisasi</button>
        {supportsGuests && (
          <button onClick={() => setActiveTab("guests")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === "guests" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}><Users className="w-4 h-4" /> Daftar Tamu</button>
        )}
      </div>

      {activeTab === "content" && (
        <div className="space-y-5">
          <div className="flex gap-1.5 flex-wrap">
            {sections.map((sec, idx) => (
              <button key={idx} onClick={() => setActiveSection(idx)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${activeSection === idx ? "bg-gray-900 text-white border-gray-900 shadow-lg" : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"}`}>
                {SECTION_ICONS[sec.icon] ? (() => { const Icon = SECTION_ICONS[sec.icon]; return <Icon className="w-3 h-3" />; })() : <SECTION_ICONS.default className="w-3 h-3" />}
                {sec.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-900">
                  {SECTION_ICONS[sections[activeSection]?.icon] ? (() => { const Icon = SECTION_ICONS[sections[activeSection].icon]; return <Icon className="w-4 h-4" />; })() : <SECTION_ICONS.default className="w-4 h-4" />}
                </div>
                <div><p className="font-black text-gray-900 text-sm uppercase tracking-tight">{sections[activeSection]?.label}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{filledCount}/{totalCount} Terisi</p></div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {sections[activeSection]?.fields?.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">{field.label}{field.required && <span className="text-red-400">*</span>}</label>
                  <DynamicField field={field} value={content[field.key]} onChange={(val) => handleFieldChange(field.key, val)} />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between bg-gray-50/30">
              <button onClick={() => setActiveSection((p) => Math.max(0, p - 1))} disabled={activeSection === 0} className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 disabled:opacity-20 transition-all">Sebelumnya</button>
              <button onClick={() => setActiveSection((p) => Math.min(sections.length - 1, p + 1))} disabled={activeSection === sections.length - 1} className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 disabled:opacity-20 transition-all">Selanjutnya</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "style" && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight flex items-center gap-2"><Palette className="w-4 h-4 text-blue-600" /> Kustomisasi Warna</h3>
            <div className="flex flex-wrap gap-4">
              {(content.brand_colors || template.color_palette || ["#000000", "#ffffff"]).map((color, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <input type="color" value={color} onChange={(e) => {
                    const newColors = [...(content.brand_colors || template.color_palette || [])];
                    newColors[idx] = e.target.value;
                    handleFieldChange("brand_colors", newColors);
                  }} className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white shadow-md ring-1 ring-gray-100" />
                  <span className="text-[9px] font-mono text-gray-400 uppercase">{color}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight flex items-center gap-2"><Music className="w-4 h-4 text-purple-600" /> Musik Latar</h3>
            <DynamicField field={{ type: 'audio', label: 'Upload MP3' }} value={content.music_url} onChange={(val) => handleFieldChange("music_url", val)} />
          </div>
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Globe className="w-4 h-4" /> Link Undangan</label>
            <div className="flex items-center border-2 border-gray-100 rounded-2xl overflow-hidden focus-within:border-gray-900 transition-all">
              <span className="px-4 py-3 text-[10px] font-black text-gray-400 bg-gray-50 border-r border-gray-100 uppercase">sebar.in/</span>
              <input type="text" value={slug} onChange={(e) => onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="nama-undangan" className="flex-1 px-4 py-3 text-sm font-bold outline-none" />
              <button onClick={() => { const gen = autoSlug(content); if (gen) onSlugChange(gen); }} className="px-4 py-3 text-gray-400 hover:text-gray-900 border-l border-gray-100"><RefreshCw className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "guests" && supportsGuests && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight flex items-center gap-2"><Users className="w-4 h-4 text-purple-600" /> Daftar Tamu</h3>
              <button onClick={handleAddGuest} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all"><Plus size={14} /> Tambah Tamu</button>
            </div>

            {guests.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Belum ada tamu terdaftar</p></div>
            ) : (
              <div className="space-y-3">
                {guests.map((guest) => (
                  <div key={guest.id} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedGuest(expandedGuest === guest.id ? null : guest.id)}>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{guest.name || "Nama Tamu Kosong"}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{guest.whatsapp || "Tanpa WhatsApp"}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveGuest(guest.id); }} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        {expandedGuest === guest.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </div>
                    
                    {expandedGuest === guest.id && (
                      <div className="p-4 pt-0 border-t border-gray-100 bg-white space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-1.5"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nama Tamu</label><input type="text" value={guest.name} onChange={(e) => handleUpdateGuest(guest.id, "name", e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium outline-none focus:border-gray-900" /></div>
                          <div className="space-y-1.5"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">WhatsApp</label><input type="tel" value={guest.whatsapp || ""} onChange={(e) => handleUpdateGuest(guest.id, "whatsapp", e.target.value)} placeholder="62812..." className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium outline-none focus:border-gray-900" /></div>
                        </div>

                        {/* Extra fields from Template Schema */}
                        {extraGuestFields.length > 0 && (
                          <div className="space-y-4 pt-2">
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-1">Data Tambahan (Khusus Desain Ini)</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {extraGuestFields.map((field) => (
                                <div key={field.key} className="space-y-1.5">
                                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{field.label}</label>
                                  <DynamicField field={field} value={guest.custom_data?.[field.key]} onChange={(val) => handleUpdateGuest(guest.id, field.key, val, true)} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center justify-between mt-2">
                          <p className="text-[10px] font-mono text-blue-700 truncate max-w-[70%]">sebar.in/{slug}?to={encodeURIComponent(guest.name)}</p>
                          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${slug}?to=${encodeURIComponent(guest.name)}`); alert('Link disalin!'); }} className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800">Salin Link</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}