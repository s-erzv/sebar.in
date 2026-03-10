"use client";

import { useEffect, useState, use, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import AccessDenied from "@/components/ui/AccessDenied";
import { 
  ArrowLeft, Save, Layout, Crown, 
  Code, Palette, Loader2, Globe, 
  Smartphone, Monitor, RefreshCw, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TemplateDetailsPage({ params }) {
  const { id } = use(params);
  const { profile, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const iframeRef = useRef(null);

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState("mobile"); 

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category: "general",
    description: "",
    preview_image_url: "",
    is_premium: false,
    is_active: false,
    tags: [],
    color_palette: [],
    content_schema: "{}",
    default_content: "{}"
  });

  useEffect(() => {
    if (profile?.role === "admin") fetchTemplate();
  }, [profile, id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      syncPreview();
    }, 500); 
    return () => clearTimeout(timer);
  }, [formData.default_content, formData.color_palette]);

  const syncPreview = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const data = {
          type: "UPDATE_PREVIEW",
          content: JSON.parse(formData.default_content),
          palette: formData.color_palette
        };
        iframeRef.current.contentWindow.postMessage(data, "*");
      } catch (e) {
      }
    }
  };

  const fetchTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setTemplate(data);
      setFormData({
        ...data,
        content_schema: JSON.stringify(data.content_schema, null, 2),
        default_content: JSON.stringify(data.default_content, null, 2),
        tags: data.tags || [],
        color_palette: data.color_palette || []
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    setError("");
    try {
      const parsedContent = JSON.parse(formData.content_schema);
      const parsedDefault = JSON.parse(formData.default_content);

      const { error: updateErr } = await supabase
        .from("templates")
        .update({
          ...formData,
          content_schema: parsedContent,
          default_content: parsedDefault,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (updateErr) throw updateErr;
      alert("Changes saved and synced!");
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (profile?.role !== "admin") return <AccessDenied />;

  return (
    <div className="flex flex-col h-screen bg-white font-sans overflow-hidden">
      
      <header className="h-16 border-b border-gray-100 flex items-center justify-between px-6 shrink-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin?tab=templates" className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-gray-900">{template?.name}</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {id.split('-')[0]}... / {template?.category}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl mr-4">
            <button 
              onClick={() => setPreviewMode("mobile")}
              className={`p-1.5 rounded-lg transition-all ${previewMode === "mobile" ? "bg-white shadow-sm text-gray-900" : "text-gray-400"}`}
            >
              <Smartphone size={16} />
            </button>
            <button 
              onClick={() => setPreviewMode("desktop")}
              className={`p-1.5 rounded-lg transition-all ${previewMode === "desktop" ? "bg-white shadow-sm text-gray-900" : "text-gray-400"}`}
            >
              <Monitor size={16} />
            </button>
          </div>
          <button 
            onClick={handleUpdate}
            disabled={saving}
            className="bg-gray-900 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg shadow-gray-900/10"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Saving..." : "Save Template"}
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        
        <div className="w-1/2 overflow-y-auto border-r border-gray-100 p-8 space-y-10 custom-scrollbar">
          
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-gray-900">
              <div className="p-1.5 bg-gray-900 rounded-lg text-white"><Layout size={14} /></div>
              <h2 className="text-xs font-black uppercase tracking-widest">Configuration</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Slug</label>
                <input 
                  type="text" 
                  value={formData.slug}
                  onChange={e => setFormData({...formData, slug: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-mono focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-gray-900 outline-none"
                >
                  <option value="wedding">Wedding</option>
                  <option value="birthday">Birthday</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl">
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="rounded text-gray-900 focus:ring-gray-900" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Active</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="checkbox" checked={formData.is_premium} onChange={e => setFormData({...formData, is_premium: e.target.checked})} className="rounded text-gray-900 focus:ring-gray-900" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 flex items-center gap-1"><Crown size={10} className="text-amber-500" /> Premium</span>
               </label>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-gray-900">
              <div className="p-1.5 bg-gray-900 rounded-lg text-white"><Palette size={14} /></div>
              <h2 className="text-xs font-black uppercase tracking-widest">Brand Palette</h2>
            </div>
            <div className="flex flex-wrap gap-2">
               {formData.color_palette.map((color, idx) => (
                 <div key={idx} className="group relative">
                   <div className="w-10 h-10 rounded-xl border border-gray-100 shadow-sm" style={{ backgroundColor: color }} />
                   <button 
                    onClick={() => setFormData({...formData, color_palette: formData.color_palette.filter((_, i) => i !== idx)})}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                   >×</button>
                 </div>
               ))}
               <button 
                onClick={() => { const c = prompt("Hex?"); if(c) setFormData({...formData, color_palette: [...formData.color_palette, c]})}}
                className="w-10 h-10 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-900 transition-all"
               >+</button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-gray-900">
              <div className="p-1.5 bg-gray-900 rounded-lg text-white"><Code size={14} /></div>
              <h2 className="text-xs font-black uppercase tracking-widest">Default Content (Live Sync)</h2>
            </div>
            <textarea 
              value={formData.default_content}
              onChange={e => setFormData({...formData, default_content: e.target.value})}
              className="w-full h-80 px-4 py-4 bg-gray-900 text-emerald-400 font-mono text-[11px] rounded-[2rem] focus:ring-2 focus:ring-emerald-500 outline-none resize-none shadow-inner"
            />
          </section>
        </div>

        <div className="w-1/2 bg-gray-50 flex items-center justify-center p-12 relative overflow-hidden">
          
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

          <div className={`transition-all duration-500 bg-white shadow-2xl overflow-hidden border-[8px] border-gray-900 rounded-[3rem] relative ${
            previewMode === "mobile" ? "w-[360px] h-[740px]" : "w-full h-full rounded-2xl"
          }`}>
            
            {previewMode === "mobile" && (
              <div className="absolute top-0 left-0 right-0 h-6 bg-transparent flex justify-center items-end pb-1 z-20">
                <div className="w-16 h-1 bg-gray-900/10 rounded-full" />
              </div>
            )}

            <iframe 
              ref={iframeRef}
              src={`/templates/${template?.slug}?preview=1`}
              className="w-full h-full border-none"
              title="Live Preview"
            />

            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="bg-gray-900/80 backdrop-blur px-3 py-1 rounded-full text-[8px] text-white font-black uppercase tracking-widest flex items-center gap-2">
                <RefreshCw size={8} className="animate-spin" /> Live Sync Active
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}