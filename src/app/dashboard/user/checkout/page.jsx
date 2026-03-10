// src/app/dashboard/user/checkout/page.jsx
"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Upload, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Konfigurasi Harga berdasarkan ID Plan
const PLAN_DETAILS = {
  standard: { name: "Standard", price: 150000 },
  premium: { name: "Premium", price: 350000 },
  custom: { name: "Custom", price: 750000 },
};

function CheckoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const planId = searchParams.get("plan") || "standard";
  const selectedPlan = PLAN_DETAILS[planId];

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Validasi file: Hanya gambar dan maksimal 2MB
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

    setLoading(true);
    setError(null);

    try {
      // 1. Generate nama file unik biar tidak bentrok
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `transfers/${fileName}`;

      // 2. Upload ke Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Dapatkan Public URL dari file yang diupload
      const { data: { publicUrl } } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(filePath);

      // 4. Insert data pesanan ke Database
      const { error: insertError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          plan_type: planId,
          amount: selectedPlan.price,
          payment_proof_url: publicUrl,
          status: 'pending' // Menunggu verifikasi admin
        });

      if (insertError) throw insertError;

      // 5. Sukses -> Lempar ke halaman Riwayat Pesanan
      router.push("/dashboard/user/orders?success=true");
      
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat mengunggah. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/dashboard/user" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Pilih Paket
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pembayaran</h1>
            <p className="text-gray-500 text-sm mt-1">Selesaikan pembayaran untuk mulai membuat undangan.</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Paket {selectedPlan.name}</p>
            <p className="text-2xl font-black text-blue-600">
              Rp {selectedPlan.price.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Instruksi Transfer */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" /> Transfer ke:
              </h3>
              <div className="mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50 space-y-3">
                <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                  <span className="text-sm text-blue-800">Bank BCA</span>
                  <span className="font-bold text-blue-900">123-456-7890</span>
                </div>
                <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                  <span className="text-sm text-blue-800">Bank Mandiri</span>
                  <span className="font-bold text-blue-900">098-765-4321</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-800">Atas Nama</span>
                  <span className="font-bold text-blue-900">PT Sebarin Digital</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                * Pastikan nominal transfer sesuai hingga digit terakhir. Verifikasi manual memakan waktu maksimal 15-30 menit jam kerja.
              </p>
            </div>
          </div>

          {/* Form Upload */}
          <form onSubmit={handleSubmit} className="space-y-4 border-t md:border-t-0 md:border-l border-gray-200 md:pl-8">
            <h3 className="text-lg font-semibold text-gray-900">Upload Bukti Bayar</h3>
            
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="mt-2">
              <label 
                htmlFor="proof-upload" 
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden relative"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-gray-400 mb-3" />
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Klik untuk upload</span> atau drag and drop</p>
                    <p className="text-xs text-gray-400">PNG, JPG (Max. 2MB)</p>
                  </div>
                )}
                <input id="proof-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Kirim Bukti Pembayaran"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// WAJIB: Membungkus form dengan