"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Cari draft dari localStorage berdasarkan slug
function findDraftBySlug(slug) {
  if (typeof window === "undefined") return null;

  const keys = Object.keys(localStorage).filter((k) => k.startsWith("invitation_draft_"));

  for (const key of keys) {
    try {
      const draft = JSON.parse(localStorage.getItem(key) ?? "");
      if (draft.slug === slug) return draft;
    } catch (_) {}
  }

  // Fallback: ambil draft terbaru kalau slug belum di-set
  for (const key of keys) {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "");
    } catch (_) {}
  }

  return null;
}

export function useInvitationData(slug) {
  const searchParams = useSearchParams();
  const isLocalPreview = searchParams.get("source") === "local";
  const supabase = createClient();

  const [content, setContent]   = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (isLocalPreview) {
      // Ambil dari localStorage (mode preview builder)
      const draft = findDraftBySlug(slug);
      if (draft) {
        setContent(draft.content ?? {});
        setTemplate(draft.template ?? null);
      } else {
        setError("Draft tidak ditemukan. Buka preview dari halaman builder.");
      }
      setLoading(false);
      return;
    }

    // Fetch dari Supabase (mode normal/published)
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select(`
          *,
          template:templates (
            id, name, slug, category,
            content_schema, default_content,
            compiled_js_path, current_version
          )
        `)
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error) { setError(error.message); setLoading(false); return; }
      if (!data)  { setError("Undangan tidak ditemukan."); setLoading(false); return; }

      setContent(data.content ?? {});
      setTemplate(data.template);
      setLoading(false);
    };

    fetchData();
  }, [slug, isLocalPreview]);

  return { content, template, loading, error, isLocalPreview };
}