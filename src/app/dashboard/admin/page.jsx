// src/app/dashboard/admin/page.jsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import AccessDenied from "@/components/ui/AccessDenied";
import { 
  Loader2, CheckCircle2, XCircle, Clock, 
  ExternalLink, Search, TrendingUp, Users, 
  CreditCard, Layout, Filter, CheckCircle, AlertCircle
} from "lucide-react";

export default function AdminDashboard() {
  const { profile, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeInvitations: 0,
    mostUsedTemplate: "Loading..."
  });
  const [isFetching, setIsFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (authLoading || profile?.role !== "admin") return;

    const fetchData = async () => {
      setIsFetching(true);
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`*, profiles:user_id (full_name)`)
        .order("created_at", { ascending: false });

      if (ordersData) setOrders(ordersData);

      const { count: invCount } = await supabase
        .from("invitations")
        .select("*", { count: 'exact', head: true })
        .eq("is_published", true);

      const verifiedOrders = ordersData?.filter(o => o.status === 'verified') || [];
      const revenue = verifiedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

      const { data: popularData } = await supabase
        .from("invitations")
        .select("template_id, templates(name)");
      
      const templateCounts = {};
      popularData?.forEach(inv => {
        const name = inv.templates?.name || "Unknown";
        templateCounts[name] = (templateCounts[name] || 0) + 1;
      });
      
      const mostUsed = Object.entries(templateCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "None";

      setStats({
        totalOrders: ordersData?.length || 0,
        totalRevenue: revenue,
        activeInvitations: invCount || 0,
        mostUsedTemplate: mostUsed
      });

      setIsFetching(false);
    };

    fetchData();
  }, [authLoading, profile, supabase]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const name = o.profiles?.full_name?.toLowerCase() || "";
      const id = o.id.toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || id.includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setActionLoading(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
    setActionLoading(null);
  };

  if (authLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;
  if (profile?.role !== "admin") return <AccessDenied />;

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6 text-gray-800">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Ringkasan aktivitas sistem dan validasi pembayaran.</p>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pendapatan" value={`Rp ${stats.totalRevenue.toLocaleString("id-ID")}`} sub="Selama ini" />
        <StatCard label="Total Pesanan" value={stats.totalOrders} sub={`${orders.filter(o => o.status === 'pending').length} pending`} />
        <StatCard label="Undangan Aktif" value={stats.activeInvitations} sub="Terpublikasi" />
        <StatCard label="Template Populer" value={stats.mostUsedTemplate} sub="Paling sering dipilih" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4">
           <h2 className="text-lg font-medium">Validasi Pembayaran</h2>
           <div className="flex items-center gap-2">
             <div className="relative flex-1 md:flex-none">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input 
                 type="text" 
                 placeholder="Cari pelanggan..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 w-full md:w-48 transition-all"
               />
             </div>
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
             >
               <option value="all">Semua Status</option>
               <option value="pending">Pending</option>
               <option value="verified">Verified</option>
               <option value="rejected">Rejected</option>
             </select>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-medium">
                <th className="px-6 py-3 border-b border-gray-100">ID & Tanggal</th>
                <th className="px-6 py-3 border-b border-gray-100">Pelanggan</th>
                <th className="px-6 py-3 border-b border-gray-100">Paket & Nominal</th>
                <th className="px-6 py-3 border-b border-gray-100 text-center">Bukti</th>
                <th className="px-6 py-3 border-b border-gray-100 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                 <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">Memuat data...</td></tr>
              ) : filteredOrders.length === 0 ? (
                 <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">Tidak ada transaksi ditemukan</td></tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">#{order.id.split('-')[0].toUpperCase()}</div>
                      <div className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">{order.profiles?.full_name || "Anonymous"}</td>
                    <td className="px-6 py-4">
                       <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mr-2 ${
                         order.plan_type === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                       }`}>{order.plan_type}</span>
                       Rp {order.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-center">
                       {order.payment_proof_url ? (
                         <a href={order.payment_proof_url} target="_blank" className="text-blue-500 hover:underline inline-flex items-center gap-1">
                           <ExternalLink size={14} /> Lihat
                         </a>
                       ) : <span className="text-gray-300">N/A</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                       {order.status === 'pending' ? (
                         <div className="flex items-center justify-end gap-2">
                           <button onClick={() => handleUpdateStatus(order.id, 'verified')} className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs hover:bg-gray-800">Terima</button>
                           <button onClick={() => handleUpdateStatus(order.id, 'rejected')} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50">Tolak</button>
                         </div>
                       ) : (
                          <span className={`text-xs font-medium ${order.status === 'verified' ? 'text-green-600' : 'text-red-500'}`}>
                             {order.status === 'verified' ? 'Diterima' : 'Ditolak'}
                          </span>
                       )}
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

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <h3 className="text-xl font-semibold text-gray-900">{value}</h3>
      <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
    </div>
  );
}