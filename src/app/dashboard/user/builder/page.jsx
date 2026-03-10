"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Save, Heart, MapPin, Calendar, 
  Settings, Loader2, Globe, ArrowLeft 
} from "lucide-react";
import Link from "next/link";

function BuilderForm() {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invitationId, setInvitationId] = useState(null);

  const [formData, setFormData] = useState({
    slug: "",
    template_id: "classic-01",
    content: {
      pria: { nama: "", orang_tua: "" },
      wanita: { nama: "", orang_tua: "" },
      acara: {
        tanggal: "",
        jam: "",
        lokasi_nama: "",
        maps_url: "",
      }
    }
  });

  useEffect(() => {
    if (!user || !orderId) return;

    const fetchInvitation = async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("order_id", orderId)
        .single();

      if (data) {
        setInvitationId(data.id);
        setFormData({
          slug: data.slug || "",
          template_id: data.template_id || "classic-01",
          content: data.content || formData.content
        });
      }
      setLoading(false);
    };

    fetchInvitation();
  }, [user, orderId]);

  const handleContentChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [section]: { ...prev.content[section], [field]: value }
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    const payload = {
      user_id: user.id,
      order_id: orderId,
      slug: formData.slug.toLowerCase().replace(/ /g, "-"),
      template_id: formData.template_id,
      content: formData.content,
      is_published: true
    };

    let result;
    if (invitationId) {
      result = await supabase.from("invitations").update(payload).eq("id", invitationId);
    } else {
      result = await supabase.from("invitations").insert(payload);
    }

    if (!result.error) {
      alert("Undangan berhasil disimpan!");
      router.push("/dashboard/user/orders");
    } else {
      alert("Error: " + result.error.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Isi Undangan</h1>
          <p className="text-sm text-gray-500">Lengkapi data acara kamu di bawah ini.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Undangan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          
          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" /> Link Undangan</h2>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Slug URL (sebar.in/nama-kamu)</label>
              <input 
                type="text" 
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                placeholder="misal: budi-siti-wedding"
                className="w-full mt-1 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-pink-600"><Heart className="w-5 h-5" /> Data Mempelai</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="font-bold text-sm border-l-4 border-blue-500 pl-2">Mempelai Pria</p>
                <input 
                  type="text" 
                  placeholder="Nama Lengkap" 
                  value={formData.content.pria.nama}
                  onChange={(e) => handleContentChange("pria", "nama", e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
                <input 
                  type="text" 
                  placeholder="Nama Orang Tua" 
                  value={formData.content.pria.orang_tua}
                  onChange={(e) => handleContentChange("pria", "orang_tua", e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
              </div>
              <div className="space-y-3">
                <p className="font-bold text-sm border-l-4 border-pink-500 pl-2">Mempelai Wanita</p>
                <input 
                  type="text" 
                  placeholder="Nama Lengkap" 
                  value={formData.content.wanita.nama}
                  onChange={(e) => handleContentChange("wanita", "nama", e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
                <input 
                  type="text" 
                  placeholder="Nama Orang Tua" 
                  value={formData.content.wanita.orang_tua}
                  onChange={(e) => handleContentChange("wanita", "orang_tua", e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-amber-600"><Calendar className="w-5 h-5" /> Waktu & Lokasi</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Tanggal Acara</label>
                <input 
                  type="date" 
                  value={formData.content.acara.tanggal}
                  onChange={(e) => handleContentChange("acara", "tanggal", e.target.value)}
                  className="w-full mt-1 p-2.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Jam (WIB)</label>
                <input 
                  type="text" 
                  placeholder="10:00 - Selesai" 
                  value={formData.content.acara.jam}
                  onChange={(e) => handleContentChange("acara", "jam", e.target.value)}
                  className="w-full mt-1 p-2.5 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Nama Lokasi (Gedung/Rumah)</label>
              <input 
                type="text" 
                placeholder="Gedung Serbaguna ABC" 
                value={formData.content.acara.lokasi_nama}
                onChange={(e) => handleContentChange("acara", "lokasi_nama", e.target.value)}
                className="w-full mt-1 p-2.5 border rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Link Google Maps
              </label>
              <input 
                type="text" 
                placeholder="https://goo.gl/maps/..." 
                value={formData.content.acara.maps_url}
                onChange={(e) => handleContentChange("acara", "maps_url", e.target.value)}
                className="w-full mt-1 p-2.5 border rounded-lg font-mono text-xs"
              />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
            <h3 className="font-bold flex items-center gap-2"><Settings className="w-5 h-5" /> Tips Builder</h3>
            <ul className="mt-4 space-y-3 text-sm opacity-90 leading-relaxed">
              <li>• Pastikan slug URL belum digunakan orang lain.</li>
              <li>• Nama orang tua biasanya menggunakan format "Putra dari Bpk. X & Ibu Y".</li>
              <li>• Link Google Maps bisa didapat dari fitur "Share" di aplikasi Google Maps.</li>
            </ul>
          </div>
          
          <div className="p-6 border border-dashed border-gray-300 rounded-2xl text-center">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Preview Preview</p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left space-y-2">
              <p className="text-xs font-bold text-gray-400">JSON Output:</p>
              <pre className="text-[10px] overflow-hidden truncate font-mono text-blue-600">
                {JSON.stringify(formData.content, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<Loader2 className="animate-spin mx-auto mt-20" />}>
      <BuilderForm />
    </Suspense>
  );
}