"use client";

import { useState, useEffect, useCallback, Suspense, use } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

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

function InvitationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const guestName = searchParams.get("to") || "Tamu Undangan";
  
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
    <div className="h-screen flex flex-col items-center justify-center p-10 text-center gap-4">
      <AlertCircle className="text-red-500" size={40} />
      <h1 className="text-lg font-bold">Maaf, terjadi kesalahan</h1>
      <p className="text-sm text-gray-500 max-w-xs">{error}</p>
      <button onClick={init} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold">
        <RefreshCw size={14} /> Coba Lagi
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 w-full h-full bg-white overflow-hidden">
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
