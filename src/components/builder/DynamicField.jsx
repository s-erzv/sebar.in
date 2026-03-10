"use client";

import { Paperclip, X, Music, Loader2 } from "lucide-react";
import { useState } from "react";

export default function DynamicField({ field, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const base = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white";

  const handleFileUpload = async (e, type = "image") => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    
    // Untuk saat ini kita gunakan object URL untuk preview lokal
    // Di level Page.jsx nanti akan di-upload beneran ke Supabase Storage
    if (type === "image_multiple") {
      onChange([...(value ?? []), ...files.map((f) => ({ file: f, url: URL.createObjectURL(f) }))]);
    } else {
      onChange({ file: files[0], url: URL.createObjectURL(files[0]) });
    }
  };

  const getDisplayValue = (val) => {
    if (typeof val === 'string') return val;
    return val?.url || "";
  };

  switch (field.type) {
    case "text":
      return <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ?? ""} maxLength={field.max_length} className={base} />;
    case "textarea":
      return <textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ?? ""} maxLength={field.max_length} className={`${base} resize-none`} />;
    case "image":
      const imgUrl = getDisplayValue(value);
      return (
        <div className="space-y-2">
          {imgUrl && (
            <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-gray-200">
              <img src={imgUrl} alt="preview" className="w-full h-full object-cover" />
              <button onClick={() => onChange(null)}
                className="absolute top-1 right-1 w-5 h-5 bg-gray-900/70 rounded-full text-white flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-gray-500 hover:text-gray-700 transition-colors">
            <Paperclip className="w-3 h-3" /> {imgUrl ? "Ganti foto" : "Upload foto"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "image")} />
          </label>
        </div>
      );
    case "audio":
      const audioUrl = getDisplayValue(value);
      return (
        <div className="space-y-2">
          {audioUrl && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Music className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-900 truncate">{typeof value === 'string' ? 'Audio terpasang' : value.file?.name}</p>
                <audio src={audioUrl} controls className="h-6 w-full mt-1 scale-90 origin-left" />
              </div>
              <button onClick={() => onChange(null)} className="text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {!audioUrl && (
            <label className="flex items-center gap-2 cursor-pointer w-full px-4 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-bold text-gray-400 hover:border-gray-900 hover:text-gray-900 transition-all justify-center bg-gray-50/50">
              <Music className="w-4 h-4" /> Upload Musik (MP3)
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, "audio")} />
            </label>
          )}
        </div>
      );
    default:
      return <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={base} />;
  }
}
