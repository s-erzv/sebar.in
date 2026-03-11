"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { 
  User, 
  Phone, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  Shield
} from "lucide-react";

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    whatsapp_number: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        whatsapp_number: profile.whatsapp_number || "",
      });
    }
  }, [profile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        whatsapp_number: formData.whatsapp_number,
      })
      .eq("id", user.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Profil berhasil diperbarui!" });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 md:px-6 space-y-8 text-gray-800">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Pengaturan Akun</h1>
        <p className="text-sm text-gray-500">Kelola informasi profil dan kontak Anda.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2 font-medium text-xs text-gray-500 uppercase tracking-widest">
          <User size={14} /> Profil Publik
        </div>
        
        <form onSubmit={handleUpdate} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
                  placeholder="Nama Lengkap"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase">Nomor WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text"
                  value={formData.whatsapp_number}
                  onChange={e => setFormData({...formData, whatsapp_number: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
                  placeholder="081234..."
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 opacity-60">
            <label className="text-xs font-semibold text-gray-500 uppercase">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="email"
                value={user?.email}
                disabled
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] text-gray-400 italic">* Email tidak dapat diubah.</p>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 border ${message.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
              {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {message.text}
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan Perubahan
            </button>
          </div>
        </form>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex items-start gap-4">
        <div className="w-10 h-10 bg-white border border-gray-200 text-gray-400 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
          <Shield size={20} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Keamanan & Notifikasi</h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Pastikan nomor WhatsApp yang Anda masukkan adalah nomor aktif. Kami akan mengirimkan notifikasi status pembayaran dan link undangan melalui nomor tersebut.
          </p>
        </div>
      </div>
    </div>
  );
}