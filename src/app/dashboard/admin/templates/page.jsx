// src/app/dashboard/admin/templates/page.jsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import AccessDenied from "@/components/ui/AccessDenied";
import { 
  Palette, Plus, Layout, Loader2, Crown, 
  CheckCircle2, AlertCircle, Clock, Globe, 
  ShieldCheck, RefreshCw, MoreVertical, Search,
  Filter, X, Grid, List, Eye, Lock, Trash2,
  Heart, Cake, GraduationCap, Mail, Layers, Sparkles, Shield
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "all", label: "Semua Kategori", icon: Layers },
  { value: "wedding", label: "Pernikahan", icon: Heart },
  { value: "birthday", label: "Ulang Tahun", icon: Cake },
  { value: "graduation", label: "Wisuda", icon: GraduationCap },
  { value: "engagement", label: "Tunangan", icon: Mail },
  { value: "general", label: "Umum", icon: Layout },
];

const PLANS = [
  { value: "all", label: "Semua Paket", icon: Shield },
  { value: "standard", label: "Standard", icon: Layout },
  { value: "premium", label: "Premium", icon: Crown },
  { value: "private", label: "Private", icon: Lock },
];

export default function AdminTemplatesPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activePlan, setActivePlan] = useState("all");

  useEffect(() => {
    if (profile?.role === "admin") fetchTemplates();
  }, [profile]);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error) setTemplates(data || []);
    setLoading(false);
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "all" || t.category === activeCategory;
      
      let matchesPlan = true;
      if (activePlan !== "all") {
        if (activePlan === "private") matchesPlan = !!t.target_user_id;
        else if (activePlan === "premium") matchesPlan = t.is_premium && !t.target_user_id;
        else if (activePlan === "standard") matchesPlan = !t.is_premium;
      }
      
      return matchesSearch && matchesCategory && matchesPlan;
    });
  }, [templates, searchQuery, activeCategory, activePlan]);

  const handleToggleActive = async (id, currentStatus) => {
    setProcessingId(id);
    const { error } = await supabase
      .from("templates")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (!error) {
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, is_active: !currentStatus } : t));
    }
    setProcessingId(null);
  };

  const handleDeleteTemplate = async (id, name) => {
    if (!confirm(`Hapus template "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    
    setProcessingId(id);
    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", id);

    if (!error) {
      setTemplates(prev => prev.filter(t => t.id !== id));
    } else {
      alert("Gagal menghapus: " + error.message);
    }
    setProcessingId(null);
  };

  if (authLoading || loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;
  if (profile?.role !== "admin") return <AccessDenied />;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 md:px-6 space-y-8 text-gray-800 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Katalog Template</h1>
          <p className="text-sm text-gray-500">Kelola dan publikasikan desain undangan terbaru.</p>
        </div>
        <Link href="/dashboard/admin/templates/new" 
          className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-sm">
          <Plus size={18} /> Design Baru
        </Link>
      </div>

      {/* FILTER CONTROLS */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text"
            placeholder="Cari nama atau slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400 transition-all bg-white"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Kategori Acara</p>
            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 border
                    ${activeCategory === cat.value ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"}`}
                >
                  <cat.icon size={14} /> {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:w-1/3 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Paket Akses</p>
            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
              {PLANS.map(plan => (
                <button
                  key={plan.value}
                  onClick={() => setActivePlan(plan.value)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 border
                    ${activePlan === plan.value ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"}`}
                >
                  <plan.icon size={14} /> {plan.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GRID LIST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTemplates.map(t => {
          const isPrivate = !!t.target_user_id;
          const isPremium = t.is_premium && !isPrivate;
          const palette = t.color_palette?.length > 0 ? t.color_palette : ["#F3F4F6", "#E5E7EB", "#D1D5DB"];

          return (
            <div key={t.id} className="bg-white rounded-[1.5rem] border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col group">
              
              {/* BRAND COLOR PREVIEW */}
              <div className="aspect-[16/9] relative overflow-hidden flex p-1 gap-1 bg-gray-50">
                 {palette.slice(0, 4).map((color, idx) => (
                   <div 
                    key={idx} 
                    className="flex-1 rounded-lg transition-all duration-500 group-hover:flex-[1.5]" 
                    style={{ backgroundColor: color }}
                   />
                 ))}
                 
                 <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                   {isPremium && (
                     <div className="bg-amber-400 text-amber-950 p-1.5 rounded-lg shadow-lg border border-amber-300">
                       <Crown size={14} />
                     </div>
                   )}
                   {isPrivate && (
                     <div className="bg-purple-600 text-white p-1.5 rounded-lg shadow-lg border border-purple-500">
                       <Lock size={14} />
                     </div>
                   )}
                   <StatusBadge status={t.parse_status} />
                 </div>
              </div>

              <div className="p-6 space-y-4 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">{t.name}</h3>
                    <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-widest italic">{t.slug}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                    <Layout size={16} />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <span className="text-[9px] font-bold px-2 py-1 bg-gray-100 text-gray-500 rounded-md uppercase tracking-wider">{t.category}</span>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                    isPrivate ? "bg-purple-100 text-purple-700" : isPremium ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {isPrivate ? "Private" : isPremium ? "Premium" : "Standard"}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    disabled={processingId === t.id}
                    onClick={() => handleToggleActive(t.id, t.is_active)}
                    className={`text-[10px] font-black uppercase tracking-widest transition-colors ${t.is_active ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {t.is_active ? 'Published' : 'Draft Mode'}
                  </button>
                  <button
                    disabled={processingId === t.id}
                    onClick={() => handleDeleteTemplate(t.id, t.name)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    title="Hapus Template"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <Link 
                  href={`/dashboard/admin/templates/${t.id}`}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Edit Detail <Eye size={12} />
                </Link>
              </div>

            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
           <Layout size={40} className="mx-auto text-gray-300 mb-3" />
           <p className="text-sm font-medium text-gray-400">Tidak ada template yang sesuai filter.</p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const configs = {
    compiled: { class: "bg-emerald-500 text-white", label: "Ready" },
    pending:  { class: "bg-amber-500 text-white",  label: "Wait" },
    parsing:  { class: "bg-blue-500 text-white",   label: "Work" },
    failed:   { class: "bg-red-500 text-white",    label: "Error" },
  };
  const config = configs[status] || configs.pending;
  return (
    <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase shadow-sm ${config.class}`}>
      {config.label}
    </span>
  );
}