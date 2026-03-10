"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import AccessDenied from "@/components/ui/AccessDenied";
import { 
  Palette, Plus, Layout, Loader2, Crown, 
  CheckCircle2, AlertCircle, Clock, Globe, 
  ShieldCheck, RefreshCw, MoreVertical 
} from "lucide-react";
import Link from "next/link";

export default function AdminTemplatesPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

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

  const handleToggleActive = async (id, currentStatus) => {
    setProcessingId(id);
    const { error } = await supabase
      .from("templates")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (!error) {
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, is_active: !currentStatus } : t));
    } else {
      alert("Gagal update status: " + error.message);
    }
    setProcessingId(null);
  };

  const handleForceCompiled = async (id) => {
    if (!confirm("Paksa status menjadi 'compiled'? Lakukan ini hanya jika file JSX sudah valid.")) return;
    
    setProcessingId(id);
    const { error } = await supabase
      .from("templates")
      .update({ parse_status: 'compiled' })
      .eq("id", id);

    if (!error) {
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, parse_status: 'compiled' } : t));
    }
    setProcessingId(null);
  };

  if (authLoading || loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-gray-900 w-8 h-8" />
    </div>
  );
  
  if (profile?.role !== "admin") return <AccessDenied />;

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gray-900 rounded-2xl text-white shadow-lg">
            <Palette size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Template Engine</h1>
            <p className="text-sm text-gray-500 font-medium">Manage {templates.length} system designs</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <button 
              onClick={fetchTemplates}
              className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <Link href="/dashboard/admin/templates/new" 
              className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-xl hover:bg-gray-800 transition-all active:scale-95">
              <Plus size={20} /> New Design
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group">
            <div className="aspect-[16/10] bg-gray-50 relative overflow-hidden flex items-center justify-center border-b border-gray-50">
               {t.preview_image_url ? (
                 <img src={t.preview_image_url} alt={t.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" />
               ) : (
                 <Layout className="text-gray-200" size={80} />
               )}
               
               <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                 {t.is_premium && (
                   <div className="bg-amber-400 text-amber-950 p-2 rounded-xl shadow-lg border border-amber-300">
                     <Crown size={16} />
                   </div>
                 )}
                 <StatusBadge status={t.parse_status} />
               </div>

               {t.parse_status !== 'compiled' && (
                 <button 
                  onClick={() => handleForceCompiled(t.id)}
                  className="absolute bottom-4 left-4 bg-white/90 backdrop-blur text-[10px] font-bold px-3 py-1.5 rounded-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-gray-600 hover:text-blue-600"
                 >
                   <ShieldCheck size={12} /> Force Compile
                 </button>
               )}
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-xl text-gray-900 tracking-tight leading-none mb-2">{t.name}</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1">
                    <Globe size={10} /> {t.category} / {t.slug}
                  </p>
                </div>
                <div className="flex -space-x-1.5">
                  {t.color_palette?.slice(0, 4).map((color, i) => (
                    <div 
                      key={i} 
                      className="h-5 w-5 rounded-full border-2 border-white shadow-sm" 
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <button
                  disabled={processingId === t.id}
                  onClick={() => handleToggleActive(t.id, t.is_active)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
                    ${t.is_active 
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                  {processingId === t.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : t.is_active ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <Clock size={12} />
                  )}
                  {t.is_active ? 'Published' : 'Draft'}
                </button>

                <div className="flex items-center gap-4">
                  <Link 
                    href={`/dashboard/admin/templates/${t.id}`}
                    className="text-xs font-bold text-gray-900 hover:underline"
                  >
                    Details
                  </Link>
                  <button className="text-gray-400 hover:text-gray-900 transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const configs = {
    compiled: { icon: <CheckCircle2 size={12} />, class: "bg-emerald-500 text-white", label: "Ready" },
    pending:  { icon: <Clock size={12} />,        class: "bg-amber-500 text-white",  label: "Queued" },
    parsing:  { icon: <Loader2 size={12} className="animate-spin" />, class: "bg-blue-500 text-white", label: "Parsing" },
    failed:   { icon: <AlertCircle size={12} />,  class: "bg-red-500 text-white",   label: "Error" },
  };

  const config = configs[status] || configs.pending;
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-lg ${config.class}`}>
      {config.icon} {config.label}
    </div>
  );
}