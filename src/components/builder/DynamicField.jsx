"use client";

import { Paperclip, X } from "lucide-react";

export default function DynamicField({ field, value, onChange }) {
  const base = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white";

  const handleFileUpload = (e, multiple = false) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (multiple) {
      onChange([...(value ?? []), ...files.map((f) => URL.createObjectURL(f))]);
    } else {
      onChange(URL.createObjectURL(files[0]));
    }
  };

  switch (field.type) {
    case "text":
      return <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ?? ""} maxLength={field.max_length} className={base} />;
    case "textarea":
      return <textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ?? ""} maxLength={field.max_length} className={`${base} resize-none`} />;
    case "datetime":
      return <input type="datetime-local" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={base} />;
    case "url":
      return <input type="url" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ?? "https://"} className={`${base} font-mono text-xs`} />;
    case "number":
      return <input type="number" value={value ?? field.default ?? ""} onChange={(e) => onChange(Number(e.target.value))}
        min={field.min} max={field.max} className={base} />;
    case "color":
      return (
        <div className="flex items-center gap-3">
          <input type="color" value={value ?? "#000000"} onChange={(e) => onChange(e.target.value)}
            className="h-9 w-12 rounded cursor-pointer border border-gray-200" />
          <span className="text-sm font-mono text-gray-500">{value ?? "#000000"}</span>
        </div>
      );
    case "select":
      return (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={base}>
          <option value="">-- Pilih --</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
          ))}
        </select>
      );
    case "image":
      return (
        <div className="space-y-2">
          {value && (
            <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-gray-200">
              <img src={value} alt="preview" className="w-full h-full object-cover" />
              <button onClick={() => onChange(null)}
                className="absolute top-1 right-1 w-5 h-5 bg-gray-900/70 rounded-full text-white flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-gray-500 hover:text-gray-700 transition-colors">
            <Paperclip className="w-3 h-3" /> {value ? "Ganti foto" : "Upload foto"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, false)} />
          </label>
        </div>
      );
    case "image_multiple":
      return (
        <div className="space-y-2">
          {value?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {value.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-gray-900/70 rounded-full text-white flex items-center justify-center">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {(!field.max_count || (value?.length ?? 0) < field.max_count) && (
            <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-gray-500 transition-colors">
              <Paperclip className="w-3 h-3" /> Tambah foto {field.max_count ? `(${value?.length ?? 0}/${field.max_count})` : ""}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileUpload(e, true)} />
            </label>
          )}
        </div>
      );
    default:
      return <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={base} />;
  }
}
