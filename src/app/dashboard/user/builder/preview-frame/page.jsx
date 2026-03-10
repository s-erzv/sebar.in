// src/app/dashboard/user/builder/preview-frame/page.jsx
"use client";
import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";

function buildIframeHTML(compiledJsUrl, initialContent, origin) {
  const contentJson = JSON.stringify(initialContent ?? {});
  const brandColors = initialContent?.brand_colors || [];

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    // Konfigurasi Tailwind agar mendukung variabel CSS kita
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              primary: 'var(--brand-primary)',
              secondary: 'var(--brand-secondary)',
              accent: 'var(--brand-accent)',
              1: 'var(--brand-1)',
              2: 'var(--brand-2)',
              3: 'var(--brand-3)',
              4: 'var(--brand-4)',
              5: 'var(--brand-5)',
            }
          }
        }
      }
    }
  </script>
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
  <style id="brand-variables">
    :root {
      --brand-primary: ${brandColors[0] || '#000000'};
      --brand-secondary: ${brandColors[1] || '#666666'};
      --brand-accent: ${brandColors[2] || '#999999'};
      ${brandColors.map((c, i) => `--brand-${i + 1}: ${c};`).join(' ')}
    }
  </style>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background-color: #ffffff; overflow-x: hidden; }
    body::-webkit-scrollbar { display: none; }
    body { -ms-overflow-style: none;  scrollbar-width: none; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import * as React from "react";
    window.React = React; 
    import { createRoot } from "react-dom/client";

    let root = null;
    let TemplateComponent = null;

    // Fungsi update warna yang lebih solid
    window.updateBrandColors = (colors) => {
      const styleEl = document.getElementById('brand-variables');
      if (!styleEl || !colors) return;
      
      let vars = \`--brand-primary: \${colors[0] || '#000000'};\`;
      vars += \`--brand-secondary: \${colors[1] || '#666666'};\`;
      vars += \`--brand-accent: \${colors[2] || '#999999'};\`;
      colors.forEach((c, i) => {
        vars += \`--brand-\${i + 1}: \${c};\`;
      });
      
      styleEl.innerHTML = \`:root { \${vars} }\`;
    };

    window.renderWithData = (content) => {
      if (!TemplateComponent || !root) return;
      
      // Update warna dulu
      if (content.brand_colors) {
        window.updateBrandColors(content.brand_colors);
      }

      // Re-render React
      root.render(
        React.createElement(TemplateComponent, {
          content: content,
          guest:   { name: "Tamu Undangan" },
          rsvp:    { enabled: false }
        })
      );
    };

    async function init() {
      try {
        const mod = await import(${JSON.stringify(compiledJsUrl)});
        TemplateComponent = mod.default;
        root = createRoot(document.getElementById("root"));
        window.renderWithData(${contentJson});
      } catch (err) {
        console.error("Iframe Init Error:", err);
      }
    }
    init();
  </script>
</body>
</html>`;
}

function PreviewContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");
  const supabase = createClient();
  const iframeRef = useRef(null);

  const [template, setTemplate] = useState(null);
  const [content, setContent] = useState(null);
  const [iframeHtml, setIframeHtml] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!templateId) return;
    const fetchTemplate = async () => {
      setLoading(true);
      const { data, error: err } = await supabase.from("templates").select("*").eq("id", templateId).single();
      if (err) setError(err.message);
      else setTemplate(data);
      setLoading(false);
    };
    fetchTemplate();
  }, [templateId]);

  useEffect(() => {
    window.parent.postMessage({ type: "IFRAME_READY" }, "*");

    const handleMessage = (event) => {
      if (event.data.type === "UPDATE_INVITATION_DATA") {
        const newContent = event.data.content;
        if (newContent) {
          setContent(newContent);
          // Kirim data ke fungsi internal iframe
          if (iframeRef.current?.contentWindow?.renderWithData) {
            iframeRef.current.contentWindow.renderWithData(newContent);
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (!template || !content || iframeHtml) return;

    const buildInitial = async () => {
      try {
        const { data: signedData } = await supabase.storage.from("templates-source").createSignedUrl(template.compiled_js_path, 3600);
        if (signedData?.signedUrl) {
          const html = buildIframeHTML(signedData.signedUrl, content, window.location.origin);
          const blob = new Blob([html], { type: "text/html" });
          setIframeHtml(URL.createObjectURL(blob));
        }
      } catch (err) { console.error(err); }
    };
    buildInitial();
  }, [template, !!content]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-3 text-gray-400">
      <Loader2 className="animate-spin w-6 h-6" />
      <p className="text-xs font-bold uppercase tracking-widest">Memuat Arsitektur...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen p-6 text-center gap-3">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-sm font-bold text-gray-500">{error}</p>
    </div>
  );

  return (
    <div className="w-full h-screen overflow-hidden">
      {iframeHtml && (
        <iframe
          ref={iframeRef}
          src={iframeHtml}
          className="w-full h-full border-0"
          title="Template Content"
          sandbox="allow-scripts allow-same-origin"
        />
      )}
    </div>
  );
}

export default function PreviewFrame() {
  return (
    <Suspense fallback={null}>
      <PreviewContent />
    </Suspense>
  );
}
