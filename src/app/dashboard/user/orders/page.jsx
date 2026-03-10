"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  Loader2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Receipt, 
  Users, 
  Crown, 
  ExternalLink,
  Package
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function OrdersContent() {
  const { user } = useAuth();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      const { data } = await supabase.from("orders").select("*, invitations(id, slug, is_published)").eq("user_id", user.id).order("created_at", { ascending: false });
      if (data) setOrders(data);
      setLoading(false);
    };
    fetchOrders();
  }, [user, supabase]);

  const renderStatus = (status) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100"><Clock className="w-3 h-3" /> Pending</span>;
      case "verified":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100"><CheckCircle2 className="w-3 h-3" /> Lunas</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100"><XCircle className="w-3 h-3" /> Ditolak</span>;
      default: return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pesanan Saya</h1>

      {isSuccess && (
        <div className="p-5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-[1.5rem] flex items-start gap-4 animate-in zoom-in duration-300">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-600 shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
          <div>
            <h3 className="font-black uppercase text-[10px] tracking-widest">Pembayaran Dikirim!</h3>
            <p className="text-xs mt-1 font-medium opacity-80">Admin akan segera memverifikasi pesanan Anda.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col justify-center items-center py-32 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Memuat...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
          <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900">Belum ada pesanan</h3>
          <Link href="/dashboard/user/checkout/plans" className="inline-block mt-6 px-8 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Lihat Paket</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 flex flex-col md:flex-row md:items-center gap-8 hover:shadow-2xl hover:shadow-gray-100 transition-all group">
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 ${order.plan_type === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {order.plan_type === 'premium' ? <Crown className="w-3 h-3" /> : <Package className="w-3 h-3" />} {order.plan_type}
                  </div>
                  {renderStatus(order.status)}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Rp {order.amount.toLocaleString("id-ID")}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(order.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5" /> #{order.id.split('-')[0]}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 min-w-[220px]">
                {order.status === "verified" ? (
                  <>
                    <Link href={`/dashboard/user/builder?order=${order.id}`} className={`flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${order.invitations?.length > 0 ? "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-100" : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100"}`}>
                      {order.invitations?.length > 0 ? "Edit Undangan" : "Mulai Buat Undangan"} <ArrowRight className="w-4 h-4" />
                    </Link>
                    <div className="flex gap-2">
                      {order.invitations?.length > 0 && order.plan_type === "premium" && (
                        <Link href={`/dashboard/user/builder/guests?id=${order.invitations[0].id}`} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[9px] font-black uppercase tracking-widest bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"><Users className="w-3.5 h-3.5" /> Tamu</Link>
                      )}
                      {order.invitations?.[0]?.is_published && (
                        <Link href={`/${order.invitations[0].slug}`} target="_blank" className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[9px] font-black uppercase tracking-widest bg-gray-900 text-white hover:bg-gray-800 shadow-lg"><ExternalLink className="w-3.5 h-3.5" /> Live</Link>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center font-black text-[10px] text-gray-400 uppercase tracking-widest">Menunggu Verifikasi</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <OrdersContent />
    </Suspense>
  );
}
