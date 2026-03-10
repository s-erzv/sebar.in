"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, RefreshCw, Mail, Eye, X } from "lucide-react";

// ─── Arsitektur Iframe: Render Dokumen Terisolasi ────────────────────────
function buildIframeHTML(compiledJsUrl, content, guest, origin) {
  const contentJson = JSON.stringify(content ?? {});
  const guestJson   = JSON.stringify(guest   ?? { name: "Tamu Undangan" });

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script type="importmap">
  {
    "imports": {
      "react":            "https://esm.sh/react@18.3.1",
      "react/jsx-runtime":"https://esm.sh/react@18.3.1/jsx-runtime",
      "react-dom":        "https://esm.sh/react-dom@18.3.1",
      "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
      "framer-motion":    "https://esm.sh/framer-motion@11.0.0",
      "date-fns":         "https://esm.sh/date-fns@3.6.0",
      "date-fns/locale":  "https://esm.sh/date-fns@3.6.0/locale",
      "react-countdown":  "https://esm.sh/react-countdown@2.3.5"
    }
  }
  </script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background-color: #ffffff; }
    body::-webkit-scrollbar { display: none; }
    body { -ms-overflow-style: none; scrollbar-width: none; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import * as React from "react";
    window.React = React; 
    import { createRoot } from "react-dom/client";

    async function renderTemplate() {
      try {
        const mod = await import(${JSON.stringify(compiledJsUrl)});
        const TemplateComponent = mod.default;
        const root = createRoot(document.getElementById("root"));
        root.render(
          React.createElement(TemplateComponent, {
            content: ${contentJson},
            guest:   ${guestJson},
            onRsvp:  (status, msg) => {
              window.parent.postMessage({ type: "OPEN_RSVP" }, "${origin}");
            }
          })
        );
      } catch (err) {
        console.error("Iframe Render Error:", err);
      }
    }
    renderTemplate();
  </script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// PREVIEW BANNER (saat mode preview dari builder)
// ─────────────────────────────────────────────────────────────
function PreviewBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-400 text-amber-900 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-2">
        <Eye className="w-3.5 h-3.5" />
        <span>Mode Preview — Data belum dipublikasikan</span>
      </div>
      <button onClick={() => setVisible(false)} className="ml-2 opacity-70 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ERROR STATE
// ─────────────────────────────────────────────────────────────
function ErrorState({ message, icon: Icon = Mail }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 gap-4">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <div>
        <h1 className="text-lg font-bold text-gray-800">Undangan tidak ditemukan</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-xs">{message}</p>
      </div>
    </div>
  );
}

function InvitationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const guestName = searchParams.get("to") || "Tamu Undangan";
  const isPreview = searchParams.get("source") === "local";
  
  const supabase = createClient();
  const [invitation, setInvitation] = useState(null);
  const [iframeHtml, setIframeHtml] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const init = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Ambil data undangan
      const { data: inv, error: invErr } = await supabase
        .from("invitations")
        .select(`
          *,
          template:templates(*)
        `)
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (invErr) throw invErr;
      if (!inv) throw new Error("Undangan tidak ditemukan atau belum dipublikasikan.");

      setInvitation(inv);

      // 2. Ambil Signed URL untuk file JS template
      const { data: signedData, error: signErr } = await supabase.storage
        .from("templates-source")
        .createSignedUrl(inv.template.compiled_js_path, 3600);

      if (signErr || !signedData?.signedUrl) throw new Error("Gagal memuat template.");

      // 3. Bangun Iframe
      const html = buildIframeHTML(
        signedData.signedUrl,
        inv.content,
        { name: guestName },
        window.location.origin
      );

      const blob = new Blob([html], { type: "text/html" });
      if (iframeHtml) URL.revokeObjectURL(iframeHtml);
      setIframeHtml(URL.createObjectURL(blob));

      // 4. Update View Count (Optional)
      await supabase.rpc('increment_view_count', { inv_id: inv.id });

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) init();
  }, [slug]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-gray-900" size={24} />
    </div>
  );

  if (error) return (
    <div className="h-screen flex flex-col items-center justify-center p-10 text-center gap-6">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
        <AlertCircle size={32} strokeWidth={1.5} />
      </div>
      <div>
        <h1 className="text-lg font-bold text-gray-900">Maaf, terjadi kesalahan</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-xs">{error}</p>
      </div>
      <button onClick={init} className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold transition-transform active:scale-95 shadow-lg shadow-gray-200">
        <RefreshCw size={14} /> Coba Lagi
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 w-full h-full bg-white overflow-hidden">
      {isPreview && <PreviewBanner />}
      {iframeHtml && (
        <iframe
          src={iframeHtml}
          className="w-full h-full border-0"
          title="Undangan"
          sandbox="allow-scripts allow-same-origin"
        />
      )}
    </div>
  );
}

export default function InvitationPage() {
  return (
    <Suspense fallback={null}>
      <InvitationContent />
    </Suspense>
  );
}
