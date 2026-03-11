// src/app/dashboard/user/checkout/page.jsx
"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Upload, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Wallet } from "lucide-react";
import Link from "next/link";

const PLAN_DETAILS = {
  standard: { name: "Standard", price: 150000 },
  premium: { name: "Premium", price: 350000 },
  custom: { name: "Custom / Private", price: 0 }, // 0 means manual input
};

function CheckoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const planId = searchParams.get("plan") || "standard";
  const selectedPlan = PLAN_DETAILS[planId] || PLAN_DETAILS.standard;

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customAmount, setCustomAmount] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) {
      setError("File harus berupa gambar (JPG/PNG).");
      return;
    }
    if (selectedFile.size > 2 * 1024 * 1024) {
      setError("Ukuran file maksimal 2MB.");
      return;
    }
    setError(null);
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Harap upload bukti pembayaran terlebih dahulu.");
      return;
    }

    let finalAmount = selectedPlan.price;
    if (planId === "custom") {
      finalAmount = parseInt(customAmount);
      if (isNaN(finalAmount) || finalAmount <= 0) {
        setError("Harap masukkan nominal pembayaran yang valid sesuai kesepakatan.");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `transfers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          plan_type: planId,
          amount: finalAmount,
          payment_proof_url: publicUrl,
          status: 'pending'
        });

      if (insertError) throw insertError;

      router.push("/dashboard/user/orders?success=true");
      
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat mengunggah. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 text-gray-800">
      <Link href="/dashboard/user/checkout/plans" className="inline-flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-gray-900 mb-8 transition-all">
        <ArrowLeft className="w-3 h-3" /> KEMBALI PILIH PAKET
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Pembayaran Undangan</h1>
            <p className="text-gray-500 text-sm mt-1">Konfirmasi pembayaran untuk aktivasi paket Anda.</p>
          </div>
          <div className="bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 text-right min-w-[200px]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Paket Dipilih</p>
            <p className="text-sm font-bold text-gray-900">{selectedPlan.name}</p>
            {planId !== "custom" && (
              <p className="text-xl font-bold text-blue-600 mt-1">
                Rp {selectedPlan.price.toLocaleString("id-ID")}
              </p>
            )}
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Metode Transfer
              </h3>
              <div className="p-6 rounded-2xl border border-blue-100 bg-blue-50/50 space-y-4">
                <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                  <span className="text-xs text-blue-800 font-medium">Bank BCA</span>
                  <span className="font-bold text-blue-900">123-456-7890</span>
                </div>
                <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                  <span className="text-xs text-blue-800 font-medium">Bank Mandiri</span>
                  <span className="font-bold text-blue-900">098-765-4321</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-800 font-medium">Atas Nama</span>
                  <span className="font-bold text-blue-900 uppercase">PT Sebarin Digital</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
               <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Penting:</h3>
               <ul className="text-xs text-gray-500 space-y-2 leading-relaxed list-disc pl-4">
                 <li>Gunakan nominal yang tepat (termasuk kode unik jika ada).</li>
                 <li>Simpan bukti transfer dalam format JPG/PNG.</li>
                 <li>Proses verifikasi manual memakan waktu 15-60 menit.</li>
               </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {planId === "custom" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                  <Wallet size={14} className="text-purple-500" /> Nominal Kesepakatan
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Rp</span>
                  <input 
                    type="number"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    placeholder="Contoh: 1000000"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-purple-400"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-400 italic">Masukkan nominal sesuai yang disepakati dengan Admin via WhatsApp.</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Upload Bukti Pembayaran</label>
              <label 
                htmlFor="proof-upload" 
                className="flex flex-col items-center justify-center w-full h-56 border-2 border-gray-200 border-dashed rounded-3xl cursor-pointer bg-gray-50 hover:bg-white hover:border-blue-400 transition-all overflow-hidden relative shadow-inner"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                      <Upload className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Pilih Foto Bukti</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG atau PDF (Maks. 2MB)</p>
                  </div>
                )}
                <input id="proof-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[11px] font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full flex justify-center items-center gap-2 py-4 rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-40"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              KONFIRMASI PEMBAYARAN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>}>
      <CheckoutForm />
    </Suspense>
  );
}