"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import AccessDenied from "@/components/ui/AccessDenied";
import { Save, ArrowLeft, Eye, Palette, Type, Layout as LayoutIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewTemplatePage() {
  const { profile, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    base_layout: "classic-01",
    is_premium: false,
    config: {
      primary_color: "#bfa37c",
      secondary_color: "#ffffff",
      font_title: "Playfair Display",
      font_body: "Inter",
      bg_image: "https://images.unsplash.com/photo-1519741497674-611481863552",
      animation: "fade-up"
    }
  });

  const handleConfigChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      config: { ...prev.config, [key]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("templates")
      .insert({
        name: formData.name,
        base_layout: formData.base_layout,
        is_premium: formData.is_premium,
        config: formData.config
      });

    if (!error) {
      router.push("/dashboard/admin");
      router.refresh();
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  if (authLoading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;
  if (profile?.role !== "admin") return <AccessDenied />;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/admin" className="text-sm text-gray-500 flex items-center gap-2 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </Link>
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* --- LEFT: FORM CONFIGURATION --- */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
              <LayoutIcon className="w-5 h-5 text-blue-500" /> Informasi Dasar
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Nama Template</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full mt-1 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Royal Gold Wedding"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Base Layout</label>
                <select 
                  value={formData.base_layout}
                  onChange={(e) => setFormData({...formData, base_layout: e.target.value})}
                  className="w-full mt-1 p-2 border rounded-lg outline-none"
                >
                  <option value="classic-01">Classic 01</option>
                  <option value="modern-01">Modern 01</option>
                  <option value="minimalist-01">Minimalist 01</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.is_premium}
                    onChange={(e) => setFormData({...formData, is_premium: e.target.checked})}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-sm font-medium">Template Premium?</span>
                </label>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
              <Palette className="w-5 h-5 text-pink-500" /> Vibe & Colors
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Warna Utama</label>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="color" 
                    value={formData.config.primary_color}
                    onChange={(e) => handleConfigChange("primary_color", e.target.value)}
                    className="h-10 w-12 rounded cursor-pointer border-none"
                  />
                  <span className="text-sm font-mono">{formData.config.primary_color}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Warna Background</label>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="color" 
                    value={formData.config.secondary_color}
                    onChange={(e) => handleConfigChange("secondary_color", e.target.value)}
                    className="h-10 w-12 rounded cursor-pointer border-none"
                  />
                  <span className="text-sm font-mono">{formData.config.secondary_color}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
              <Type className="w-5 h-5 text-purple-500" /> Typography
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Font Judul</label>
                <select 
                  value={formData.config.font_title}
                  onChange={(e) => handleConfigChange("font_title", e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg outline-none"
                >
                  <option value="Playfair Display">Playfair Display (Serif)</option>
                  <option value="Cinzel">Cinzel (Elegant)</option>
                  <option value="Great Vibes">Great Vibes (Script)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Font Body</label>
                <select 
                  value={formData.config.font_body}
                  onChange={(e) => handleConfigChange("font_body", e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg outline-none"
                >
                  <option value="Inter">Inter (Sans)</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Roboto">Roboto</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* --- RIGHT: REAL-TIME PREVIEW MOCKUP --- */}
        <div className="sticky top-6 h-fit">
          <h2 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4" /> Live Preview Simulation
          </h2>
          <div 
            className="w-full aspect-[9/16] max-w-[350px] mx-auto rounded-[3rem] border-[8px] border-gray-900 shadow-2xl overflow-hidden relative"
            style={{ backgroundColor: formData.config.secondary_color }}
          >
            {/* Background Image Sim */}
            <div className="absolute inset-0 opacity-30 bg-cover bg-center" style={{ backgroundImage: `url(${formData.config.bg_image})` }}></div>
            
            <div className="relative h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div 
                className="text-4xl" 
                style={{ 
                  color: formData.config.primary_color, 
                  fontFamily: formData.config.font_title 
                }}
              >
                Budi & Siti
              </div>
              <div className="w-12 h-[2px]" style={{ backgroundColor: formData.config.primary_color }}></div>
              <p 
                className="text-sm text-gray-600" 
                style={{ fontFamily: formData.config.font_body }}
              >
                Kami mengundang Anda untuk merayakan hari kebahagiaan kami.
              </p>
              <button 
                className="px-6 py-2 rounded-full text-white text-xs font-bold uppercase tracking-widest"
                style={{ backgroundColor: formData.config.primary_color }}
              >
                Buka Undangan
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4 italic">
            * Preview ini adalah simulasi. Layout asli bergantung pada file Base Layout.
          </p>
        </div>
      </div>
    </div>
  );
}