"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import AccessDenied from "@/components/ui/AccessDenied";
import { 
  Loader2, Search, Globe, User, 
  Calendar, Eye, Edit3, ExternalLink,
  CheckCircle2, Clock
} from "lucide-react";
import Link from "next/link";

export default function AdminInvitationsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (profile?.role === "admin") fetchInvitations();
  }, [profile]);

  const fetchInvitations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("invitations")
      .select(`
        *,
        profiles:user_id (full_name, whatsapp_number),
        templates:template_id (name)
      `)
      .order("created_at", { ascending: false });
    
    if (!error) setInvitations(data || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return invitations.filter(inv => 
      inv.slug.toLowerCase().includes(searchQuery.toLowerCase()) || 
      inv.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [invitations, searchQuery]);

  if (authLoading || loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;
  if (profile?.role !== "admin") return <AccessDenied />;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 md:px-6 space-y-6 text-gray-800 pb-20">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Semua Undangan</h1>
        <p className="text-sm text-gray-500">Lihat dan bantu edit undangan milik pelanggan Anda.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input 
          type="text"
          placeholder="Cari slug atau nama pemilik..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-all bg-white"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-medium">
                <th className="px-6 py-4 border-b border-gray-100">Undangan & Pemilik</th>
                <th className="px-6 py-4 border-b border-gray-100">Template</th>
                <th className="px-6 py-4 border-b border-gray-100">Status</th>
                <th className="px-6 py-4 border-b border-gray-100">Statistik</th>
                <th className="px-6 py-4 border-b border-gray-100 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">Tidak ada undangan ditemukan.</td></tr>
              ) : (
                filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                          {inv.slug} <a href={`/${inv.slug}`} target="_blank" className="text-gray-300 hover:text-blue-500"><ExternalLink size={12} /></a>
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 uppercase tracking-tighter">
                          <User size={10} /> {inv.profiles?.full_name || "Anonim"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">{inv.templates?.name || "No Template"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${inv.is_published ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                        {inv.is_published ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                        {inv.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5 text-[11px] text-gray-500">
                        <span>👁️ {inv.view_count || 0} views</span>
                        <span>📅 {new Date(inv.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/dashboard/user/builder?id=${inv.id}&admin=true`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-all"
                        >
                          <Edit3 size={12} /> Bantu Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}