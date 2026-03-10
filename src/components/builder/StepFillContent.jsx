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
  Music
  } from "lucide-react";import { SECTION_ICONS } from "./constants";
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
  const [activeTab, setActiveTab] = useState("content"); // "content" | "style" | "guests"
  const [activeSection, setActiveSection] = useState(0);
  
  const sections = template?.content_schema?.sections ?? [];
  const guestSchema = template?.guest_schema?.fields ?? [];
  const isPremium = planType === "premium";

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
    const newGuest = { id: crypto.randomUUID(), name: "", whatsapp: "" };
    onGuestsChange([...guests, newGuest]);
  };

  const handleUpdateGuest = (id, key, value) => {
    onGuestsChange(guests.map(g => g.id === id ? { ...g, [key]: value } : g));
  };

  const handleRemoveGuest = (id) => {
    onGuestsChange(guests.filter(g => g.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex p-1 bg-gray-100 rounded-2xl">
        <button 
          onClick={() => setActiveTab("content")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all
            ${activeTab === "content" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <FileText className="w-4 h-4" /> Isi Konten
        </button>
        <button 
          onClick={() => setActiveTab("style")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all
            ${activeTab === "style" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Palette className="w-4 h-4" /> Kustomisasi
        </button>
        <button 
          onClick={() => setActiveTab("guests")}
          disabled={!isPremium}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all relative
            ${activeTab === "guests" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700 disabled:opacity-50"}`}
        >
          <Users className="w-4 h-4" /> Daftar Tamu
          {!isPremium && <span className="absolute -top-1 -right-1 bg-amber-400 text-[8px] px-1.5 py-0.5 rounded-full text-amber-900 font-black uppercase">Pro</span>}
        </button>
      </div>

      {/* Content Tab */}
      {activeTab === "content" && (
        <div className="space-y-5">
          {/* Section tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {sections.map((sec, idx) => {
              const filled = sec.fields?.filter((f) => content[f.key] != null && content[f.key] !== "").length ?? 0;
              const total = sec.fields?.length ?? 0;
              const done = filled === total && total > 0;
              return (
                <button key={sec.id ?? idx} onClick={() => setActiveSection(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border
                    ${activeSection === idx ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                      : done ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"}`}>
                  {SECTION_ICONS[sec.icon] ? (
                    (() => { const Icon = SECTION_ICONS[sec.icon]; return <Icon className="w-3 h-3" />; })()
                  ) : (
                    <SECTION_ICONS.default className="w-3 h-3" />
                  )}
                  {sec.label}
                </button>
              );
            })}
          </div>

          {/* Fields card */}
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-900">
                  {SECTION_ICONS[sections[activeSection]?.icon] ? (
                    (() => { const Icon = SECTION_ICONS[sections[activeSection].icon]; return <Icon className="w-4 h-4" />; })()
                  ) : (
                    <SECTION_ICONS.default className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm uppercase tracking-tight">{sections[activeSection]?.label}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{filledCount}/{totalCount} Terisi</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {sections[activeSection]?.fields?.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-400">*</span>}
                  </label>
                  <DynamicField field={field} value={content[field.key]} onChange={(val) => handleFieldChange(field.key, val)} />
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-between bg-gray-50/30">
              <button onClick={() => setActiveSection((p) => Math.max(0, p - 1))} disabled={activeSection === 0}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 disabled:opacity-20 transition-all">
                <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
              </button>
              <button onClick={() => setActiveSection((p) => Math.min(sections.length - 1, p + 1))} disabled={activeSection === sections.length - 1}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 disabled:opacity-20 transition-all">
                Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Style Tab */}
      {activeTab === "style" && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-600" /> Kustomisasi Warna
              </h3>
              <p className="text-xs text-gray-500 mt-1">Ubah palet warna template untuk menyesuaikan brand acaramu.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Warna Utama (Brand Colors)</label>
                <div className="flex flex-wrap gap-4">
                  {(content.brand_colors || template.color_palette || ["#000000", "#ffffff"]).map((color, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <input 
                        type="color" 
                        value={color}
                        onChange={(e) => {
                          const newColors = [...(content.brand_colors || template.color_palette || [])];
                          newColors[idx] = e.target.value;
                          handleFieldChange("brand_colors", newColors);
                        }}
                        className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white shadow-md ring-1 ring-gray-100"
                      />
                      <span className="text-[9px] font-mono text-gray-400 uppercase">{color}</span>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const newColors = [...(content.brand_colors || template.color_palette || []), "#000000"];
                      handleFieldChange("brand_colors", newColors);
                    }}
                    className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-gray-400 hover:text-gray-500 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight flex items-center gap-2">
                <Music className="w-4 h-4 text-purple-600" /> Musik Latar
              </h3>
              <p className="text-xs text-gray-500 mt-1">Musik akan terputar otomatis saat tamu membuka undangan.</p>
            </div>
            <DynamicField 
              field={{ type: 'audio', label: 'Upload MP3' }} 
              value={content.music_url} 
              onChange={(val) => handleFieldChange("music_url", val)} 
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-4 h-4" /> Link Undangan
            </label>
            <div className="flex items-center border-2 border-gray-100 rounded-2xl overflow-hidden focus-within:border-gray-900 transition-all">
              <span className="px-4 py-3 text-[10px] font-black text-gray-400 bg-gray-50 border-r border-gray-100 uppercase tracking-widest">sebar.in/</span>
              <input type="text" value={slug}
                onChange={(e) => onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="nama-undangan"
                className="flex-1 px-4 py-3 text-sm font-bold outline-none bg-white" />
              <button onClick={() => { const gen = autoSlug(content); if (gen) onSlugChange(gen); }}
                className="px-4 py-3 text-gray-400 hover:text-gray-900 transition-all border-l border-gray-100">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guests Tab */}
      {activeTab === "guests" && isPremium && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" /> Daftar Tamu Undangan
                </h3>
                <p className="text-xs text-gray-500 mt-1">Buat link khusus untuk setiap tamu agar lebih personal.</p>
              </div>
              <button 
                onClick={handleAddGuest}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Tamu
              </button>
            </div>

            {guests.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserPlus className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Belum ada tamu terdaftar</p>
                <button onClick={handleAddGuest} className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2">Klik untuk menambah</button>
              </div>
            ) : (
              <div className="space-y-3">
                {guests.map((guest, idx) => (
                  <div key={guest.id} className="group p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:border-gray-200 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Nama Tamu</label>
                          <input 
                            type="text" 
                            value={guest.name}
                            onChange={(e) => handleUpdateGuest(guest.id, "name", e.target.value)}
                            placeholder="Contoh: Budi & Partner"
                            className="w-full bg-transparent border-b border-gray-200 py-1 text-sm font-bold focus:border-gray-900 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">WhatsApp (Opsional)</label>
                          <input 
                            type="tel" 
                            value={guest.whatsapp || ""}
                            onChange={(e) => handleUpdateGuest(guest.id, "whatsapp", e.target.value)}
                            placeholder="628123..."
                            className="w-full bg-transparent border-b border-gray-200 py-1 text-sm font-bold focus:border-gray-900 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveGuest(guest.id)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {guest.name && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-[9px] font-mono text-gray-400 truncate max-w-[200px]">sebar.in/{slug}?to={encodeURIComponent(guest.name)}</p>
                        <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Copy Link</button>
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
