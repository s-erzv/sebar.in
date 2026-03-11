"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  Loader2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  CreditCard,
  Plus,
  ArrowRight,
  Edit3
} from "lucide-react";
import Link from "next/link";

export default function UserOrdersPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    // Ambil order sekaligus cek apakah sudah ada undangan terkait
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        invitations (id, slug)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (data) setOrders(data);
    setLoading(false);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "verified": return "bg-green-50 text-green-600 border-green-100";
      case "rejected": return "bg-red-50 text-red-600 border-red-100";
      default: return "bg-amber-50 text-amber-600 border-amber-100";
    }
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 md:px-6 space-y-8 text-gray-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pesanan Saya</h1>
          <p className="text-sm text-gray-500">Kelola paket dan mulai buat undangan Anda di sini.</p>
        </div>
        <Link href="/dashboard/user/checkout/plans" className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-sm">
          <Plus size={18} /> Beli Paket Baru
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-medium">
                <th className="px-6 py-4 border-b border-gray-100">Tanggal Pesanan</th>
                <th className="px-6 py-4 border-b border-gray-100">Paket & Nominal</th>
                <th className="px-6 py-4 border-b border-gray-100">Status</th>
                <th className="px-6 py-4 border-b border-gray-100 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">Belum ada riwayat pesanan. Silakan beli paket terlebih dahulu.</td>
                </tr>
              ) : (
                orders.map(order => {
                  const hasInvitation = order.invitations && order.invitations.length > 0;
                  const invitation = hasInvitation ? order.invitations[0] : null;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-medium">
                          {new Date(order.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="capitalize font-semibold text-gray-700">{order.plan_type}</span>
                          <span className="text-xs text-gray-500">Rp {order.amount.toLocaleString("id-ID")}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusStyle(order.status)}`}>
                          {order.status === 'verified' ? <CheckCircle2 size={10} /> : order.status === 'rejected' ? <XCircle size={10} /> : <Clock size={10} />}
                          {order.status === 'verified' ? 'Terverifikasi' : order.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {order.status === 'verified' && (
                            <Link 
                              href={`/dashboard/user/builder?order=${order.id}`}
                              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-gray-800 transition-all shadow-md shadow-gray-100"
                            >
                              {hasInvitation ? <><Edit3 size={12} /> Edit Undangan</> : <><Plus size={12} /> Buat Undangan</>}
                            </Link>
                          )}
                          
                          {order.payment_proof_url && (
                            <a href={order.payment_proof_url} target="_blank" className="p-2 text-gray-400 hover:text-gray-900 transition-colors" title="Lihat Bukti Bayar">
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!orders.some(o => o.status === 'verified') && orders.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-900">Menunggu Verifikasi</h3>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Pesanan Anda sedang dalam antrean verifikasi. Tombol <b>"Buat Undangan"</b> akan muncul otomatis di sini segera setelah pembayaran Anda dikonfirmasi oleh Admin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}