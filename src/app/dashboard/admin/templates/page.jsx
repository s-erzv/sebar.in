"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import AccessDenied from "@/components/ui/AccessDenied";
import { Palette, Plus, Layout, Loader2 } from "lucide-react";
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
    const { data } = await supabase.from("templates").select("*").order("created_at", { ascending: false });
    setTemplates(data || []);
    setLoading(false);
  };

  if (authLoading || loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (profile?.role !== "admin") return <AccessDenied />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-100 rounded-lg text-pink-600"><Palette size={24} /></div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Kelola Template</h1>
            <p className="text-sm text-gray-500">{templates.length} Desain Aktif</p>
          </div>
        </div>
        <Link href="/dashboard/admin/templates/new" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
          <Plus size={18} /> Tambah Desain
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm group">
            <div className="aspect-video bg-gray-100 relative overflow-hidden flex items-center justify-center">
               <Layout className="text-gray-300" size={48} />
               <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors" />
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{t.name}</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{t.base_layout}</p>
              </div>
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full border border-gray-100 shadow-sm" style={{ backgroundColor: t.config.primary_color }} title="Primary Color" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}