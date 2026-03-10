"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

// ─── Arsitektur Iframe: Render Dokumen Terisolasi ────────────────────────
// Menggunakan importmap untuk resolusi modul ESM langsung di browser.
// Inject data melalui variabel global untuk memisahkan data dari logika komponen.
function buildIframeHTML(compiledJsUrl, content, guest, rsvp, origin) {
  const contentJson = JSON.stringify(content ?? {});
  const guestJson   = JSON.stringify(guest   ?? { name: "Tamu Undangan" });
  const rsvpJson    = JSON.stringify(rsvp    ?? { enabled: false });

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview Template</title>

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
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="module">
    // FIX: Expose React ke global window untuk kompatibilitas classic JSX transform
    import * as React from "react";
    window.React = React; 

    import { createRoot } from "react-dom/client";

    const CONTENT = ${contentJson};
    const GUEST   = ${guestJson};
    const RSVP    = ${rsvpJson};

    async function renderTemplate() {
      try {
        // Dynamic import modul yang dikompilasi dari Supabase Storage
        const mod = await import(${JSON.stringify(compiledJsUrl)});
        const TemplateComponent = mod.default;

        if (!TemplateComponent) {
          throw new Error("Template tidak mengekspor default component.");
        }

        const root = createRoot(document.getElementById("root"));
        root.render(
          React.createElement(TemplateComponent, {
            content: CONTENT,
            guest:   GUEST,
            rsvp:    RSVP,
            onRsvp:  (status, msg) => {
              // SECURITY: Gunakan origin spesifik untuk postMessage, bukan "*"
              window.parent.postMessage(
                { type: "RSVP_ACTION", status, msg }, 
                "${origin}"
              );
            }
          })
        );
      } catch (err) {
        console.error("Iframe Render Error:", err);
        document.getElementById("root").innerHTML = \`
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:12px;font-family:sans-serif;padding:24px;text-align:center">
            <div style="font-size:32px">⚠️</div>
            <p style="font-weight:bold;color:#111;font-size:14px">Gagal render template</p>
            <p style="color:#888;font-size:12px;max-width:280px">\${err.message}</p>
          </div>
        \`;
      }
    }

    renderTemplate();
  </script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
export default function TemplatePreviewPage({ params }) {
  const { slug }  = use(params);
  const supabase  = createClient();

  const [templateData, setTemplateData] = useState(null);
  const [iframeHtml, setIframeHtml]     = useState(null);
  const [content, setContent]           = useState({});
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // ── Init & Message Listener ──
  useEffect(() => {
    initPreview();

    const handleMessage = (event) => {
      // SECURITY: Verifikasi origin untuk mencegah injeksi event dari sumber tak dikenal
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "UPDATE_PREVIEW" && event.data.content) {
        setContent(event.data.content);
        setTemplateData((prev) => {
          if (!prev) return prev;
          rebuildIframe(prev, event.data.content);
          return prev;
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [slug]);

  // ── Cleanup Blob URL ──
  // PERFORMANCE: Mencegah memory leak secara agresif saat komponen di-unmount 
  // atau saat iframeHtml berubah.
  useEffect(() => {
    return () => {
      if (iframeHtml) URL.revokeObjectURL(iframeHtml);
    };
  }, [iframeHtml]);

  const initPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: tmpl, error: fetchErr } = await supabase
        .from("templates")
        .select("*")
        .eq("slug", slug)
        .single();

      if (fetchErr || !tmpl) throw new Error("Template tidak ditemukan di database.");
      if (!tmpl.compiled_js_path) throw new Error("File kompilasi template (JS) belum tersedia.");

      setTemplateData(tmpl);
      setContent(tmpl.default_content ?? {});

      const { data: signedData, error: signErr } = await supabase.storage
        .from("templates-source")
        .createSignedUrl(tmpl.compiled_js_path, 3600); // Expiry: 1 jam

      if (signErr || !signedData?.signedUrl) {
        throw new Error("Gagal membuat Signed URL: " + signErr?.message);
      }

      await buildAndSetIframe(tmpl.default_content ?? {}, signedData.signedUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildAndSetIframe = async (contentData, compiledUrl) => {
    setIframeHtml((prev) => {
      if (prev) URL.revokeObjectURL(prev); // Bersihkan sisa Blob lama
      return null;
    });

    const html = buildIframeHTML(
      compiledUrl,
      contentData,
      { name: "Tamu Undangan" },
      { enabled: false },
      window.location.origin // Pass origin untuk keamanan postMessage
    );

    const blob = new Blob([html], { type: "text/html" });
    setIframeHtml(URL.createObjectURL(blob));
  };

  const rebuildIframe = async (tmpl, newContent) => {
    if (!tmpl.compiled_js_path) return;
    try {
      const { data: signedData } = await supabase.storage
        .from("templates-source")
        .createSignedUrl(tmpl.compiled_js_path, 3600);
      
      if (signedData?.signedUrl) {
        await buildAndSetIframe(newContent, signedData.signedUrl);
      }
    } catch (err) {
      console.error("Gagal melakukan rebuild iframe:", err);
    }
  };

  // ── Render States ──
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-gray-900" size={28} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Memuat Arsitektur...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-10 text-center space-y-4">
        <AlertCircle className="text-red-400" size={36} />
        <div>
          <h2 className="font-bold text-gray-900 text-xs uppercase tracking-widest">Gagal Memuat</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-xs">{error}</p>
        </div>
        <button
          onClick={initPreview}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl transition-transform hover:scale-105"
        >
          <RefreshCw size={12} /> Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden">
      {iframeHtml ? (
        <iframe
          src={iframeHtml}
          className="w-full h-full border-0"
          title={`Preview: ${templateData?.name}`}
          sandbox="allow-scripts allow-same-origin"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      )}

      {/* Badge Overlay */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="bg-black/80 backdrop-blur-xl text-white text-[9px] font-bold px-4 py-2 rounded-full uppercase tracking-[0.3em] shadow-2xl border border-white/10">
          Preview Mode · {templateData?.name}
        </div>
      </div>
    </div>
  );
}