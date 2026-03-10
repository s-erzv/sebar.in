"use client";

import { Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { SECTION_ICONS, CATEGORY_LABELS } from "./constants";

export default function StepReview({ template, content, slug, onPublish, saving }) {
  const sections = template?.content_schema?.sections ?? [];
  const allFields = sections.flatMap((s) => s.fields ?? []);
  const requiredFields = allFields.filter((f) => f.required);
  const missingRequired = requiredFields.filter((f) => !content[f.key] || content[f.key] === "");
  const filledCount = allFields.filter((f) => content[f.key] != null && content[f.key] !== "").length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review & Publish</h2>
        <p className="text-sm text-gray-500 mt-1">Periksa sebelum undangan dipublikasikan.</p>
      </div>

      {/* Template summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          {template.preview_image_url ? (
            <img src={template.preview_image_url} className="w-12 h-16 object-cover rounded-lg" alt={template.name} />
          ) : (
            <div className="w-12 h-16 rounded-lg flex items-center justify-center text-2xl text-gray-400"
              style={{ backgroundColor: template.color_palette?.[0] ?? "#f3f4f6" }}>
              {SECTION_ICONS[template.category] ? (
                (() => {
                  const Icon = SECTION_ICONS[template.category];
                  return <Icon className="w-6 h-6" />;
                })()
              ) : (
                <Sparkles className="w-6 h-6" />
              )}
            </div>
          )}
          <div>
            <p className="font-bold text-gray-900">{template.name}</p>
            <p className="text-xs text-gray-400">{CATEGORY_LABELS[template.category]}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xl font-bold text-gray-900">{filledCount}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Field terisi</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xl font-bold text-gray-900">{allFields.length}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Total field</p>
          </div>
          <div className={`rounded-xl p-3 ${missingRequired.length === 0 ? "bg-emerald-50" : "bg-red-50"}`}>
            <p className={`text-xl font-bold ${missingRequired.length === 0 ? "text-emerald-700" : "text-red-600"}`}>
              {missingRequired.length === 0 ? <CheckCircle2 className="w-6 h-6 mx-auto" /> : missingRequired.length}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{missingRequired.length === 0 ? "Wajib oke" : "Wajib kosong"}</p>
          </div>
        </div>

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

        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Link Undangan</p>
          <p className="text-sm font-mono text-gray-900 mt-0.5">sebar.in/{slug || "..."}</p>
        </div>
      </div>

      <button onClick={onPublish} disabled={saving || !slug || missingRequired.length > 0}
        className="w-full py-4 rounded-2xl text-sm font-bold transition-all bg-gray-900 text-white hover:bg-gray-700
                   disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg">
        {saving
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
          : <><Sparkles className="w-4 h-4" /> Publish Undangan</>}
      </button>

      {missingRequired.length > 0 && (
        <p className="text-center text-xs text-gray-400">Lengkapi field wajib terlebih dahulu untuk bisa publish.</p>
      )}
    </div>
  );
}
