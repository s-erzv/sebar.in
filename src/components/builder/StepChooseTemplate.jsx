"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check, Crown, Sparkles, Layout, Palette, Tag, Lock } from "lucide-react";
import Image from "next/image";
import { SECTION_ICONS, CATEGORY_LABELS } from "./constants";

export default function StepChooseTemplate({ selectedId, onSelect, planType = "standard" }) {
  const supabase = createClient();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    supabase
      .from("templates")
      .select("*")
      .eq("is_active", true)
      .eq("parse_status", "compiled")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        setTemplates(data ?? []);
        setLoading(false);
      });
  }, []);

  const categories = ["all", ...new Set(templates.map((t) => t.category))];
  const filtered = filter === "all" ? templates : templates.filter((t) => t.category === filter);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Menyiapkan Katalog...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Pilih Desain</h2>
          <p className="text-sm text-gray-500 mt-1">
            Paket Kamu: <span className="font-bold text-blue-600 uppercase tracking-widest text-[10px]">{planType}</span>
          </p>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border
                ${filter === cat 
                  ? "bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-200" 
                  : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"}`}
            >
              {cat === "all" ? "Semua" : CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {filtered.map((tmpl) => {
          const isSelected = tmpl.id === selectedId;
          const isLocked = tmpl.is_premium && planType !== "premium";
          const palette = tmpl.color_palette?.length > 0 ? tmpl.color_palette : ["#F3F4F6", "#E5E7EB", "#D1D5DB"];
          const Icon = SECTION_ICONS[tmpl.category] || SECTION_ICONS.default;

          return (
            <button 
              key={tmpl.id} 
              onClick={() => !isLocked && onSelect(tmpl)}
              disabled={isLocked}
              className={`group relative text-left rounded-3xl overflow-hidden transition-all duration-500 flex flex-col h-full
                ${isSelected 
                  ? "ring-4 ring-blue-600 ring-offset-4 scale-[0.98]" 
                  : isLocked 
                    ? "opacity-80 grayscale-[0.5] cursor-not-allowed"
                    : "hover:shadow-2xl hover:shadow-gray-200 hover:-translate-y-1"}`}
            >
              {/* Preview Area */}
              <div className="aspect-[4/5] relative overflow-hidden bg-gray-50">
                {tmpl.preview_image_url ? (
                  <Image 
                    src={tmpl.preview_image_url} 
                    alt={tmpl.name} 
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                ) : (
                  <div 
                    className="absolute inset-0 flex items-center justify-center transition-all duration-500"
                    style={{ 
                      background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1] || palette[0]} 100%)` 
                    }}
                  >
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="relative p-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl transition-transform duration-500 group-hover:scale-110">
                      <Icon className="w-12 h-12 text-white drop-shadow-lg" />
                    </div>
                  </div>
                )}

                {/* Locked Overlay */}
                {isLocked && (
                  <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-white text-xs font-black uppercase tracking-widest leading-tight">
                      Paket Premium<br/>Wajib
                    </p>
                  </div>
                )}

                {/* Badges Overlay */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                  <div className="flex flex-col gap-2">
                    <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-gray-900 uppercase tracking-widest shadow-sm border border-white/50">
                      {CATEGORY_LABELS[tmpl.category] || tmpl.category}
                    </span>
                    {tmpl.is_premium && (
                      <span className="bg-amber-400 text-amber-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-amber-200 w-fit">
                        <Crown className="w-2.5 h-2.5" /> Premium
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Info Area */}
              <div className="p-5 bg-white border-x border-b border-gray-100 rounded-b-3xl flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                    {tmpl.name}
                  </h3>
                  {tmpl.description && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex -space-x-1.5">
                    {palette.slice(0, 4).map((color, i) => (
                      <div 
                        key={i} 
                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-100"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  <div className="flex gap-1">
                    {tmpl.tags?.slice(0, 2).map((tag, i) => (
                      <span key={i} className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Layout className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Belum ada template di kategori ini</p>
        </div>
      )}
    </div>
  );
}
