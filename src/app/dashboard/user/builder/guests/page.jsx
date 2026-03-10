"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  Loader2, 
  ChevronLeft, 
  Search, 
  Plus, 
  Send, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink,
  Users,
  MessageCircle,
  QrCode
} from "lucide-react";
import Link from "next/link";

function GuestManagerContent() {
  const { user } = useAuth();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("id");
  const router = useRouter();

  const [invitation, setInvitation] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copyStatus, setCopyStatus] = useState(null); // ID tamu yang dicopy

  useEffect(() => {
    if (!invitationId || !user) return;

    const fetchData = async () => {
      // 1. Ambil data undangan
      const { data: inv } = await supabase
        .from("invitations")
        .select("*, template:templates(name)")
        .eq("id", invitationId)
        .single();
      
      if (inv) setInvitation(inv);

      // 2. Ambil daftar tamu
      const { data: gData } = await supabase
        .from("guests")
        .select("*")
        .eq("invitation_id", invitationId)
        .order("created_at", { ascending: false });
      
      if (gData) setGuests(gData);
      setLoading(false);
    };

    fetchData();
  }, [invitationId, user]);

  const getGuestLink = (guestName) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/${invitation?.slug}?to=${encodeURIComponent(guestName)}`;
  };

  const handleCopyLink = (guest) => {
    const link = getGuestLink(guest.name);
    navigator.clipboard.writeText(link);
    setCopyStatus(guest.id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleShareWA = (guest) => {
    const link = getGuestLink(guest.name);
    const message = `Halo ${guest.name}, kami mengundang Anda untuk hadir di acara kami. Silakan buka undangan digital kami melalui link berikut:\n\n${link}\n\nTerima kasih!`;
    const waUrl = `https://wa.me/${guest.whatsapp?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.whatsapp?.includes(search)
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Memuat Daftar Tamu...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors mb-2 uppercase tracking-widest"
          >
            <ChevronLeft className="w-4 h-4" /> Kembali
          </button>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" /> Pengelola Tamu
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Undangan: <span className="font-bold text-gray-700">{invitation?.slug}</span> ({invitation?.template?.name})
          </p>
        </div>
        <div className="flex gap-2">
          <Link 
            href={`/dashboard/user/builder?order=${invitation?.order_id}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tambah/Edit Tamu
          </Link>
        </div>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Tamu</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{guests.length}</p>
        </div>
        <div className="md:col-span-2 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center px-6">
          <Search className="w-5 h-5 text-gray-300 mr-3" />
          <input 
            type="text" 
            placeholder="Cari nama tamu atau nomor WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
          />
        </div>
      </div>

      {/* Guest List */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Tamu</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi Sebarkan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-20 text-center text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest">Belum ada tamu yang sesuai</p>
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{guest.name}</p>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5 truncate max-w-[200px]">
                        sebar.in/{invitation?.slug}?to=...
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                        {guest.whatsapp || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleCopyLink(guest)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                            ${copyStatus === guest.id ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                        >
                          {copyStatus === guest.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copyStatus === guest.id ? "Copied" : "Copy Link"}
                        </button>
                        
                        <button 
                          onClick={() => handleShareWA(guest)}
                          disabled={!guest.whatsapp}
                          className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-md shadow-green-100 disabled:opacity-30 disabled:grayscale"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Kirim WA
                        </button>

                        <Link 
                          href={getGuestLink(guest.name)}
                          target="_blank"
                          className="p-2 text-gray-300 hover:text-blue-600 transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex gap-4">
        <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
          <QrCode className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Tips Menyebarkan Undangan</h4>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            Gunakan tombol <b>Kirim WA</b> untuk mengirim pesan personal otomatis. Link yang dihasilkan sudah mengandung parameter nama tamu, sehingga saat mereka membuka undangan, nama mereka akan muncul secara otomatis di layar pembuka.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GuestManagerPage() {
  return (
    <Suspense fallback={null}>
      <GuestManagerContent />
    </Suspense>
  );
}
