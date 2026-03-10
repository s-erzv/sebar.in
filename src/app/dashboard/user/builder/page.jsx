"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ChevronLeft, ChevronRight, Sparkles, Save } from "lucide-react";
import Link from "next/link";

import StepIndicator from "@/components/builder/StepIndicator";
import StepChooseTemplate from "@/components/builder/StepChooseTemplate";
import StepFillContent from "@/components/builder/StepFillContent";
import StepReview from "@/components/builder/StepReview";
import LivePreview from "@/components/builder/LivePreview";

const LS_KEY = (orderId) => `invitation_draft_${orderId}`;

function saveDraft(orderId, data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(orderId), JSON.stringify({
      ...data,
      _savedAt: new Date().toISOString(),
    }));
  } catch (_) {}
}

function loadDraft(orderId) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY(orderId));
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function BuilderForm() {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  const [step, setStep] = useState(0);
  const [selectedTemplate, setTemplate] = useState(null);
  const [content, setContent] = useState({});
  const [slug, setSlug] = useState("");
  const [invitationId, setInvitationId] = useState(null);
  const [planType, setPlanType] = useState("standard");
  const [initLoading, setInitLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const STEPS = ["Pilih Template", "Isi Data", "Review"];

  useEffect(() => {
    if (!orderId) return;
    saveDraft(orderId, { templateId: selectedTemplate?.id, template: selectedTemplate, content, slug });
  }, [content, slug, selectedTemplate, orderId]);

  useEffect(() => {
    if (!user || !orderId) { setInitLoading(false); return; }
    const load = async () => {
      // Load order info to get plan type
      const { data: orderData } = await supabase
        .from("orders")
        .select("plan_type")
        .eq("id", orderId)
        .maybeSingle();
      
      if (orderData?.plan_type) setPlanType(orderData.plan_type);

      const { data } = await supabase
        .from("invitations")
        .select("*, template:templates(id, name, slug, category, is_premium, preview_image_url, color_palette, tags, description, content_schema, default_content, current_version)")
        .eq("order_id", orderId)
        .maybeSingle();

      if (data) {
        setInvitationId(data.id);
        // Pastikan slug terisi dari DB
        if (data.slug) setSlug(data.slug);
        setContent(data.content ?? {});
        if (data.template) { setTemplate(data.template); setStep(1); }
      } else {
        const draft = loadDraft(orderId);
        if (draft) {
          if (draft.template) { setTemplate(draft.template); setStep(1); }
          if (draft.content) setContent(draft.content);
          if (draft.slug) setSlug(draft.slug);
        }
      }
      setInitLoading(false);
    };
    load();
  }, [user, orderId]);

  const handleSelectTemplate = (tmpl) => {
    setTemplate(tmpl);
    setContent(tmpl.default_content ?? {});
    setSlug("");
  };

  const handlePublish = async (isManualSave = false) => {
    if (!selectedTemplate || !slug) return;
    setSaving(true);
    const payload = {
      user_id: user.id, order_id: orderId,
      slug: slug.trim().toLowerCase(),
      template_id: selectedTemplate.id,
      template_version: selectedTemplate.current_version ?? 1,
      content, is_published: true,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("invitations")
      .upsert(invitationId ? { id: invitationId, ...payload } : payload, { onConflict: "slug" })
      .select().single();

    if (error) {
      alert(error.code === "23505" ? "Link sudah digunakan, coba ganti." : "Gagal menyimpan: " + error.message);
    } else {
      if (orderId) localStorage.removeItem(LS_KEY(orderId));
      
      if (isManualSave) {
        // Jika manual save (klik tombol simpan di step 1), jangan redirect
        alert("Perubahan berhasil disimpan!");
        if (!invitationId) setInvitationId(data.id);
      } else {
        router.push(`/dashboard/user/orders?published=${data.slug}`);
      }
    }
    setSaving(false);
  };

  if (initLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-gray-400 w-6 h-6" />
    </div>
  );

  const showPreview = !!selectedTemplate && step < 2;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 sticky top-0 z-20">
        <Link href="/dashboard/user/orders"
          className="text-sm text-gray-400 flex items-center gap-1.5 hover:text-gray-700 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Kembali
        </Link>
        <StepIndicator current={step} steps={STEPS} />
        <div className="w-24" />
      </div>

      <div className={`flex flex-1 ${showPreview ? "divide-x divide-gray-200" : ""}`}>

        <div className={`${showPreview ? "w-1/2 xl:w-[45%]" : "w-full max-w-2xl mx-auto"} overflow-y-auto pb-28`}>
          <div className="p-6 space-y-6">
            {step === 0 && (
              <StepChooseTemplate 
                selectedId={selectedTemplate?.id} 
                onSelect={handleSelectTemplate} 
                planType={planType}
              />
            )}
            {step === 1 && selectedTemplate && (
              <StepFillContent
                template={selectedTemplate} content={content} onChange={setContent}
                slug={slug} onSlugChange={setSlug}
              />
            )}
            {step === 2 && selectedTemplate && (
              <StepReview
                template={selectedTemplate} content={content} slug={slug}
                onPublish={handlePublish} saving={saving}
              />
            )}
          </div>
        </div>

        {showPreview && (
          <div className="w-1/2 xl:w-[55%] sticky top-[57px] h-[calc(100vh-57px)] bg-gray-50">
            <LivePreview content={content} template={selectedTemplate} />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 px-6 py-3 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <ChevronLeft className="w-4 h-4" /> Sebelumnya
          </button>

          <div className="flex items-center gap-2">
            {invitationId && step === 1 && (
              <button 
                onClick={() => handlePublish(true)} 
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold border border-gray-900 text-gray-900 hover:bg-gray-50 transition-all disabled:opacity-40"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan
              </button>
            )}

            {step < 2 ? (
              <button onClick={() => setStep((s) => Math.min(2, s + 1))} disabled={step === 0 && !selectedTemplate}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {step === 0 ? "Pakai Template Ini" : "Lanjut Review"}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => handlePublish(false)} disabled={saving || !slug}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 transition-all">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (invitationId ? <Save className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />)}
                {saving ? "Menyimpan..." : (invitationId ? "Simpan Perubahan" : "Publish Undangan")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-gray-400 w-6 h-6" />
      </div>
    }>
      <BuilderForm />
    </Suspense>
  );
}
