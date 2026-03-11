"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  Loader2, Crown, Globe, Search, Lock, Eye, 
  Check, ArrowRight, Layout, Layers, Heart, Cake, GraduationCap, Mail
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "all", label: "Semua", icon: Layers },
  { value: "wedding", label: "Pernikahan", icon: Heart },
  { value: "birthday", label: "Ultah", icon: Cake },
  { value: "graduation", label: "Wisuda", icon: GraduationCap },
  { value: "engagement", label: "Tunangan", icon: Mail },
];

export default function UserTemplateCatalog() {
  const { user } = useAuth();
  const supabase = createClient();
  const [templates, setTemplates] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Fetch Templates (Public + Accessible Private)
    let query = supabase
      .from("templates")
      .select(`*, template_access(user_id)`)
      .eq("is_active", true)
      .eq("parse_status", "compiled")
      .order("created_at", { ascending: false });

    // 2. Fetch User verified orders
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "verified");

    const { data: temps } = await query;

    // Filter templates logic: (target_user_id null OR user is in template_access)
    const accessibleTemps = temps?.filter(t => {
        const accessedUsers = t.template_access?.map(a => a.user_id) || [];
        return !t.target_user_id || accessedUsers.includes(user.id);
    });

    setTemplates(accessibleTemps || []);
    setUserOrders(orders || []);
    setLoading(false);
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "all" || t.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, activeCategory]);

  const hasPremiumAccess = userOrders.some(o => o.plan_type === 'premium');
  const hasStandardAccess = userOrders.some(o => o.plan_type === 'standard');

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 md:px-6 space-y-8 text-gray-800 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Katalog Desain</h1>
          <p className="text-sm text-gray-500">Pilih desain yang paling cocok untuk momen spesial Anda.</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text"
            placeholder="Cari nama desain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-all bg-white"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
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

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTemplates.map(t => {
          const isPrivate = !!t.target_user_id;
          const isPremium = t.is_premium && !isPrivate;
          
          // Logic: can user use it?
          let canUse = false;
          if (isPrivate) canUse = true; // If they can see it in catalog, they are invited
          else if (isPremium) canUse = hasPremiumAccess;
          else canUse = hasStandardAccess || hasPremiumAccess;

          const palette = t.color_palette?.length > 0 ? t.color_palette : ["#F3F4F6", "#E5E7EB", "#D1D5DB"];

          return (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
              
              {/* BRAND COLOR PREVIEW */}
              <div className="aspect-[16/9] relative overflow-hidden flex p-1 gap-1 bg-gray-50">
                 {palette.slice(0, 4).map((color, idx) => (
                   <div key={idx} className="flex-1 rounded-lg" style={{ backgroundColor: color }} />
                 ))}
                 
                 <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                   {isPremium && <div className="bg-amber-400 text-amber-950 p-1.5 rounded-lg shadow-sm border border-amber-300"><Crown size={14} /></div>}
                   {isPrivate && <div className="bg-purple-600 text-white p-1.5 rounded-lg shadow-sm border border-purple-500"><Lock size={14} /></div>}
                 </div>
              </div>

              <div className="p-6 space-y-4 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 leading-tight uppercase tracking-tight">{t.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[9px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md uppercase tracking-wider">{t.category}</span>
                       <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                         isPrivate ? "bg-purple-100 text-purple-700" : isPremium ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                       }`}>
                         {isPrivate ? "Private" : isPremium ? "Premium" : "Standard"}
                       </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100">
                {canUse ? (
                  <Link 
                    href={`/dashboard/user/builder?template=${t.id}`}
                    className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition-all"
                  >
                    Gunakan Template <ArrowRight size={14} />
                  </Link>
                ) : (
                  <Link 
                    href="/dashboard/user/checkout/plans"
                    className="w-full py-2.5 bg-white border border-gray-200 text-gray-900 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                  >
                    Beli Paket {isPremium ? "Premium" : "Standard"} <Lock size={14} />
                  </Link>
                )}
                <Link 
                  href={`/templates/${t.slug}?preview=1`}
                  target="_blank"
                  className="w-full mt-2 py-2 text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest flex items-center justify-center gap-1"
                >
                  <Eye size={12} /> Lihat Preview
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}