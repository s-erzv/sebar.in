"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Loader2, Save, User, Phone, Mail, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setWhatsapp(profile.whatsapp_number || "");
      setInitLoading(false);
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        whatsapp_number: whatsapp,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      setMessage({ type: "error", text: "Gagal memperbarui profil: " + error.message });
    } else {
      setMessage({ type: "success", text: "Profil berhasil diperbarui!" });
      if (refreshProfile) refreshProfile();
    }
    setLoading(false);
  };

  if (initLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Profil</h1>
        <p className="mt-1 text-gray-500">Kelola informasi kontak dan profil akunmu.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-100">
              {fullName.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-bold text-gray-900">{fullName || "Pengguna"}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Mail className="w-3 h-3" /> {user?.email}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {message.text && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Nama Lengkap
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> Nomor WhatsApp
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Contoh: 08123456789"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono"
              />
              <p className="text-[10px] text-gray-400 italic">Gunakan format angka saja (misal: 0812...)</p>
            </div>

            <div className="space-y-1.5 opacity-50">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Email (Tidak dapat diubah)
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-not-allowed outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50 shadow-lg shadow-gray-200"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
          💡
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          <b>Tips:</b> Pastikan nomor WhatsApp kamu aktif agar admin kami bisa menghubungimu jika terjadi kendala pada pesanan atau verifikasi pembayaran.
        </p>
      </div>
    </div>
  );
}
