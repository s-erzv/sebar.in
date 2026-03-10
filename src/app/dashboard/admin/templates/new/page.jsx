"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import AccessDenied from "@/components/ui/AccessDenied";
import {
  ArrowLeft, Upload, FileCode, CheckCircle2, XCircle,
  Loader2, AlertTriangle, ChevronDown, Eye, Sparkles,
  Tag, Layers, Crown, RefreshCw, Terminal
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Kategori undangan ────────────────────────────────────────
const CATEGORIES = [
  { value: "wedding",    label: "Pernikahan",  emoji: "💍" },
  { value: "birthday",   label: "Ulang Tahun", emoji: "🎂" },
  { value: "graduation", label: "Wisuda",      emoji: "🎓" },
  { value: "engagement", label: "Tunangan",    emoji: "💌" },
  { value: "general",    label: "Umum",        emoji: "✉️" },
];

// ─── Helper: ambil isi blok { } dengan brace-counting ─────────
// Lebih reliable dari lazy regex [\s\S]*? yang berhenti di } pertama
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

// ─── Parse TEMPLATE_SCHEMA dari teks JSX (client-side preview) ─
function parseSchemaFromJSX(jsxText) {
  try {
    // 1. Cari posisi awal blok TEMPLATE_SCHEMA = {
    const schemaHeaderMatch = jsxText.match(/export\s+const\s+TEMPLATE_SCHEMA\s*=\s*\{/);
    if (!schemaHeaderMatch) return null;

    const schemaStart = schemaHeaderMatch.index + schemaHeaderMatch[0].length - 1;
    const schemaBlock = extractBraceBlock(jsxText, schemaStart);
    if (!schemaBlock) return null;

    // 2. Di dalam schemaBlock, cari blok meta: { ... }
    const metaHeaderMatch = schemaBlock.match(/\bmeta\s*:\s*\{/);
    if (!metaHeaderMatch) return null;

    const metaStart = metaHeaderMatch.index + metaHeaderMatch[0].length - 1;
    const metaBlock = extractBraceBlock(schemaBlock, metaStart);
    if (!metaBlock) return null;

    // 3. Extract nilai dari dalam metaBlock
    const extract = (key) => {
      const m = metaBlock.match(new RegExp(`\\b${key}\\s*:\\s*["\'\`]([^"\'\`]+)["\'\`]`));
      return m ? m[1] : null;
    };
    const extractBool = (key) => {
      const m = metaBlock.match(new RegExp(`\\b${key}\\s*:\\s*(true|false)`));
      return m ? m[1] === "true" : false;
    };
    const extractArray = (key) => {
      const arrHeaderMatch = metaBlock.match(new RegExp(`\\b${key}\\s*:\\s*\\[`));
      if (!arrHeaderMatch) return [];
      const arrStart = arrHeaderMatch.index + arrHeaderMatch[0].length - 1;
      let depth = 0, i = arrStart;
      while (i < metaBlock.length) {
        if (metaBlock[i] === "[") depth++;
        else if (metaBlock[i] === "]") { depth--; if (depth === 0) break; }
        i++;
      }
      const arrContent = metaBlock.slice(arrStart + 1, i);
      return arrContent.match(/["\'\`]([^"\'\`]+)["\'\`]/g)
        ?.map((s) => s.replace(/["\'\`]/g, "")) ?? [];
    };

    // 4. Hitung sections & fields dari seluruh schemaBlock
    const fieldCount   = (schemaBlock.match(/\bkey\s*:/g) || []).length;
    const sectionCount = (schemaBlock.match(/\bsections\s*:/g) || []).length;

    return {
      name:          extract("name"),
      category:      extract("category"),
      description:   extract("description"),
      is_premium:    extractBool("is_premium"),
      tags:          extractArray("tags"),
      color_palette: extractArray("color_palette"),
      field_count:   fieldCount,
      section_count: sectionCount,
    };
  } catch {
    return null;
  }
}

// ─── Status badge ──────────────────────────────────────────────
function ParseBadge({ status }) {
  const map = {
    idle:     { color: "bg-gray-100 text-gray-500",   icon: null,            text: "Belum diupload" },
    reading:  { color: "bg-blue-50 text-blue-600",    icon: <Loader2 className="w-3 h-3 animate-spin" />, text: "Membaca file..." },
    success:  { color: "bg-emerald-50 text-emerald-700", icon: <CheckCircle2 className="w-3 h-3" />, text: "Schema terdeteksi" },
    warning:  { color: "bg-amber-50 text-amber-700",  icon: <AlertTriangle className="w-3 h-3" />, text: "Schema tidak lengkap" },
    error:    { color: "bg-red-50 text-red-600",      icon: <XCircle className="w-3 h-3" />,       text: "Parse gagal" },
  };
  const s = map[status] ?? map.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>
      {s.icon}{s.text}
    </span>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function NewTemplatePage() {
  const { profile, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef(null);

  // Form state
  const [slug, setSlug]         = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [category, setCategory] = useState("general");
  const [changelog, setChangelog] = useState("");

  // File state
  const [jsxFile, setJsxFile]   = useState(null);       // File object
  const [jsxText, setJsxText]   = useState("");          // raw teks JSX
  const [parseStatus, setParseStatus] = useState("idle"); // idle|reading|success|warning|error
  const [parsedSchema, setParsedSchema] = useState(null);
  const [parseErrors, setParseErrors]   = useState([]);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── Drag & Drop ──
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  // ── Process file ──
  const processFile = async (file) => {
    if (!file.name.endsWith(".jsx") && !file.name.endsWith(".tsx")) {
      setParseStatus("error");
      setParseErrors(["File harus berekstensi .jsx atau .tsx"]);
      return;
    }
    if (file.size > 500 * 1024) {
      setParseStatus("error");
      setParseErrors(["Ukuran file maksimal 500KB"]);
      return;
    }

    setJsxFile(file);
    setParseStatus("reading");
    setParseErrors([]);
    setParsedSchema(null);

    const text = await file.text();
    setJsxText(text);

    // Cek wajib exports
    const errors = [];
    if (!text.includes("export const TEMPLATE_SCHEMA")) {
      errors.push("Tidak ada `export const TEMPLATE_SCHEMA` — wajib ada di file");
    }
    if (!text.includes("export default")) {
      errors.push("Tidak ada `export default` — wajib ada React component sebagai default export");
    }

    // Cek import terlarang — hanya cek actual import/require statements,
    // BUKAN teks bebas (komentar, string, nama variable) supaya tidak false positive
    const forbiddenImportPatterns = [
      { pattern: /^\s*import\s+.*from\s+['"]axios['"]/m,        label: "axios" },
      { pattern: /^\s*import\s+.*from\s+['"]node-fetch['"]/m,   label: "node-fetch" },
      { pattern: /^\s*import\s+.*from\s+['"]fs['"]/m,           label: "fs" },
      { pattern: /^\s*import\s+.*from\s+['"]child_process['"]/m, label: "child_process" },
      { pattern: /^\s*import\s+.*from\s+['"]path['"]/m,         label: "path" },
      // require() — hanya yang beneran call, bukan kata "require" di komentar
      { pattern: /(?<![/]{2}.*)\brequire\s*\(\s*['"]/m,         label: "require()" },
      // eval() — sama
      { pattern: /(?<![/]{2}.*)\beval\s*\(/m,                   label: "eval()" },
    ];
    forbiddenImportPatterns.forEach(({ pattern, label }) => {
      if (pattern.test(text)) errors.push(`Penggunaan "${label}" tidak diizinkan`);
    });

    if (errors.length > 0) {
      setParseStatus("error");
      setParseErrors(errors);
      return;
    }

    // Parse schema preview
    const schema = parseSchemaFromJSX(text);

    if (!schema || !schema.name) {
      setParseStatus("warning");
      setParseErrors(["TEMPLATE_SCHEMA.meta.name tidak ditemukan. Pastikan format sesuai konvensi."]);
      setParsedSchema(schema);
      return;
    }

    // Auto-fill form dari schema
    if (schema.category) setCategory(schema.category);
    if (schema.name) {
      const autoSlug = schema.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      setSlug(autoSlug);
    }
    if (schema.is_premium !== undefined) setIsPremium(schema.is_premium);

    setParsedSchema(schema);
    setParseStatus("success");
  };

  // ── Submit ──
  const handleSubmit = async () => {
    // 1. Pre-flight Checks
    if (!jsxFile || parseStatus === "error") return;
    if (!slug.trim()) { 
        setSubmitError("Slug wajib diisi"); 
        return; 
    }

    setSubmitting(true);
    setSubmitError("");

    // Strategi: Generate ID di awal untuk konsistensi Storage & DB
    const templateId = crypto.randomUUID();
    const finalPath = `${templateId}/v1/component.jsx`;
    
    // Flag untuk tracking progress (untuk cleanup)
    let fileUploaded = false;

    try {
        // ── STEP 1: Direct Upload ke Storage ──
        // Kita langsung upload ke folder final menggunakan UUID yang di-generate
        const { error: uploadErr } = await supabase.storage
        .from("templates-source")
        .upload(finalPath, jsxFile, { 
            contentType: "text/plain", 
            upsert: false 
        });

        if (uploadErr) {
        throw new Error(`Storage Error: ${uploadErr.message}`);
        }
        
        fileUploaded = true;

        // ── STEP 2: Database Transaction (Template Row) ──
        // Menggunakan templateId yang sama dengan folder di storage
        const { error: insertErr } = await supabase
        .from("templates")
        .insert({
            id:              templateId,
            name:            parsedSchema?.name || jsxFile.name.replace(/\.jsx$|\.tsx$/, ""),
            slug:            slug.trim().toLowerCase(),
            category:        category,
            is_premium:      isPremium,
            is_active:       false,
            parse_status:    "pending",
            jsx_file_path:   finalPath,
            content_schema:  {}, // Akan diisi oleh server-side parser
            guest_schema:    {},
            default_content: {},
            tags:            parsedSchema?.tags ?? [],
            color_palette:   parsedSchema?.color_palette ?? [],
            current_version: 1,
        });

        if (insertErr) {
        throw new Error(`Database Error: ${insertErr.message}`);
        }

        // ── STEP 3: Versioning ──
        // Mencatat sejarah versi template
        const { error: versionErr } = await supabase
        .from("template_versions")
        .insert({
            template_id:   templateId,
            version:       1,
            jsx_file_path: finalPath,
            changelog:     changelog || "Initial upload",
        });

        if (versionErr) {
        // Kita tidak throw error di sini agar proses utama (compile) tetap jalan, 
        // tapi secara ideal ini harus tercatat.
        console.warn("Version log failed, but template was created:", versionErr.message);
        }

        // ── STEP 4: Trigger Server-Side Compiler ──
        // Memanggil API internal untuk compile JSX -> JS menggunakan esbuild
        const parseResponse = await fetch("/api/admin/templates/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, version: 1 }),
        });

        if (!parseResponse.ok) {
        const parseData = await parseResponse.json();
        throw new Error(`Compiler Error: ${parseData.error || "Gagal memicu parser"}`);
        }

        // Success: Redirect ke dashboard dengan query param untuk notifikasi
        router.push(`/dashboard/admin?tab=templates&new=${templateId}`);
        router.refresh();

    } catch (err) {
        console.error("Upload process failed:", err);
        setSubmitError(err.message);

        // ── CLEANUP LOGIC ──
        // Jika file sudah terupload tapi insert DB gagal, hapus filenya agar tidak jadi "zombie"
        if (fileUploaded) {
        await supabase.storage.from("templates-source").remove([finalPath]);
        }
    } finally {
        setSubmitting(false);
    }
    };

  // ── Guards ──
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-gray-400 w-6 h-6" />
      </div>
    );
  }
  if (profile?.role !== "admin") return <AccessDenied />;

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 font-sans">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/admin"
          className="text-sm text-gray-400 flex items-center gap-2 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
        <div className="flex items-center gap-3">
          <ParseBadge status={parseStatus} />
          <button
            onClick={handleSubmit}
            disabled={submitting || !jsxFile || parseStatus === "error" || parseStatus === "reading"}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                       bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40
                       disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {submitting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Upload className="w-4 h-4" />}
            {submitting ? "Mengupload..." : "Upload Template"}
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Upload Template Baru</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload file <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">.jsx</code> dengan
          {" "}<code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">TEMPLATE_SCHEMA</code>
          {" "}yang sudah terdefine. Sistem akan otomatis parse schema & compile saat upload.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ── LEFT: Upload + Config ── */}
        <div className="lg:col-span-3 space-y-6">

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
              transition-all duration-200 select-none
              ${isDragging
                ? "border-gray-900 bg-gray-50 scale-[1.01]"
                : jsxFile
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-gray-200 bg-gray-50/50 hover:border-gray-400 hover:bg-white"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jsx,.tsx"
              className="hidden"
              onChange={handleFileChange}
            />

            {jsxFile ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
                  <FileCode className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">{jsxFile.name}</p>
                <p className="text-xs text-gray-400">
                  {(jsxFile.size / 1024).toFixed(1)} KB · Klik untuk ganti file
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-200 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-700 text-sm">Drop file JSX di sini</p>
                  <p className="text-xs text-gray-400 mt-1">atau klik untuk browse · maks 500KB</p>
                </div>
              </div>
            )}
          </div>

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                <Terminal className="w-4 h-4" /> Masalah ditemukan
              </div>
              <ul className="space-y-1">
                {parseErrors.map((e, i) => (
                  <li key={i} className="text-xs text-red-600 font-mono flex items-start gap-2">
                    <span className="text-red-400 mt-px">›</span> {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Config fields */}
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 shadow-sm">

            {/* Slug */}
            <div className="p-5 space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Slug URL
              </label>
              <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent">
                <span className="px-3 py-2.5 text-xs text-gray-400 bg-gray-50 border-r border-gray-200 font-mono whitespace-nowrap">
                  /t/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="elegant-rose"
                  className="flex-1 px-3 py-2.5 text-sm font-mono outline-none bg-white"
                />
              </div>
              <p className="text-xs text-gray-400">
                Auto-diisi dari <code className="font-mono">meta.name</code> jika ada
              </p>
            </div>

            {/* Kategori */}
            <div className="p-5 space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Kategori
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none
                             appearance-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-400">Auto-diisi dari <code className="font-mono">meta.category</code> jika ada</p>
            </div>

            {/* Premium + Changelog */}
            <div className="p-5 space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Crown className="w-4 h-4 text-amber-500" /> Template Premium
                </span>
                <div
                  onClick={() => setIsPremium(!isPremium)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${isPremium ? "bg-gray-900" : "bg-gray-200"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isPremium ? "left-6" : "left-1"}`} />
                </div>
              </label>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Changelog / Catatan Upload
                </label>
                <textarea
                  rows={2}
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  placeholder="Contoh: Initial upload, fix animasi cover, tambah section galeri..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none
                             focus:ring-2 focus:ring-gray-900 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <XCircle className="w-4 h-4 shrink-0" /> {submitError}
            </div>
          )}
        </div>

        {/* ── RIGHT: Schema Preview ── */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> Schema Terdeteksi
          </h2>

          {parseStatus === "idle" && (
            <div className="border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
              Upload file JSX untuk melihat schema
            </div>
          )}

          {parseStatus === "reading" && (
            <div className="border border-gray-200 rounded-2xl p-8 flex items-center justify-center gap-3 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Membaca file...
            </div>
          )}

          {(parseStatus === "success" || parseStatus === "warning") && parsedSchema && (
            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

              {/* Color palette swatch */}
              {parsedSchema.color_palette?.length > 0 && (
                <div className="flex h-3">
                  {parsedSchema.color_palette.map((c, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}

              <div className="p-5 space-y-4">

                {/* Name & category */}
                <div>
                  <p className="font-bold text-gray-900 text-base">
                    {parsedSchema.name ?? <span className="text-gray-400 font-normal italic">Nama tidak ditemukan</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {parsedSchema.category && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {CATEGORIES.find((c) => c.value === parsedSchema.category)?.emoji}{" "}
                        {parsedSchema.category}
                      </span>
                    )}
                    {parsedSchema.is_premium && (
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Crown className="w-3 h-3" /> premium
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{parsedSchema.section_count ?? "–"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Seksi form</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{parsedSchema.field_count ?? "–"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Total field</p>
                  </div>
                </div>

                {/* Tags */}
                {parsedSchema.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {parsedSchema.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* File info */}
                <div className="pt-2 border-t border-gray-100 space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Nama file</span>
                    <span className="font-mono text-gray-600">{jsxFile?.name}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Ukuran</span>
                    <span className="font-mono text-gray-600">{jsxFile ? (jsxFile.size / 1024).toFixed(1) + " KB" : "–"}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Compile status</span>
                    <span className="text-amber-600 font-medium">Pending (server-side)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {parseStatus === "error" && (
            <div className="border border-red-200 rounded-2xl p-6 text-center space-y-3">
              <XCircle className="w-8 h-8 text-red-400 mx-auto" />
              <p className="text-sm text-red-600 font-medium">File tidak valid</p>
              <p className="text-xs text-gray-400">Perbaiki error di atas lalu upload ulang</p>
              <button
                onClick={() => {
                  setJsxFile(null); setJsxText(""); setParseStatus("idle");
                  setParseErrors([]); setParsedSchema(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="flex items-center gap-1.5 mx-auto text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>
          )}

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Setelah upload
            </p>
            <ul className="text-xs text-blue-600 space-y-1 leading-relaxed">
              <li>· Server akan compile JSX → JS bundle via esbuild</li>
              <li>· Schema lengkap di-extract dari <code className="font-mono">TEMPLATE_SCHEMA</code></li>
              <li>· Preview iframe otomatis aktif setelah compile selesai</li>
              <li>· Template bisa diaktifkan manual dari halaman detail</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}