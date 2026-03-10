"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { 
  Sparkles, 
  CreditCard, 
  Globe, 
  Users, 
  ArrowRight, 
  Layout,
  MessageSquare,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UserDashboard() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [stats, setStats] = useState({ orders: 0, published: 0, views: 0, totalGuests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return;
      try {
        const { count: orderCount } = await supabase.from("orders").select("*", { count: "exact", head: true }).eq("user_id", profile.id);
        const { data: invs } = await supabase.from("invitations").select("id, view_count, is_published").eq("user_id", profile.id);
        const publishedCount = invs?.filter(i => i.is_published).length || 0;
        const totalViews = invs?.reduce((acc, curr) => acc + (curr.view_count || 0), 0) || 0;
        const invIds = invs?.map(i => i.id) || [];
        let guestsCount = 0;
        if (invIds.length > 0) {
          const { count } = await supabase.from("guests").select("*", { count: "exact", head: true }).in("invitation_id", invIds);
          guestsCount = count || 0;
        }
        setStats({ orders: orderCount || 0, published: publishedCount, views: totalViews, totalGuests: guestsCount });
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchStats();
  }, [profile, supabase]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="relative overflow-hidden bg-gray-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
              <Sparkles className="w-3 h-3" /> Dashboard Pelanggan
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Halo, {profile?.full_name?.split(' ')[0] || "User"}! <br/>
              <span className="text-gray-400">Siap sebarkan kebahagiaan?</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/user/checkout/plans" className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 group">
              Beli Paket Baru <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            </Link>
            <Link href="/dashboard/user/orders" className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2">
              Pesanan Saya
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Pesanan", value: stats.orders, icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Published", value: stats.published, icon: Globe, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Pengunjung", value: stats.views, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Tamu", value: stats.totalGuests, icon: MessageSquare, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all group">
            <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300`}>
              <item.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{loading ? "..." : item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Langkah Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/dashboard/user/orders" className="group relative p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:border-blue-200 transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><Layout className="w-5 h-5" /></div>
                  <h3 className="font-bold text-gray-900">Buat Undangan Baru</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Pilih template dan kustomisasi sesuai keinginanmu.</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
              </div>
            </Link>
            <Link href="/dashboard/user/settings" className="group relative p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:border-purple-200 transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors"><Users className="w-5 h-5" /></div>
                  <h3 className="font-bold text-gray-900">Lengkapi Profil</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Pastikan nomor WhatsApp aktif untuk notifikasi.</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-purple-600 transition-colors" />
              </div>
            </Link>
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Bantuan</h2>
          <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-100 space-y-4">
            <h3 className="font-bold text-lg leading-tight">Ada kendala?</h3>
            <p className="text-blue-100 text-xs leading-relaxed">Tim support kami siap membantu proses verifikasi pembayaran.</p>
            <button className="w-full py-3 bg-white text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-colors">Hubungi CS via WA</button>
          </div>
        </div>
      </div>
    </div>
  );
}
