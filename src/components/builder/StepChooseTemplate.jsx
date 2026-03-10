"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check, Crown, Sparkles } from "lucide-react";
import Image from "next/image";
import { SECTION_ICONS, CATEGORY_LABELS } from "./constants";

export default function StepChooseTemplate({ selectedId, onSelect }) {
  const supabase = createClient();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    supabase
      .from("templates")
      .select("id, name, slug, category, is_premium, preview_image_url, color_palette, tags, description, content_schema, default_content")
      .eq("is_active", true)
      .eq("parse_status", "compiled")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
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
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Pilih Template</h2>
        <p className="text-sm text-gray-500 mt-1">Template menentukan tampilan undanganmu.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all
              ${filter === cat ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {cat === "all" ? "Semua" : CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((tmpl) => {
          const isSelected = tmpl.id === selectedId;
          return (
            <button key={tmpl.id} onClick={() => onSelect(tmpl)}
              className={`relative text-left rounded-xl overflow-hidden border-2 transition-all group
                ${isSelected ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2" : "border-gray-200 hover:border-gray-400"}`}>
              <div className="aspect-[9/14] bg-gray-100 relative overflow-hidden">
                {tmpl.preview_image_url ? (
                  <Image src={tmpl.preview_image_url} alt={tmpl.name} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 flex flex-col">
                    {(tmpl.color_palette?.length > 0 ? tmpl.color_palette : ["#f3f4f6", "#e5e7eb"])
                      .map((c, i) => <div key={i} className="flex-1" style={{ backgroundColor: c }} />)}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {SECTION_ICONS[tmpl.category] ? (
                        (() => {
                          const Icon = SECTION_ICONS[tmpl.category];
                          return <Icon className="w-8 h-8 opacity-40 text-gray-900" />;
                        })()
                      ) : (
                        <Sparkles className="w-8 h-8 opacity-40 text-gray-900" />
                      )}
                    </div>
                  </div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-gray-900/20 flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                {tmpl.is_premium && (
                  <div className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" /> PRO
                  </div>
                )}
              </div>
              <div className="p-2.5 bg-white">
                <p className="font-semibold text-gray-900 text-sm truncate">{tmpl.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{CATEGORY_LABELS[tmpl.category] ?? tmpl.category}</p>
                {tmpl.color_palette?.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {tmpl.color_palette.slice(0, 4).map((c, i) => (
                      <div key={i} className="w-3 h-3 rounded-full border border-white ring-1 ring-gray-200"
                        style={{ backgroundColor: c }} />
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
