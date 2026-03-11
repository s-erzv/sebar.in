"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { 
  CreditCard, 
  Globe, 
  Users, 
  Layout,
  MessageSquare,
  Plus,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UserDashboard() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const [stats, setStats] = useState({ orders: 0, published: 0, views: 0, totalGuests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Gunakan user.id karena profile.id mungkin tidak ada saat inisialisasi metadata
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // 1. Hitung total pesanan user
        const { count: orderCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // 2. Ambil data undangan untuk hitung publikasi dan views
        const { data: invs } = await supabase
          .from("invitations")
          .select("id, view_count, is_published")
          .eq("user_id", user.id);

        const publishedCount = invs?.filter(i => i.is_published).length || 0;
        const totalViews = invs?.reduce((acc, curr) => acc + (curr.view_count || 0), 0) || 0;
        const invIds = invs?.map(i => i.id) || [];

        // 3. Hitung total tamu dari semua undangan yang dimiliki
        let guestsCount = 0;
        if (invIds.length > 0) {
          const { count } = await supabase
            .from("guests")
            .select("*", { count: "exact", head: true })
            .in("invitation_id", invIds);
          guestsCount = count || 0;
        }

        setStats({ 
          orders: orderCount || 0, 
          published: publishedCount, 
          views: totalViews, 
          totalGuests: guestsCount 
        });
      } catch (err) { 
        console.error("Dashboard Stats Error:", err); 
      } finally { 
        setLoading(false); 
      }
    };

    if (!authLoading) {
      fetchStats();
    }
  }, [user?.id, authLoading, supabase]);

  if (authLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-6 text-gray-800 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Halo, {profile?.full_name?.split(' ')[0] || "User"}</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola undangan digital Anda dengan mudah di Sebar.in.</p>
        </div>
        <Link href="/dashboard/user/checkout/plans" className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-sm">
          <Plus size={18} /> Buat Undangan
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pesanan" value={stats.orders} icon={<CreditCard size={18} />} loading={loading} />
        <StatCard label="Undangan Aktif" value={stats.published} icon={<Globe size={18} />} loading={loading} />
        <StatCard label="Total Pengunjung" value={stats.views} icon={<Users size={18} />} loading={loading} />
        <StatCard label="Daftar Tamu" value={stats.totalGuests} icon={<MessageSquare size={18} />} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Akses Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickActionCard 
              href="/dashboard/user/templates"
              icon={<Layout size={20} className="text-blue-600" />}
              title="Katalog Desain"
              desc="Lihat dan pilih tema undangan."
            />
            <QuickActionCard 
              href="/dashboard/user/orders"
              icon={<CreditCard size={20} className="text-emerald-600" />}
              title="Status Bayar"
              desc="Cek verifikasi pesanan."
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Bantuan</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <HelpCircle size={20} />
              </div>
              <p className="font-medium">Butuh bantuan?</p>
            </div>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">Hubungi CS kami jika ada kendala pembayaran atau teknis.</p>
            <button className="w-full py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
              WhatsApp CS <ExternalLink size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, loading }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
        <h3 className="text-xl font-semibold text-gray-900">{loading ? "..." : value}</h3>
      </div>
      <div className="text-gray-400">{icon}</div>
    </div>
  );
}

function QuickActionCard({ href, icon, title, desc }) {
  return (
    <Link href={href} className="group p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-400 transition-all flex items-start gap-4">
      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
          {title} <ChevronRight size={14} className="text-gray-300" />
        </h3>
        <p className="text-xs text-gray-500 mt-1">{desc}</p>
      </div>
    </Link>
  );
}