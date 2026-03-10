"use client";

import { useState, useCallback } from "react";
import { ChevronRight, ChevronLeft, Check, AlertCircle, RefreshCw, Globe } from "lucide-react";
import { SECTION_ICONS } from "./constants";
import DynamicField from "./DynamicField";

export default function StepFillContent({ template, content, onChange, slug, onSlugChange }) {
  const [activeSection, setActiveSection] = useState(0);
  const sections = template?.content_schema?.sections ?? [];

  const autoSlug = useCallback((contentData) => {
    const nameKeys = ["groom_name", "bride_name", "name", "nama", "full_name", "event_name"];
    const parts = [];
    for (const key of nameKeys) {
      if (contentData[key] && typeof contentData[key] === "string") {
        parts.push(contentData[key]);
        if (parts.length >= 2) break;
      }
    }
    if (!parts.length) return "";
    return parts.join("-").toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60);
  }, []);

  const handleFieldChange = (key, value) => {
    const newContent = { ...content, [key]: value };
    onChange(newContent);
    
    // Hanya auto-generate slug jika slug saat ini masih kosong
    if (!slug) {
      const gen = autoSlug(newContent);
      if (gen) onSlugChange(gen);
    }
  };

  if (!sections.length) return (
    <div className="text-center py-12 text-gray-400">
      <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
      <p className="text-sm">Template ini tidak memiliki content schema.</p>
    </div>
  );

  const section = sections[activeSection];
  const filledCount = section?.fields?.filter((f) => content[f.key] != null && content[f.key] !== "").length ?? 0;
  const totalCount = section?.fields?.length ?? 0;

  return (
    <div className="space-y-5">
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
          const total = sec.fields?.length ?? 0;
          const done = filled === total && total > 0;
          return (
            <button key={sec.id ?? idx} onClick={() => setActiveSection(idx)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all
                ${activeSection === idx ? "bg-gray-900 text-white"
                  : done ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              {SECTION_ICONS[sec.icon] ? (
                (() => {
                  const Icon = SECTION_ICONS[sec.icon];
                  return <Icon className="w-3.5 h-3.5" />;
                })()
              ) : (
                <SECTION_ICONS.default className="w-3.5 h-3.5" />
              )}
              {sec.label}
              {done && activeSection !== idx && <Check className="w-3 h-3" />}
            </button>
          );
        })}
      </div>

      {/* Fields card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-gray-900">
              {SECTION_ICONS[section?.icon] ? (
                (() => {
                  const Icon = SECTION_ICONS[section.icon];
                  return <Icon className="w-4 h-4" />;
                })()
              ) : (
                <SECTION_ICONS.default className="w-4 h-4" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{section.label}</p>
              <p className="text-xs text-gray-400">{filledCount}/{totalCount} terisi</p>
            </div>
          </div>
          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-900 rounded-full transition-all"
              style={{ width: `${totalCount > 0 ? (filledCount / totalCount) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="p-5 space-y-4">
          {section.fields?.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {field.label}
                {field.required && <span className="text-red-400">*</span>}
              </label>
              <DynamicField field={field} value={content[field.key]} onChange={(val) => handleFieldChange(field.key, val)} />
              {field.max_length && typeof content[field.key] === "string" && (
                <p className="text-[10px] text-gray-400 text-right">{content[field.key]?.length ?? 0}/{field.max_length}</p>
              )}
            </div>
          ))}
        </div>

        <div className="px-5 py-3.5 border-t border-gray-100 flex justify-between">
          <button onClick={() => setActiveSection((p) => Math.max(0, p - 1))} disabled={activeSection === 0}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
          </button>
          <button onClick={() => setActiveSection((p) => Math.min(sections.length - 1, p + 1))} disabled={activeSection === sections.length - 1}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors">
            Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Slug */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <Globe className="w-3 h-3" /> Link Undangan
        </label>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent">
          <span className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-r border-gray-200 font-mono whitespace-nowrap">
            sebar.in/
          </span>
          <input type="text" value={slug}
            onChange={(e) => onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="nama-undangan"
            className="flex-1 px-3 py-2 text-sm font-mono outline-none bg-white" />
          <button onClick={() => { const gen = autoSlug(content); if (gen) onSlugChange(gen); }}
            className="px-3 py-2 text-gray-400 hover:text-gray-700 transition-colors border-l border-gray-200">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400">Auto-generate dari nama · hanya huruf kecil, angka, dan tanda "-"</p>
      </div>
    </div>
  );
}
