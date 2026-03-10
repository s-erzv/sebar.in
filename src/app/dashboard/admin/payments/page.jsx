"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import AccessDenied from "@/components/ui/AccessDenied";
import { Loader2, CheckCircle2, XCircle, Clock, ExternalLink, ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    if (profile?.role === "admin") fetchOrders();
  }, [profile]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select(`*, profiles:user_id (full_name)`)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    setActionId(id);
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    }
    setActionId(null);
  };

  if (authLoading || loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (profile?.role !== "admin") return <AccessDenied />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><ReceiptText size={24} /></div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Validasi Pembayaran</h1>
          <p className="text-sm text-gray-500">Total {orders.length} transaksi masuk</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <tr>
              <th className="p-4">Customer</th>
              <th className="p-4">Paket</th>
              <th className="p-4 text-center">Bukti</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold text-gray-900">{order.profiles?.full_name}</td>
                <td className="p-4"><span className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-black uppercase">{order.plan_type}</span></td>
                <td className="p-4 text-center">
                  <a href={order.payment_proof_url} target="_blank" className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline">
                    View <ExternalLink size={14} />
                  </a>
                </td>
                <td className="p-4 text-center">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-black uppercase",
                    order.status === 'pending' ? "bg-amber-100 text-amber-700" : order.status === 'verified' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {order.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => updateStatus(order.id, 'verified')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle2 size={18} /></button>
                      <button onClick={() => updateStatus(order.id, 'rejected')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><XCircle size={18} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}