"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Loader2, Check, Crown, Sparkles, Layout, Palette, Tag, Lock, ArrowRight, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SECTION_ICONS, CATEGORY_LABELS } from "./constants";

export default function StepChooseTemplate({ selectedId, onSelect, planType = "standard" }) {
  const { user } = useAuth();
  const supabase = createClient();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) return;

    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from("templates")
        .select(`*, template_access(user_id)`)
        .eq("is_active", true)
        .eq("parse_status", "compiled")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        const accessibleTemps = data?.filter(t => {
          const accessedUsers = t.template_access?.map(a => a.user_id) || [];
          if (accessedUsers.length === 0) return true;
          return accessedUsers.includes(user.id);
        });
        setTemplates(accessibleTemps || []);
      }
      setLoading(false);
    };

    fetchTemplates();
  }, [user, supabase]);

  // Priority Sorting Logic
  const sortedTemplates = useMemo(() => {
    const filtered = filter === "all" ? templates : templates.filter((t) => t.category === filter);
    
    return [...filtered].sort((a, b) => {
      const aIsPrivate = a.template_access?.some(acc => acc.user_id === user?.id);
      const bIsPrivate = b.template_access?.some(acc => acc.user_id === user?.id);
      
      // 1. Private templates first
      if (aIsPrivate && !bIsPrivate) return -1;
      if (!aIsPrivate && bIsPrivate) return 1;

      // 2. Templates matching plan next
      const aMatches = (planType === 'premium' || planType === 'custom') ? a.is_premium : !a.is_premium;
      const bMatches = (planType === 'premium' || planType === 'custom') ? b.is_premium : !b.is_premium;
      
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;

      return 0;
    });
  }, [templates, filter, planType, user]);

  const categories = ["all", ...new Set(templates.map((t) => t.category))];

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="animate-spin w-10 h-10 text-gray-200" />
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Menyiapkan Desain...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">Pilih Desain</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Paket Aktif:</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              planType === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
            }`}>{planType}</span>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap border
                ${filter === cat 
                  ? "bg-gray-900 text-white border-gray-900 shadow-md" 
                  : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"}`}
            >
              {cat === "all" ? "Semua Desain" : CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {sortedTemplates.map((tmpl) => {
          const isSelected = tmpl.id === selectedId;
          const isPrivate = tmpl.template_access?.some(a => a.user_id === user.id);
          const isLocked = tmpl.is_premium && planType === "standard" && !isPrivate;
          const palette = tmpl.color_palette?.length > 0 ? tmpl.color_palette : ["#F3F4F6", "#E5E7EB", "#D1D5DB"];

          return (
            <div 
              key={tmpl.id} 
              className={`group relative flex flex-col bg-white rounded-3xl border transition-all duration-500
                ${isSelected ? "border-blue-600 ring-4 ring-blue-50 shadow-xl shadow-blue-100/50 scale-[1.02]" : "border-gray-100 hover:border-gray-300 shadow-sm hover:shadow-xl"}`}
            >
              {/* Visual Preview (Brand Colors) */}
              <div className="aspect-[16/9] relative overflow-hidden flex p-1.5 gap-1.5 bg-gray-50 rounded-t-[1.4rem]">
                 {palette.slice(0, 4).map((color, idx) => (
                   <div 
                    key={idx} 
                    className="flex-1 rounded-xl transition-all duration-500 group-hover:flex-[1.5]" 
                    style={{ backgroundColor: color }}
                   />
                 ))}
                 
                 <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                   {tmpl.is_premium && !isPrivate && (
                     <div className="bg-amber-400 text-amber-950 p-1.5 rounded-xl shadow-lg border border-amber-300">
                       <Crown size={16} />
                     </div>
                   )}
                   {isPrivate && (
                     <div className="bg-purple-600 text-white p-1.5 rounded-xl shadow-lg border border-purple-500">
                       <Lock size={16} />
                     </div>
                   )}
                 </div>

                 {isLocked && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                       <div className="bg-gray-900 text-white px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                          <Lock size={14} /> Paket Premium
                       </div>
                    </div>
                 )}
              </div>

              {/* Info Area */}
              <div className="p-6 space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                      {tmpl.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[9px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md uppercase tracking-wider">{tmpl.category}</span>
                       {isPrivate && <span className="text-[9px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md uppercase tracking-wider">Private Access</span>}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                       <Check size={20} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-auto flex flex-col gap-3">
                  <button 
                    onClick={() => !isLocked && onSelect(tmpl)}
                    disabled={isLocked || isSelected}
                    className={`w-full py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2
                      ${isSelected 
                        ? "bg-blue-50 text-blue-600 border border-blue-100 cursor-default" 
                        : isLocked 
                          ? "bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed"
                          : "bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-200"}`}
                  >
                    {isSelected ? "Sedang Digunakan" : isLocked ? "Terpaku (Premium)" : "Gunakan Desain"}
                    {!isSelected && !isLocked && <ArrowRight size={14} />}
                  </button>
                  
                  <Link 
                    href={`/templates/${tmpl.slug}?preview=1`}
                    target="_blank"
                    className="w-full py-2.5 text-[10px] font-bold text-gray-400 hover:text-gray-600 text-center uppercase tracking-widest flex items-center justify-center gap-1.5"
                  >
                    <Eye size={12} /> Lihat Live Preview
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedTemplates.length === 0 && (
        <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
          <Layout className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-400">Belum ada desain di kategori ini</p>
        </div>
      )}
    </div>
  );
}
