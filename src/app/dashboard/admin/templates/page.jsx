"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import AccessDenied from "@/components/ui/AccessDenied";
import { Palette, Plus, Layout, Loader2, Crown, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function AdminTemplatesPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === "admin") fetchTemplates();
  }, [profile]);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error) setTemplates(data || []);
    setLoading(false);
  };

  if (authLoading || loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" />
    </div>
  );
  
  if (profile?.role !== "admin") return <AccessDenied />;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-100 rounded-lg text-pink-600"><Palette size={24} /></div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Kelola Template</h1>
            <p className="text-sm text-gray-500">{templates.length} Desain Terdaftar</p>
          </div>
        </div>
        <Link href="/dashboard/admin/templates/new" 
          className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-xl hover:bg-gray-800 transition-all active:scale-95">
          <Plus size={18} /> Tambah Desain
        </Link>
      </div>

      {/* Grid Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm group hover:shadow-md transition-shadow">
            {/* Preview Area */}
            <div className="aspect-[16/10] bg-gray-50 relative overflow-hidden flex items-center justify-center border-b border-gray-100">
               {t.preview_image_url ? (
                 <img src={t.preview_image_url} alt={t.name} className="object-cover w-full h-full" />
               ) : (
                 <Layout className="text-gray-200" size={64} />
               )}
               
               {/* Status Overlay */}
               <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                 {t.is_premium && (
                   <div className="bg-amber-400 text-amber-950 p-1.5 rounded-lg shadow-sm">
                     <Crown size={14} />
                   </div>
                 )}
                 <StatusBadge status={t.parse_status} />
               </div>
            </div>

            {/* Info Area */}
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">{t.name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    {t.category}
                  </p>
                </div>
                {/* Palette Preview */}
                <div className="flex -space-x-1">
                  {t.color_palette?.slice(0, 3).map((color, i) => (
                    <div 
                      key={i} 
                      className="h-4 w-4 rounded-full border-2 border-white shadow-sm" 
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${t.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                  {t.is_active ? 'PUBLISHED' : 'DRAFT'}
                </span>
                <Link 
                  href={`/dashboard/admin/templates/${t.id}`}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Edit Detail →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Sub-component Badge untuk status compile
function StatusBadge({ status }) {
  const configs = {
    compiled: { icon: <CheckCircle2 size={12} />, class: "bg-emerald-500 text-white", label: "Ready" },
    pending:  { icon: <Clock size={12} />,        class: "bg-amber-500 text-white",  label: "Queued" },
    parsing:  { icon: <Loader2 size={12} className="animate-spin" />, class: "bg-blue-500 text-white", label: "Parsing" },
    failed:   { icon: <AlertCircle size={12} />,  class: "bg-red-500 text-white",   label: "Error" },
  };

  const config = configs[status] || configs.pending;
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${config.class}`}>
      {config.icon} {config.label}
    </div>
  );
}