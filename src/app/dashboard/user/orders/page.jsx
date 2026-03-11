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
  Edit3,
  Eye,
  FileText
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "verified": 
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-green-50 text-green-600 border border-green-100">
            <CheckCircle2 size={12} /> Terverifikasi
          </div>
        );
      case "rejected": 
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-600 border border-red-100">
            <XCircle size={12} /> Ditolak
          </div>
        );
      default: 
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-600 border border-amber-100">
            <Clock size={12} /> Menunggu
          </div>
        );
    }
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 md:px-6 space-y-8 text-gray-800 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pesanan Saya</h1>
          <p className="text-sm text-gray-500">Kelola paket dan mulai buat undangan Anda di sini.</p>
        </div>
        <Link href="/dashboard/user/checkout/plans" className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-sm">
          <Plus size={18} /> Beli Paket Baru
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400 italic shadow-sm">
          Belum ada riwayat pesanan. Silakan beli paket terlebih dahulu.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => {
            const hasInvitation = order.invitations && order.invitations.length > 0;
            const invitation = hasInvitation ? order.invitations[0] : null;

            return (
              <div key={order.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {new Date(order.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                  </span>
                  {getStatusBadge(order.status)}
                </div>

                <div className="p-5 flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 capitalize">{order.plan_type}</h3>
                      <p className="text-sm font-medium text-blue-600">Rp {order.amount.toLocaleString("id-ID")}</p>
                    </div>
                    <div className={`p-2 rounded-xl ${order.plan_type === 'premium' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                      {order.plan_type === 'premium' ? <Crown size={20} /> : <CreditCard size={20} />}
                    </div>
                  </div>

                  {hasInvitation && (
                    <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between group">
                      <div className="overflow-hidden">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Slug Aktif</p>
                        <p className="text-xs font-semibold text-gray-700 truncate">sebar.in/{invitation.slug}</p>
                      </div>
                      <a href={`/${invitation.slug}`} target="_blank" className="p-2 text-gray-400 hover:text-blue-600 transition-colors bg-white rounded-lg shadow-sm border border-gray-100">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {order.payment_proof_url && (
                      <a 
                        href={order.payment_proof_url} 
                        target="_blank" 
                        title="Lihat Bukti Bayar"
                        className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200"
                      >
                        <FileText size={18} />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === 'verified' && (
                      <>
                        {hasInvitation && (
                          <Link 
                            href={`/${invitation.slug}`} 
                            target="_blank"
                            title="Preview Undangan"
                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-blue-100 bg-white shadow-sm"
                          >
                            <Eye size={18} />
                          </Link>
                        )}
                        <Link 
                          href={`/dashboard/user/builder?order=${order.id}`}
                          title={hasInvitation ? "Edit Undangan" : "Buat Undangan"}
                          className="p-2.5 bg-gray-900 text-white hover:bg-black rounded-xl transition-all shadow-lg shadow-gray-200"
                        >
                          {hasInvitation ? <Edit3 size={18} /> : <Plus size={18} />}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!orders.some(o => o.status === 'verified') && orders.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-start gap-4 animate-in fade-in duration-500">
          <div className="w-12 h-12 bg-white text-amber-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-amber-100">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">Pembayaran Dalam Proses</h3>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Pesanan Anda sedang dalam antrean verifikasi manual. Ikon <b>Edit/Tambah</b> akan muncul otomatis segera setelah dikonfirmasi oleh Admin (biasanya 15-30 menit).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Crown({ size }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}