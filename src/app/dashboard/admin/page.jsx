// src/app/dashboard/admin/page.jsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import AccessDenied from "@/components/ui/AccessDenied";
import { 
  Loader2, CheckCircle2, XCircle, Clock, 
  ExternalLink, Search 
} from "lucide-react";

export default function AdminDashboard() {
  const { profile, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  
  const [orders, setOrders] = useState([]);
  const [isFetchingOrders, setIsFetchingOrders] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (authLoading || profile?.role !== "admin") return;

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data);
      } else if (error) {
        console.error("Error fetching orders:", error.message);
      }
      setIsFetchingOrders(false);
    };

    fetchOrders();
  }, [authLoading, profile, supabase]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setActionLoading(orderId);
    
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (!error) {
      setOrders((prevOrders) => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } else {
      alert("Gagal mengupdate status: " + error.message);
    }
    
    setActionLoading(null);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" /> Pending</span>;
      case "verified":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"><CheckCircle2 className="w-3 h-3" /> Terverifikasi</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"><XCircle className="w-3 h-3" /> Ditolak</span>;
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return <AccessDenied fallbackUrl="/dashboard/user" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validasi Pembayaran</h1>
          <p className="mt-1 text-gray-500">Periksa bukti transfer dan aktifkan paket pengguna.</p>
        </div>
        
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari pesanan..." 
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64 outline-none transition-shadow"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 text-xs uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">ID & Tanggal</th>
                <th className="px-6 py-4">Pelanggan</th>
                <th className="px-6 py-4">Paket</th>
                <th className="px-6 py-4">Bukti Transfer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi Verifikasi</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-200">
              {isFetchingOrders ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                    <p className="text-gray-500 mt-2">Memuat data pesanan...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    Belum ada data pesanan yang masuk.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-gray-900 font-medium">{order.id.split('-')[0]}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {order.profiles?.full_name || "User Anonim"}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="uppercase font-bold text-xs text-blue-600 tracking-wider mb-1">
                        {order.plan_type}
                      </div>
                      <div className="font-medium text-gray-900">
                        Rp {order.amount.toLocaleString("id-ID")}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      {order.payment_proof_url ? (
                        <a 
                          href={order.payment_proof_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          Lihat Bukti <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Belum Upload</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(order.status)}
                    </td>
                    
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {order.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdateStatus(order.id, "verified")}
                            disabled={actionLoading === order.id}
                            className="p-2 bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Setujui Pembayaran"
                          >
                            {actionLoading === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          
                          <button
                            onClick={() => handleUpdateStatus(order.id, "rejected")}
                            disabled={actionLoading === order.id}
                            className="p-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Tolak Pembayaran"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Selesai Diproses</span>
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