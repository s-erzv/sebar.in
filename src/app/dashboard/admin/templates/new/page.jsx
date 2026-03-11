"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import AccessDenied from "@/components/ui/AccessDenied";
import {
  ArrowLeft, Upload, FileCode, CheckCircle2, XCircle,
  Loader2, AlertTriangle, ChevronDown, Eye, Sparkles,
  Tag, Layers, Crown, RefreshCw, Terminal, Lock,
  Heart, Cake, GraduationCap, Mail, Layout, Shield, Check, User, Search, X
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
  { value: "standard", label: "Standard", desc: "Semua user", icon: Layout },
  { value: "premium",  label: "Premium",  desc: "User paket Premium", icon: Crown },
  { value: "private",  label: "Private",  desc: "User terpilih (Multi)", icon: Lock },
];

function extractBraceBlock(text, startIndex) {
  let depth = 0;
  let i = startIndex;
  while (i < text.length) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return text.slice(startIndex, i + 1);
    }
    i++;
  }
  return null;
}

function parseSchemaFromJSX(jsxText) {
  try {
    const schemaHeaderMatch = jsxText.match(/export\s+const\s+TEMPLATE_SCHEMA\s*=\s*\{/);
    if (!schemaHeaderMatch) return null;
    const schemaStart = schemaHeaderMatch.index + schemaHeaderMatch[0].length - 1;
    const schemaBlock = extractBraceBlock(jsxText, schemaStart);
    if (!schemaBlock) return null;
    
    const metaHeaderMatch = schemaBlock.match(/\bmeta\s*:\s*\{/);
    if (!metaHeaderMatch) return null;
    const metaStart = metaHeaderMatch.index + metaHeaderMatch[0].length - 1;
    const metaBlock = extractBraceBlock(schemaBlock, metaStart);
    if (!metaBlock) return null;

    const extract = (key) => {
      const m = metaBlock.match(new RegExp(`\\b${key}\\s*:\\s*["\'\`]([^"\'\`]+)["\'\`]`));
      return m ? m[1] : null;
    };
    const extractBool = (key) => {
      const m = metaBlock.match(new RegExp(`\\b${key}\\s*:\\s*(true|false)`));
      return m ? m[1] === "true" : false;
    };
    const extractArray = (key) => {
      const arrMatch = metaBlock.match(new RegExp(`\\b${key}\\s*:\\s*\\[([^\\]]+)\\]`));
      if (!arrMatch) return [];
      return arrMatch[1].match(/["\'\`]([^"\'\`]+)["\'\`]/g)?.map(s => s.replace(/["\'\`]/g, "")) || [];
    };

    return {
      name:          extract("name"),
      category:      extract("category"),
      description:   extract("description"),
      is_premium:    extractBool("is_premium"),
      tags:          extractArray("tags"),
      color_palette: extractArray("color_palette"),
      field_count:   (schemaBlock.match(/\bkey\s*:/g) || []).length,
      section_count: (schemaBlock.match(/\bsections\s*:/g) || []).length,
    };
  } catch { return null; }
}

function ParseBadge({ status }) {
  const map = {
    idle:     { color: "bg-gray-100 text-gray-500",   text: "Belum upload" },
    reading:  { color: "bg-blue-50 text-blue-600",    icon: <Loader2 className="w-3 h-3 animate-spin" />, text: "Membaca..." },
    success:  { color: "bg-emerald-50 text-emerald-700", icon: <CheckCircle2 className="w-3 h-3" />, text: "Schema OK" },
    warning:  { color: "bg-amber-50 text-amber-700",  icon: <AlertTriangle className="w-3 h-3" />, text: "Parsial" },
    error:    { color: "bg-red-50 text-red-600",      icon: <XCircle className="w-3 h-3" />,       text: "Gagal" },
  };
  const s = map[status] ?? map.idle;
  return <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded-md ${s.color}`}>{s.icon}{s.text}</span>;
}

export default function NewTemplatePage() {
  const { profile, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const [slug, setSlug]         = useState("");
  const [category, setCategory] = useState("general");
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [changelog, setChangelog] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const [jsxFile, setJsxFile]   = useState(null);      
  const [parseStatus, setParseStatus] = useState("idle");
  const [parsedSchema, setParsedSchema] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchUsers();
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data } = await supabase.from("profiles").select("id, full_name").order("full_name", { ascending: true });
    if (data) setUsers(data);
    setLoadingUsers(false);
  };

  const toggleUser = (userId) => {
    setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const filteredUsers = users.filter(u => u.full_name.toLowerCase().includes(userSearch.toLowerCase()));

  const processFile = async (file) => {
    if (!file?.name.endsWith(".jsx")) return;
    setJsxFile(file);
    setParseStatus("reading");
    const text = await file.text();
    const schema = parseSchemaFromJSX(text);
    if (!schema) { setParseStatus("error"); return; }
    if (schema.category) setCategory(schema.category);
    if (schema.name) setSlug(schema.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    if (schema.is_premium) setSelectedPlan("premium");
    setParsedSchema(schema);
    setParseStatus("success");
  };

  const handleSubmit = async () => {
    if (!jsxFile || !slug.trim() || submitting) return;
    if (selectedPlan === "private" && selectedUserIds.length === 0) {
        setSubmitError("Pilih minimal satu user.");
        return;
    }

    setSubmitting(true);
    const templateId = crypto.randomUUID();
    const finalPath = `${templateId}/v1/component.jsx`;
    
    try {
        const { error: upErr } = await supabase.storage.from("templates-source").upload(finalPath, jsxFile);
        if (upErr) throw upErr;

        const { error: insErr } = await supabase.from("templates").insert({
            id:              templateId,
            name:            parsedSchema?.name || jsxFile.name.replace(".jsx", ""),
            slug:            slug.trim().toLowerCase(),
            category:        category,
            is_premium:      selectedPlan !== "standard",
            is_active:       true,
            parse_status:    "pending",
            jsx_file_path:   finalPath,
            tags:            parsedSchema?.tags || [],
            color_palette:   parsedSchema?.color_palette || [],
        });
        if (insErr) throw insErr;

        if (selectedPlan === "private") {
            const accessData = selectedUserIds.map(uid => ({ template_id: templateId, user_id: uid }));
            await supabase.from("template_access").insert(accessData);
        }

        await fetch("/api/admin/templates/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId, version: 1 }),
        });

        router.push(`/dashboard/admin/templates`);
    } catch (err) { setSubmitError(err.message); } finally { setSubmitting(false); }
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;
  if (profile?.role !== "admin") return <AccessDenied />;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 text-gray-800 pb-32">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/admin/templates" className="text-xs font-medium text-gray-400 flex items-center gap-2 hover:text-gray-700">
          <ArrowLeft className="w-3 h-3" /> KEMBALI
        </Link>
        <div className="flex items-center gap-4">
          <ParseBadge status={parseStatus} />
          <button onClick={handleSubmit} disabled={submitting || !jsxFile} className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-40 transition-all flex items-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} SIMPAN TEMPLATE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-400 bg-white"}`}
          >
            <input ref={fileInputRef} type="file" accept=".jsx" className="hidden" onChange={e => processFile(e.target.files[0])} />
            {jsxFile ? (
              <div className="space-y-2"><FileCode className="w-10 h-10 text-blue-500 mx-auto" /><p className="font-medium text-sm">{jsxFile.name}</p></div>
            ) : (
              <div className="space-y-2"><Upload className="w-10 h-10 text-gray-300 mx-auto" /><p className="text-sm text-gray-400 font-medium">Klik atau drop file JSX di sini</p></div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm relative z-10">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2 font-medium text-xs text-gray-500 uppercase tracking-widest rounded-t-xl"><Layers size={14} /> Informasi Desain</div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase">Slug URL</label>
                <div className="flex items-center border border-gray-200 rounded-lg px-3 bg-gray-50 py-2"><span className="text-xs text-gray-400 mr-1">sebar.in/</span><input type="text" value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} className="flex-1 text-sm bg-transparent outline-none" /></div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase">Kategori Acara</label>
                <div className="relative">
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg outline-none appearance-none bg-white">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm relative z-20">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2 font-medium text-xs text-gray-500 uppercase tracking-widest rounded-t-xl"><Shield size={14} /> Akses & Paket</div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PLANS.map(p => (
                  <button key={p.value} onClick={() => setSelectedPlan(p.value)} className={`p-4 border rounded-xl text-left transition-all ${selectedPlan === p.value ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-200 hover:border-gray-300"}`}>
                    <p.icon size={18} className={selectedPlan === p.value ? "text-blue-600" : "text-gray-400"} />
                    <p className="font-semibold text-xs mt-3">{p.label}</p>
                    <p className="text-[9px] text-gray-500 mt-1">{p.desc}</p>
                  </button>
                ))}
              </div>

              {selectedPlan === "private" && (
                <div className="space-y-2 relative" ref={dropdownRef}>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase">Pilih User Yang Diizinkan</label>
                  <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white flex items-center justify-between cursor-pointer hover:border-gray-400 transition-all">
                    <span className="text-xs font-medium text-blue-600">{selectedUserIds.length > 0 ? `${selectedUserIds.length} User Dipilih` : "Klik untuk mencari user..."}</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {isDropdownOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
                      <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                        <Search size={14} className="text-gray-400" />
                        <input type="text" placeholder="Cari nama user..." value={userSearch} onChange={e => setUserSearch(e.target.value)} onClick={e => e.stopPropagation()} className="w-full bg-transparent text-sm outline-none" />
                      </div>
                      <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                        {filteredUsers.map(u => (
                          <div key={u.id} onClick={e => { e.stopPropagation(); toggleUser(u.id); }} className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${selectedUserIds.includes(u.id) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedUserIds.includes(u.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>{selectedUserIds.includes(u.id) && <Check size={10} className="text-white" />}</div>
                              <span className="text-sm font-medium">{u.full_name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {submitError && <div className="p-3 bg-red-50 text-red-600 text-[11px] font-medium rounded-lg flex items-center gap-2 border border-red-100"><XCircle size={14} /> {submitError}</div>}
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4 sticky top-8">
            <h2 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} /> Preview Schema</h2>
            {parsedSchema ? (
              <div className="space-y-4">
                <p className="text-base font-semibold text-gray-900 leading-tight">{parsedSchema.name}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded-md font-medium text-gray-500 capitalize">{category}</span>
                  <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${selectedPlan === 'standard' ? 'bg-gray-200 text-gray-600' : 'bg-amber-100 text-amber-700'}`}>{selectedPlan.toUpperCase()}</span>
                </div>
                {parsedSchema.color_palette?.length > 0 && (
                  <div className="flex gap-1.5 pt-2">
                    {parsedSchema.color_palette.map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                )}
                <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                  <div><p className="text-[9px] text-gray-400 font-bold uppercase">Section</p><p className="text-lg font-bold">{parsedSchema.section_count}</p></div>
                  <div><p className="text-[9px] text-gray-400 font-bold uppercase">Field</p><p className="text-lg font-bold">{parsedSchema.field_count}</p></div>
                </div>
              </div>
            ) : <p className="text-xs text-gray-400 italic">Upload file untuk melihat meta.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}