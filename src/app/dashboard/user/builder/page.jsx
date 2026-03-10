"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Save, Loader2, ChevronRight, ChevronLeft,
  Check, Globe, Sparkles, Eye, Crown,
  AlertCircle, RefreshCw, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// ─── Icon map untuk section icons dari content_schema ─────────
const SECTION_ICONS = {
  heart:    "💍", couple: "💍",
  calendar: "📅", event: "📅",
  party:    "🎉", resepsi: "🎉",
  image:    "🖼️", gallery: "🖼️",
  quote:    "✍️", quotes: "✍️",
  music:    "🎵",
  map:      "📍",
  default:  "✦",
};

// ─── Kategori label ────────────────────────────────────────────
const CATEGORY_LABELS = {
  wedding:    "Pernikahan",
  birthday:   "Ulang Tahun",
  graduation: "Wisuda",
  engagement: "Tunangan",
  general:    "Umum",
};

// ─────────────────────────────────────────────────────────────
// STEP 1 — Pilih Template
// ─────────────────────────────────────────────────────────────
function StepChooseTemplate({ selectedId, onSelect }) {
  const supabase = createClient();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");

  // Perbaikan di dalam StepChooseTemplate
    useEffect(() => {
    supabase
        .from("templates")
        .select(`
        id, name, slug, category, is_premium, 
        preview_image_url, color_palette, tags, 
        description, content_schema, default_content
        `) // Tambahkan content_schema & default_content di sini
        .eq("is_active", true)
        .eq("parse_status", "compiled")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => { 
        if (error) console.error("Error fetch templates:", error);
        setTemplates(data ?? []); 
        setLoading(false); 
        });
    }, []);

  const categories = ["all", ...new Set(templates.map((t) => t.category))];
  const filtered = filter === "all" ? templates : templates.filter((t) => t.category === filter);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="animate-spin w-6 h-6 text-gray-400" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Pilih Template Undangan</h2>
        <p className="text-sm text-gray-500 mt-1">Template menentukan tampilan dan field isian undanganmu.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all
              ${filter === cat
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >
            {cat === "all" ? "Semua" : CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          Belum ada template tersedia.
        </div>
      )}

      {/* Template grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map((tmpl) => {
          const isSelected = tmpl.id === selectedId;
          return (
            <button
              key={tmpl.id}
              onClick={() => onSelect(tmpl)}
              className={`relative text-left rounded-2xl overflow-hidden border-2 transition-all group
                ${isSelected
                  ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2"
                  : "border-gray-200 hover:border-gray-400"}`}
            >
              {/* Preview image */}
              <div className="aspect-[9/14] bg-gray-100 relative overflow-hidden">
                {tmpl.preview_image_url ? (
                  <Image
                    src={tmpl.preview_image_url}
                    alt={tmpl.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  /* Color palette fallback */
                  <div className="absolute inset-0 flex flex-col">
                    {(tmpl.color_palette?.length > 0
                      ? tmpl.color_palette
                      : ["#f3f4f6", "#e5e7eb"]
                    ).map((c, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl opacity-60">
                        {SECTION_ICONS[tmpl.category] ?? "✦"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Selected overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-gray-900/20 flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Premium badge */}
                {tmpl.is_premium && (
                  <div className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" /> PRO
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 bg-white">
                <p className="font-semibold text-gray-900 text-sm truncate">{tmpl.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {CATEGORY_LABELS[tmpl.category] ?? tmpl.category}
                </p>

                {/* Color swatches */}
                {tmpl.color_palette?.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {tmpl.color_palette.slice(0, 4).map((c, i) => (
                      <div
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border border-white ring-1 ring-gray-200"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 2 — Dynamic Form dari content_schema
// ─────────────────────────────────────────────────────────────

// Render satu field berdasarkan field definition dari schema
function DynamicField({ field, value, onChange }) {
  const base = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white";

  const handleFileUpload = async (e, multiple = false) => {
    // Placeholder — implementasi upload ke Supabase Storage invitation-assets
    // TODO: upload file & return public URL
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    // Untuk sekarang preview local URL
    if (multiple) {
      const urls = files.map((f) => URL.createObjectURL(f));
      onChange([...(value ?? []), ...urls]);
    } else {
      onChange(URL.createObjectURL(files[0]));
    }
  };

  switch (field.type) {
    case "text":
      return (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          maxLength={field.max_length}
          className={base}
        />
      );

    case "textarea":
      return (
        <textarea
          rows={3}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          maxLength={field.max_length}
          className={`${base} resize-none`}
        />
      );

    case "datetime":
      return (
        <input
          type="datetime-local"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      );

    case "url":
      return (
        <input
          type="url"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? "https://"}
          className={`${base} font-mono text-xs`}
        />
      );

    case "number":
      return (
        <input
          type="number"
          value={value ?? field.default ?? ""}
          onChange={(e) => onChange(Number(e.target.value))}
          min={field.min}
          max={field.max}
          className={base}
        />
      );

    case "color":
      return (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={value ?? "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-12 rounded cursor-pointer border border-gray-200"
          />
          <span className="text-sm font-mono text-gray-500">{value ?? "#000000"}</span>
        </div>
      );

    case "select":
      return (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        >
          <option value="">-- Pilih --</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>
              {opt.label ?? opt}
            </option>
          ))}
        </select>
      );

    case "image":
      return (
        <div className="space-y-2">
          {value && (
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200">
              <img src={value} alt="preview" className="w-full h-full object-cover" />
              <button
                onClick={() => onChange(null)}
                className="absolute top-1 right-1 w-5 h-5 bg-gray-900/70 rounded-full text-white text-xs flex items-center justify-center"
              >×</button>
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-gray-500 hover:text-gray-700 transition-colors">
            <span>📎</span> {value ? "Ganti foto" : "Upload foto"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, false)}
            />
          </label>
          {field.aspect_ratio && (
            <p className="text-[10px] text-gray-400">Rasio ideal: {field.aspect_ratio} · Maks {field.max_size_mb ?? 5}MB</p>
          )}
        </div>
      );

    case "image_multiple":
      return (
        <div className="space-y-2">
          {/* Preview grid */}
          {(value?.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {value.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={url} alt={`foto-${i}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-gray-900/70 rounded-full text-white text-[10px] flex items-center justify-center"
                  >×</button>
                </div>
              ))}
            </div>
          )}
          {(!field.max_count || (value?.length ?? 0) < field.max_count) && (
            <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-gray-500 transition-colors">
              <span>📎</span> Tambah foto {field.max_count ? `(${value?.length ?? 0}/${field.max_count})` : ""}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e, true)}
              />
            </label>
          )}
        </div>
      );

    default:
      return (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      );
  }
}

function StepFillContent({ template, content, onChange, slug, onSlugChange }) {
  const [activeSection, setActiveSection] = useState(0);
  const sections = template?.content_schema?.sections ?? [];

  // Auto-generate slug dari field nama pertama yang ketemu
  const autoSlug = useCallback((contentData) => {
    // Cari field yang mungkin jadi basis slug: *_name, nama, name
    const allValues = Object.values(contentData);
    const nameKeys = ["groom_name", "bride_name", "name", "nama", "full_name", "event_name"];
    const parts = [];
    for (const key of nameKeys) {
      if (contentData[key] && typeof contentData[key] === "string") {
        parts.push(contentData[key]);
        if (parts.length >= 2) break;
      }
    }
    if (parts.length === 0) return "";
    return parts
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60);
  }, []);

  const handleFieldChange = (key, value) => {
    const newContent = { ...content, [key]: value };
    onChange(newContent);
    // Auto-update slug kalau user belum edit manual
    const generated = autoSlug(newContent);
    if (generated) onSlugChange(generated);
  };

  if (sections.length === 0) return (
    <div className="text-center py-16 text-gray-400">
      <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
      <p className="text-sm">Template ini tidak memiliki content schema.</p>
    </div>
  );

  const section = sections[activeSection];
  const sectionIcon = SECTION_ICONS[section?.icon] ?? SECTION_ICONS.default;
  const filledCount = section?.fields?.filter((f) => content[f.key] != null && content[f.key] !== "").length ?? 0;
  const totalCount  = section?.fields?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Isi Data Undangan</h2>
        <p className="text-sm text-gray-500 mt-1">
          Template: <span className="font-semibold text-gray-700">{template.name}</span>
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {sections.map((sec, idx) => {
          const filled = sec.fields?.filter((f) => content[f.key] != null && content[f.key] !== "").length ?? 0;
          const total  = sec.fields?.length ?? 0;
          const done   = filled === total && total > 0;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                ${activeSection === idx
                  ? "bg-gray-900 text-white"
                  : done
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >
              <span>{SECTION_ICONS[sec.icon] ?? SECTION_ICONS.default}</span>
              {sec.label}
              {done && activeSection !== idx && <Check className="w-3 h-3" />}
            </button>
          );
        })}
      </div>

      {/* Active section form */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Section header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{sectionIcon}</span>
            <div>
              <p className="font-semibold text-gray-900">{section.label}</p>
              <p className="text-xs text-gray-400">{filledCount}/{totalCount} field terisi</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all"
              style={{ width: `${totalCount > 0 ? (filledCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Fields */}
        <div className="p-6 space-y-5">
          {section.fields?.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {field.label}
                {field.required && <span className="text-red-400">*</span>}
              </label>
              <DynamicField
                field={field}
                value={content[field.key]}
                onChange={(val) => handleFieldChange(field.key, val)}
              />
              {field.max_length && typeof content[field.key] === "string" && (
                <p className="text-[10px] text-gray-400 text-right">
                  {content[field.key]?.length ?? 0}/{field.max_length}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Prev / Next section */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
          <button
            onClick={() => setActiveSection((p) => Math.max(0, p - 1))}
            disabled={activeSection === 0}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Sebelumnya
          </button>
          <button
            onClick={() => setActiveSection((p) => Math.min(sections.length - 1, p + 1))}
            disabled={activeSection === sections.length - 1}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"
          >
            Selanjutnya <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slug section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> Link Undangan
        </label>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent">
          <span className="px-3 py-2.5 text-xs text-gray-400 bg-gray-50 border-r border-gray-200 font-mono whitespace-nowrap">
            sebar.in/
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) =>
              onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            placeholder="nama-kamu-undangan"
            className="flex-1 px-3 py-2.5 text-sm font-mono outline-none bg-white"
          />
          <button
            onClick={() => {
              const gen = autoSlug(content);
              if (gen) onSlugChange(gen);
            }}
            className="px-3 py-2.5 text-gray-400 hover:text-gray-700 transition-colors border-l border-gray-200"
            title="Generate ulang dari nama"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400">
          Auto-generate dari nama · bisa diedit manual · hanya huruf, angka, dan tanda "-"
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 3 — Review & Publish
// ─────────────────────────────────────────────────────────────
function StepReview({ template, content, slug, onPublish, saving }) {
  const sections = template?.content_schema?.sections ?? [];
  const totalFields    = sections.flatMap((s) => s.fields ?? []).length;
  const requiredFields = sections.flatMap((s) => s.fields ?? []).filter((f) => f.required);
  const missingRequired = requiredFields.filter((f) => !content[f.key] || content[f.key] === "");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review & Publish</h2>
        <p className="text-sm text-gray-500 mt-1">Periksa sebelum undangan dipublikasikan.</p>
      </div>

      {/* Summary card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          {template.preview_image_url ? (
            <img src={template.preview_image_url} className="w-12 h-16 object-cover rounded-lg" />
          ) : (
            <div className="w-12 h-16 rounded-lg flex items-center justify-center text-2xl"
              style={{ backgroundColor: template.color_palette?.[0] ?? "#f3f4f6" }}>
              {SECTION_ICONS[template.category] ?? "✦"}
            </div>
          )}
          <div>
            <p className="font-bold text-gray-900">{template.name}</p>
            <p className="text-xs text-gray-400">{CATEGORY_LABELS[template.category]}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xl font-bold text-gray-900">
              {sections.flatMap((s) => s.fields ?? []).filter((f) => content[f.key] != null && content[f.key] !== "").length}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Field terisi</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xl font-bold text-gray-900">{totalFields}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Total field</p>
          </div>
          <div className={`rounded-xl p-3 ${missingRequired.length === 0 ? "bg-emerald-50" : "bg-red-50"}`}>
            <p className={`text-xl font-bold ${missingRequired.length === 0 ? "text-emerald-700" : "text-red-600"}`}>
              {missingRequired.length === 0 ? "✓" : missingRequired.length}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {missingRequired.length === 0 ? "Wajib oke" : "Wajib kosong"}
            </p>
          </div>
        </div>

        {/* Missing required fields warning */}
        {missingRequired.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Field wajib yang masih kosong:
            </p>
            <ul className="space-y-0.5">
              {missingRequired.map((f) => (
                <li key={f.key} className="text-xs text-amber-600 font-mono">· {f.label}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Link preview */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Link Undangan</p>
            <p className="text-sm font-mono text-gray-900 mt-0.5">sebar.in/{slug || "..."}</p>
          </div>
          {slug && (
            <a
              href={`/${slug}?preview=1`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </a>
          )}
        </div>
      </div>

      {/* Publish button */}
      <button
        onClick={onPublish}
        disabled={saving || !slug || missingRequired.length > 0}
        className="w-full py-4 rounded-2xl text-sm font-bold transition-all
                   bg-gray-900 text-white hover:bg-gray-700
                   disabled:opacity-40 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2 shadow-lg shadow-gray-900/10"
      >
        {saving
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
          : <><Sparkles className="w-4 h-4" /> Publish Undangan</>}
      </button>

      {missingRequired.length > 0 && (
        <p className="text-center text-xs text-gray-400">
          Lengkapi field wajib terlebih dahulu untuk bisa publish.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP INDICATOR
// ─────────────────────────────────────────────────────────────
function StepIndicator({ current, steps }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className={`flex items-center gap-2 px-1`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${i < current  ? "bg-gray-900 text-white"
              : i === current ? "bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-2"
              :                 "bg-gray-100 text-gray-400"}`}
            >
              {i < current ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block transition-colors
              ${i === current ? "text-gray-900" : "text-gray-400"}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-px mx-1 transition-colors ${i < current ? "bg-gray-900" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN BUILDER
// ─────────────────────────────────────────────────────────────
function BuilderForm() {
  const { user } = useAuth();
  const supabase  = createClient();
  const router    = useRouter();
  const searchParams = useSearchParams();
  const orderId   = searchParams.get("order");

  const [step, setStep]                 = useState(0);
  const [selectedTemplate, setTemplate] = useState(null);
  const [content, setContent]           = useState({});
  const [slug, setSlug]                 = useState("");
  const [invitationId, setInvitationId] = useState(null);
  const [initLoading, setInitLoading]   = useState(true);
  const [saving, setSaving]             = useState(false);

  const STEPS = ["Pilih Template", "Isi Data", "Review"];

  // Load existing invitation kalau sudah ada
  // Perbaikan Initial Load di BuilderForm
    useEffect(() => {
    if (!user || !orderId) { 
        setInitLoading(false); 
        return; 
    }

    const load = async () => {
        const { data, error } = await supabase
        .from("invitations")
        .select(`
            *,
            template:templates (
            id, name, slug, category, is_premium, 
            preview_image_url, color_palette, tags, 
            description, content_schema, default_content,
            current_version
            )
        `) // Gunakan alias singular 'template' untuk mempermudah akses
        .eq("order_id", orderId)
        .maybeSingle(); // Pakai maybeSingle agar tidak error jika data belum ada

        if (data) {
        setInvitationId(data.id);
        setSlug(data.slug ?? "");
        setContent(data.content ?? {});
        if (data.template) {
            setTemplate(data.template);
            setStep(1); // Resume ke langkah isi data
        }
        }
        setInitLoading(false);
    };
    load();
    }, [user, orderId]);

  const handleSelectTemplate = (tmpl) => {
    setTemplate(tmpl);
    // Reset content ke default_content template kalau ganti template
    setContent(tmpl.default_content ?? {});
    setSlug("");
  };

  const handlePublish = async () => {
    if (!selectedTemplate || !slug) return;
    setSaving(true);

    // Payload disesuaikan dengan schema
    const payload = {
        user_id:          user.id,
        order_id:         orderId,
        slug:             slug.trim().toLowerCase(),
        template_id:      selectedTemplate.id,
        template_version: selectedTemplate.current_version ?? 1,
        content:          content,
        is_published:     true,
        updated_at:       new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from("invitations")
        .upsert(
        invitationId 
            ? { id: invitationId, ...payload } 
            : payload,
        { onConflict: 'slug' } // Menangani duplikasi slug
        )
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
        alert("Maaf, link (slug) sudah digunakan. Coba ganti yang lain.");
        } else {
        alert("Gagal menyimpan: " + error.message);
        }
    } else {
        router.push(`/dashboard/user/orders?published=${data.slug}`);
    }
    setSaving(false);
    };

  if (initLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-gray-400 w-6 h-6" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 pb-24 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/user/orders"
          className="text-sm text-gray-400 flex items-center gap-1.5 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Kembali
        </Link>
        <StepIndicator current={step} steps={STEPS} />
        {/* Spacer */}
        <div className="w-16" />
      </div>

      {/* Step content */}
      {step === 0 && (
        <StepChooseTemplate
          selectedId={selectedTemplate?.id}
          onSelect={handleSelectTemplate}
        />
      )}
      {step === 1 && selectedTemplate && (
        <StepFillContent
          template={selectedTemplate}
          content={content}
          onChange={setContent}
          slug={slug}
          onSlugChange={setSlug}
        />
      )}
      {step === 2 && selectedTemplate && (
        <StepReview
          template={selectedTemplate}
          content={content}
          slug={slug}
          onPublish={handlePublish}
          saving={saving}
        />
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 px-4 py-3 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold
                       border border-gray-200 text-gray-600 hover:bg-gray-50
                       disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Sebelumnya
          </button>

          {step < 2 ? (
            <button
              onClick={() => setStep((s) => Math.min(2, s + 1))}
              disabled={step === 0 && !selectedTemplate}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold
                         bg-gray-900 text-white hover:bg-gray-700
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {step === 0 ? "Pakai Template Ini" : "Lanjut Review"}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={saving || !slug}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold
                         bg-gray-900 text-white hover:bg-gray-700
                         disabled:opacity-40 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {saving ? "Menyimpan..." : "Publish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-gray-400 w-6 h-6" />
      </div>
    }>
      <BuilderForm />
    </Suspense>
  );
}