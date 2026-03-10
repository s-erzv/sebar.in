"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Loader2, Clock, CheckCircle2, XCircle, ArrowRight, Receipt } from "lucide-react";
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
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          invitations (
            id,
            slug,
            is_published
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [user, supabase]);

  const renderStatus = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-4 h-4" /> Menunggu Verifikasi
          </span>
        );
      case "verified":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="w-4 h-4" /> Lunas / Terverifikasi
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-4 h-4" /> Ditolak
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pesanan Saya</h1>
        <p className="mt-1 text-gray-500">Pantau status pembayaran dan mulai kelola undanganmu di sini.</p>
      </div>

      {isSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold">Bukti Pembayaran Berhasil Dikirim!</h3>
            <p className="text-sm mt-1">Admin kami akan segera memverifikasi pembayaran kamu maksimal dalam 15-30 menit jam kerja.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Belum ada pesanan</h3>
          <p className="text-gray-500 text-sm mt-1 mb-6">Kamu belum melakukan pemesanan paket apapun.</p>
          <Link 
            href="/dashboard/user" 
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Lihat Pilihan Paket
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="uppercase text-xs font-bold tracking-wider text-gray-500">
                    Paket {order.plan_type}
                  </span>
                  {renderStatus(order.status)}
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">ID Pesanan: <span className="font-mono text-gray-900">{order.id.split('-')[0]}</span></p>
                  <p className="text-sm text-gray-500">Tanggal: {new Date(order.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-4 border-t border-gray-100 md:border-t-0 pt-4 md:pt-0">
                <div className="text-left md:text-right">
                  <p className="text-sm text-gray-500">Total Harga</p>
                  <p className="text-xl font-bold text-gray-900">Rp {order.amount.toLocaleString("id-ID")}</p>
                </div>

                {order.status === "verified" ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/dashboard/user/builder?order=${order.id}`}
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all
                        ${order.invitations?.length > 0 
                          ? "bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-100" 
                          : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100"}`}
                    >
                      {order.invitations?.length > 0 ? "Edit Undangan" : "Mulai Buat Undangan"}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    {order.invitations?.[0]?.is_published && (
                      <Link
                        href={`/${order.invitations[0].slug}`}
                        target="_blank"
                        className="text-[10px] text-center font-bold text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
                      >
                        Lihat Live Undangan
                      </Link>
                    )}
                  </div>
                ) : (
                  <button 
                    disabled 
                    className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-400 cursor-not-allowed"
                  >
                    Mulai Buat Undangan
                  </button>
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