"use client";

import { useEffect, useState, use, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import AccessDenied from "@/components/ui/AccessDenied";
import { 
  ArrowLeft, Save, Layout, Crown, 
  Code, Palette, Loader2, Globe, 
  Smartphone, Monitor, RefreshCw, AlertCircle,
  Shield, Lock, ChevronDown, Heart, Cake, GraduationCap, Mail, Layers, Search, Check, X, User
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "wedding",    label: "Pernikahan",  icon: Heart },
  { value: "birthday",   label: "Ulang Tahun", icon: Cake },
  { value: "graduation", label: "Wisuda",      icon: GraduationCap },
  { value: "engagement", label: "Tunangan",    icon: Mail },
  { value: "general",    label: "Umum",        icon: Layers },
];

const PLANS = [
  { value: "standard", label: "Standard", icon: Layout },
  { value: "premium",  label: "Premium",  icon: Crown },
  { value: "private",  label: "Private",  icon: Lock },
];

export default function TemplateDetailsPage({ params }) {
  const { id } = use(params);
  const { profile, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const iframeRef = useRef(null);
  const dropdownRef = useRef(null);

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState("mobile"); 
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "", slug: "", category: "general", preview_image_url: "",
    is_premium: false, is_active: false, tags: [], color_palette: [],
    content_schema: "{}", default_content: "{}"
  });

  const [currentPlan, setCurrentPlan] = useState("standard");

  useEffect(() => {
    if (profile?.role === "admin") {
      fetchTemplate();
      fetchUsers();
    }
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profile, id]);

  useEffect(() => {
    const timer = setTimeout(() => syncPreview(), 500); 
    return () => clearTimeout(timer);
  }, [formData.default_content, formData.color_palette]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data } = await supabase.from("profiles").select("id, full_name").order("full_name", { ascending: true });
    if (data) setUsers(data);
    setLoadingUsers(false);
  };

  const fetchTemplate = async () => {
    try {
      const { data, error } = await supabase.from("templates").select("*, template_access(user_id)").eq("id", id).single();
      if (error) throw error;
      setTemplate(data);
      setFormData({
        ...data,
        content_schema: JSON.stringify(data.content_schema, null, 2),
        default_content: JSON.stringify(data.default_content, null, 2),
        tags: data.tags || [],
        color_palette: data.color_palette || []
      });

      const accessedUsers = data.template_access?.map(a => a.user_id) || [];
      setSelectedUserIds(accessedUsers);

      if (accessedUsers.length > 0) setCurrentPlan("private");
      else if (data.is_premium) setCurrentPlan("premium");
      else setCurrentPlan("standard");

    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const toggleUser = (userId) => {
    setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const filteredUsers = users.filter(u => u.full_name.toLowerCase().includes(userSearch.toLowerCase()));

  const syncPreview = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        const data = { type: "UPDATE_PREVIEW", content: JSON.parse(formData.default_content), palette: formData.color_palette };
        iframeRef.current.contentWindow.postMessage(data, "*");
      } catch (e) {}
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    setError("");
    try {
      const isPremium = currentPlan === "premium" || currentPlan === "private";
      const { error: updateErr } = await supabase
        .from("templates")
        .update({
          ...formData,
          is_premium: isPremium,
          content_schema: JSON.parse(formData.content_schema),
          default_content: JSON.parse(formData.default_content),
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (updateErr) throw updateErr;

      // Update Template Access
      await supabase.from("template_access").delete().eq("template_id", id);
      if (currentPlan === "private" && selectedUserIds.length > 0) {
        const accessData = selectedUserIds.map(uid => ({ template_id: id, user_id: uid }));
        await supabase.from("template_access").insert(accessData);
      }

      alert("Template updated successfully!");
    } catch (err) { setError("Error: " + err.message); } finally { setSaving(false); }
  };

  if (authLoading || loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;
  if (profile?.role !== "admin") return <AccessDenied />;

  return (
    <div className="flex flex-col h-screen bg-white font-sans overflow-hidden text-gray-800">
      <header className="h-16 border-b border-gray-100 flex items-center justify-between px-6 shrink-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/templates" className="p-2 hover:bg-gray-50 rounded-lg transition-colors"><ArrowLeft size={20} className="text-gray-400" /></Link>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 uppercase tracking-tight">{template?.name}</h1>
            <p className="text-[10px] text-gray-400 font-mono">/{template?.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100 mr-4">
            <button onClick={() => setPreviewMode("mobile")} className={`p-1.5 rounded-md transition-all ${previewMode === "mobile" ? "bg-white shadow-sm text-blue-600" : "text-gray-400"}`}><Smartphone size={16} /></button>
            <button onClick={() => setPreviewMode("desktop")} className={`p-1.5 rounded-md transition-all ${previewMode === "desktop" ? "bg-white shadow-sm text-blue-600" : "text-gray-400"}`}><Monitor size={16} /></button>
          </div>
          <button onClick={handleUpdate} disabled={saving} className="bg-gray-900 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-gray-800 transition-all shadow-sm">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <div className="w-1/2 overflow-y-auto border-r border-gray-100 p-8 space-y-10 custom-scrollbar">
          
          <section className="space-y-6">
            <div className="flex items-center gap-2 font-bold text-[10px] text-gray-400 uppercase tracking-widest"><Layers size={14} /> Informasi Desain</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-500 uppercase">Slug</label><input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs outline-none focus:border-gray-400" /></div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Kategori</label>
                <div className="relative">
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs outline-none focus:border-gray-400 appearance-none">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer w-fit"><input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="rounded text-gray-900" /><span className="text-xs font-semibold text-gray-600">Published / Active</span></label>
          </section>

          <section className="space-y-6 relative z-30">
            <div className="flex items-center gap-2 font-bold text-[10px] text-gray-400 uppercase tracking-widest"><Shield size={14} /> Akses & Paket</div>
            <div className="grid grid-cols-3 gap-3">
              {PLANS.map(plan => (
                <button key={plan.value} onClick={() => setCurrentPlan(plan.value)} className={`p-3 border rounded-xl text-left transition-all ${currentPlan === plan.value ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-100 hover:border-gray-200"}`}>
                  <plan.icon size={16} className={currentPlan === plan.value ? "text-blue-600" : "text-gray-400"} />
                  <p className="text-xs font-bold mt-2 text-gray-900">{plan.label}</p>
                </button>
              ))}
            </div>
            {currentPlan === "private" && (
              <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Manage User Access ({selectedUserIds.length})</label>
                <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white flex items-center justify-between cursor-pointer hover:border-gray-400 transition-all">
                  <span className="text-xs font-medium text-blue-600">{selectedUserIds.length > 0 ? `${selectedUserIds.length} User Diizinkan` : "Klik untuk pilih user..."}</span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                {isDropdownOpen && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
                    <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                      <Search size={14} className="text-gray-400" />
                      <input type="text" placeholder="Cari user..." value={userSearch} onChange={e => setUserSearch(e.target.value)} onClick={e => e.stopPropagation()} className="w-full bg-transparent text-xs outline-none" />
                    </div>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {filteredUsers.map(u => (
                        <div key={u.id} onClick={e => { e.stopPropagation(); toggleUser(u.id); }} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedUserIds.includes(u.id) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${selectedUserIds.includes(u.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>{selectedUserIds.includes(u.id) && <Check size={10} className="text-white" />}</div>
                          <span className="text-xs font-medium">{u.full_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-[10px] text-gray-400 uppercase tracking-widest"><Palette size={14} /> Brand Palette</div>
            <div className="flex flex-wrap gap-2">
               {formData.color_palette.map((color, idx) => (
                 <div key={idx} className="group relative">
                   <div className="w-8 h-8 rounded-lg border border-gray-100 shadow-sm" style={{ backgroundColor: color }} />
                   <button onClick={() => setFormData({...formData, color_palette: formData.color_palette.filter((_, i) => i !== idx)})} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                 </div>
               ))}
               <button onClick={() => { const c = prompt("Hex?"); if(c) setFormData({...formData, color_palette: [...formData.color_palette, c]})}} className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-900 transition-all">+</button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-[10px] text-gray-400 uppercase tracking-widest"><Code size={14} /> Default Content</div>
            <textarea value={formData.default_content} onChange={e => setFormData({...formData, default_content: e.target.value})} className="w-full h-64 px-4 py-4 bg-gray-900 text-emerald-400 font-mono text-[11px] rounded-xl outline-none resize-none shadow-inner" />
          </section>
        </div>

        <div className="w-1/2 bg-gray-50 flex items-center justify-center p-12 relative overflow-hidden">
          <div className={`transition-all duration-500 bg-white shadow-2xl overflow-hidden border-[8px] border-gray-900 rounded-[2.5rem] relative ${previewMode === "mobile" ? "w-[320px] h-[640px]" : "w-full h-full rounded-xl"}`}>
            <iframe ref={iframeRef} src={`/templates/${template?.slug}?preview=1`} className="w-full h-full border-none" title="Live Preview" />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="bg-gray-900/80 backdrop-blur px-3 py-1 rounded-full text-[8px] text-white font-medium uppercase tracking-widest flex items-center gap-2"><RefreshCw size={8} className="animate-spin" /> Live Sync</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}