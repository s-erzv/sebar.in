"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";

function buildIframeHTML(compiledJsUrl, content, origin) {
  const contentJson = JSON.stringify(content ?? {});
  const guestJson   = JSON.stringify({ name: "Tamu Undangan" });
  const rsvpJson    = JSON.stringify({ enabled: false });

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
    body { margin: 0; padding: 0; background-color: #ffffff; overflow-x: hidden; }
    /* Hide scrollbar for Chrome, Safari and Opera */
    body::-webkit-scrollbar { display: none; }
    /* Hide scrollbar for IE, Edge and Firefox */
    body { -ms-overflow-style: none;  scrollbar-width: none; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import * as React from "react";
    window.React = React; 
    import { createRoot } from "react-dom/client";

    const CONTENT = ${contentJson};
    const GUEST   = ${guestJson};
    const RSVP    = ${rsvpJson};

    async function renderTemplate() {
      try {
        const mod = await import(${JSON.stringify(compiledJsUrl)});
        const TemplateComponent = mod.default;
        if (!TemplateComponent) throw new Error("No default export");

        const root = createRoot(document.getElementById("root"));
        root.render(
          React.createElement(TemplateComponent, {
            content: CONTENT,
            guest:   GUEST,
            rsvp:    RSVP
          })
        );
      } catch (err) {
        console.error("Render Error:", err);
        document.getElementById("root").innerHTML = '<div style="padding:20px;text-align:center;font-family:sans-serif">Error rendering template</div>';
      }
    }
    renderTemplate();
  </script>
</body>
</html>`;
}

function PreviewContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");
  const supabase = createClient();

  const [template, setTemplate] = useState(null);
  const [content, setContent] = useState(null);
  const [iframeHtml, setIframeHtml] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!templateId) return;
    const fetchTemplate = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("templates")
        .select("*")
        .eq("id", templateId)
        .single();
      
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
        if (event.data.content) {
          setContent(event.data.content);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (!template || !content) return;

    const build = async () => {
      try {
        const { data: signedData } = await supabase.storage
          .from("templates-source")
          .createSignedUrl(template.compiled_js_path, 3600);

        if (signedData?.signedUrl) {
          const html = buildIframeHTML(signedData.signedUrl, content, window.location.origin);
          const blob = new Blob([html], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          
          setIframeHtml((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        }
      } catch (err) {
        console.error("Failed to build preview:", err);
      }
    };

    build();
  }, [template, content]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-3 text-gray-400">
      <Loader2 className="animate-spin w-6 h-6" />
      <p className="text-xs font-medium">Memuat Template...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen p-6 text-center gap-3">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-sm text-gray-500">{error}</p>
    </div>
  );

  if (!content) return (
    <div className="flex flex-col items-center justify-center h-screen gap-3 text-gray-400 animate-pulse">
      <p className="text-xs font-medium uppercase tracking-widest">Menunggu Data...</p>
    </div>
  );

  return (
    <div className="w-full h-screen overflow-hidden">
      {iframeHtml && (
        <iframe
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
