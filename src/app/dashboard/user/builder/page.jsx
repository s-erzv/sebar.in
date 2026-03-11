"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Loader2, ChevronLeft, ChevronRight, Sparkles, 
  Save, ShieldAlert, CheckCircle2, Globe, 
  Users, Copy, ExternalLink, X
} from "lucide-react";
import Link from "next/link";

import StepIndicator from "@/components/builder/StepIndicator";
import StepChooseTemplate from "@/components/builder/StepChooseTemplate";
import StepFillContent from "@/components/builder/StepFillContent";
import StepReview from "@/components/builder/StepReview";
import LivePreview from "@/components/builder/LivePreview";

function BuilderForm() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const orderId = searchParams.get("order");
  const directId = searchParams.get("id");
  const isAdminEdit = searchParams.get("admin") === "true";

  const [step, setStep] = useState(0);
  const [selectedTemplate, setTemplate] = useState(null);
  const [content, setContent] = useState({});
  const [slug, setSlug] = useState("");
  const [guests, setGuests] = useState([]);
  const [invitationId, setInvitationId] = useState(null);
  const [ownerId, setOwnerId] = useState(null);
  const [planType, setPlanType] = useState("standard");
  const [initLoading, setInitLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessError, setAccessError] = useState(false);
  
  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const STEPS = ["Pilih Desain", "Isi Data Undangan", "Final Review"];
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (authLoading || !user || hasLoadedRef.current) return;

    const loadData = async () => {
      try {
        let invData = null;
        if (directId) {
          const { data } = await supabase.from("invitations").select("*, template:templates(*)").eq("id", directId).single();
          invData = data;
        } else if (orderId) {
          const { data: orderData } = await supabase.from("orders").select("plan_type, user_id").eq("id", orderId).maybeSingle();
          if (orderData) { setPlanType(orderData.plan_type); setOwnerId(orderData.user_id); }
          const { data } = await supabase.from("invitations").select("*, template:templates(*)").eq("order_id", orderId).maybeSingle();
          invData = data;
        }

        if (invData) {
          if (invData.user_id !== user.id && profile?.role !== "admin") { setAccessError(true); setInitLoading(false); return; }
          setInvitationId(invData.id);
          setOwnerId(invData.user_id);
          setSlug(invData.slug || "");
          setContent(invData.content || {});
          if (invData.template) { setTemplate(invData.template); setStep(1); }
          const { data: gData } = await supabase.from("guests").select("*").eq("invitation_id", invData.id);
          if (gData) setGuests(gData);
        }
        hasLoadedRef.current = true;
      } catch (err) { console.error(err); } finally { setInitLoading(false); }
    };
    loadData();
  }, [user, profile?.role, orderId, directId, authLoading]);

  const handleSelectTemplate = (tmpl) => {
    setTemplate(tmpl);
    if (Object.keys(content).length === 0) setContent(tmpl.default_content ?? {});
  };

  const handlePublish = async (isManualSave = false) => {
    if (!selectedTemplate || !slug || saving) return;
    setSaving(true);
    try {
      let finalContent = { ...content };
      const payload = {
        user_id: ownerId || user.id,
        order_id: orderId || null,
        slug: slug.trim().toLowerCase(),
        template_id: selectedTemplate.id,
        template_version: selectedTemplate.current_version ?? 1,
        content: finalContent,
        is_published: true,
        updated_at: new Date().toISOString(),
      };
      const { data: invData, error: invError } = await supabase.from("invitations").upsert(invitationId ? { id: invitationId, ...payload } : payload, { onConflict: "slug" }).select().single();
      if (invError) throw invError;
      
      if (isManualSave) { 
        alert("Tersimpan!"); 
        if (!invitationId) setInvitationId(invData.id); 
      } else { 
        if (!invitationId) setInvitationId(invData.id);
        setShowSuccessModal(true); 
      }
    } catch (error) { alert(error.message); } finally { setSaving(false); }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (initLoading || authLoading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-gray-400 w-8 h-8" /></div>;
  if (accessError) return <div className="h-screen flex flex-col items-center justify-center bg-white p-6 text-center"><ShieldAlert size={48} className="text-red-500 mb-4" /><h1 className="text-xl font-bold">Akses Ditolak</h1><Link href="/dashboard" className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg text-sm">Dashboard</Link></div>;

  const isChoosing = step === 0;
  const supportsGuests = selectedTemplate?.guest_schema?.fields?.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden">
      {/* HEADER */}
      <div className="flex h-16 items-center justify-between px-8 bg-white border-b border-gray-100 shrink-0 z-20">
        <button onClick={() => router.back()} className="text-xs font-bold text-gray-400 flex items-center gap-2 hover:text-gray-900 transition-all uppercase tracking-widest">
          <ChevronLeft size={14} /> Keluar
        </button>
        <StepIndicator current={step} steps={STEPS} />
        <div className="flex items-center gap-2">
           {isAdminEdit && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter shadow-sm border border-amber-200">Support Mode</span>}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-500 ${isChoosing ? 'w-full' : 'w-1/2 lg:w-[45%]'}`}>
          <div className={`mx-auto pb-32 ${isChoosing ? 'max-w-7xl p-10' : 'max-w-3xl p-8'}`}>
            {step === 0 && <div className="animate-in fade-in slide-in-from-bottom-4 duration-700"><StepChooseTemplate selectedId={selectedTemplate?.id} onSelect={handleSelectTemplate} planType={planType} /></div>}
            {step === 1 && selectedTemplate && <StepFillContent template={selectedTemplate} content={content} onChange={setContent} slug={slug} onSlugChange={setSlug} planType={planType} guests={guests} onGuestsChange={setGuests} />}
            {step === 2 && selectedTemplate && <StepReview template={selectedTemplate} content={content} slug={slug} onPublish={() => handlePublish(false)} saving={saving} />}
          </div>
        </div>

        {!isChoosing && (
          <div className="w-1/2 lg:w-[55%] bg-gray-50 border-l border-gray-100 hidden md:block animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="h-full w-full sticky top-0 p-10"><LivePreview content={content} template={selectedTemplate} /></div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="h-20 bg-white/80 backdrop-blur-md border-t border-gray-100 px-8 flex items-center justify-between shrink-0 z-20">
        <button onClick={() => setStep(s => Math.max(0, s-1))} disabled={step === 0} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-900 disabled:opacity-20 uppercase tracking-widest"><ChevronLeft size={16} /> Sebelumnya</button>
        <div className="flex items-center gap-3">
          {invitationId && step === 1 && <button onClick={() => handlePublish(true)} disabled={saving} className="px-6 py-2.5 rounded-xl text-xs font-bold border border-gray-200 text-gray-900 hover:bg-gray-50 flex items-center gap-2">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} SIMPAN DRAFT</button>}
          <button onClick={() => step < 2 ? setStep(s => s+1) : handlePublish(false)} disabled={(step === 0 && !selectedTemplate) || saving} className="px-10 py-3 bg-gray-900 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-40">{step === 0 ? "Konfirmasi Desain" : step === 1 ? "Review Undangan" : (saving ? "Menyimpan..." : "Publish Sekarang")}</button>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-500">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Undangan Siap!</h2>
                <p className="text-sm text-gray-500 mt-2">Undangan Anda telah berhasil dipublikasikan dan sudah bisa diakses online.</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Link Undangan Anda:</p>
                <div className="flex items-center justify-between gap-3 bg-white p-2 pl-4 rounded-xl border border-gray-200">
                  <span className="text-xs font-mono text-gray-600 truncate">sebar.in/{slug}</span>
                  <button onClick={copyLink} className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                    {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <a href={`/${slug}`} target="_blank" className="flex items-center justify-center gap-2 w-full py-3.5 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition-all">
                  <Globe size={18} /> Lihat Undangan <ExternalLink size={14} />
                </a>
                
                {supportsGuests && (
                  <Link href={`/dashboard/user/builder/guests?id=${invitationId}`} className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-50 text-blue-600 rounded-2xl text-sm font-bold hover:bg-blue-100 transition-all border border-blue-100">
                    <Users size={18} /> Kelola Daftar Tamu
                  </Link>
                )}

                <button onClick={() => router.push(isAdminEdit ? "/dashboard/admin/invitations" : "/dashboard/user/orders")} className="text-xs font-bold text-gray-400 hover:text-gray-600 py-2 uppercase tracking-widest">
                  Kembali ke Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-gray-400 w-8 h-8" /></div>}>
      <BuilderForm />
    </Suspense>
  );
}