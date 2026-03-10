"use client";

import { Check, Crown, Package, Zap, ArrowRight, ShieldCheck, MessageCircle } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    id: "standard",
    name: "Paket Standard",
    price: 150000,
    description: "Cocok untuk acara sederhana dengan fitur esensial.",
    icon: Package,
    color: "blue",
    features: ["Akses Template Standard", "Masa Aktif 1 Tahun", "Custom Nama Pengantin", "Navigasi Lokasi (Maps)", "Galeri Foto (Max 5)", "Background Musik Default"]
  },
  {
    id: "premium",
    name: "Paket Premium",
    price: 350000,
    description: "Fitur terlengkap untuk kesan undangan yang mewah.",
    icon: Crown,
    color: "amber",
    isPopular: true,
    features: ["Semua Fitur Standard", "Akses Seluruh Template Premium", "Manajemen Tamu (Guest Book)", "Custom Background Musik", "Link Unik per Tamu", "Tanpa Iklan/Watermark"]
  },
  {
    id: "custom",
    name: "Paket Custom",
    price: "Diskusikan",
    description: "Kebutuhan khusus? Kami buatkan sesuai permintaanmu.",
    icon: Zap,
    color: "purple",
    features: ["Request Desain Khusus", "Integrasi Sistem Khusus", "Domain Custom (.com/.id)", "Dedicated Project Manager", "Revisi Unlimited", "Whitelist Whitelabel"],
    isWA: true
  }
];

export default function PlansPage() {
  const waNumber = "628123456789"; 
  const waMessage = encodeURIComponent("Halo Admin SEBAR.IN, saya ingin berdiskusi mengenai Paket Custom.");

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Pilih Paket Undangan</h1>
        <p className="text-gray-500 max-w-md mx-auto font-medium">Satu kali bayar, aktif selamanya.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`relative group bg-white border-2 rounded-[3rem] p-8 transition-all hover:shadow-2xl flex flex-col ${plan.isPopular ? "border-amber-400 shadow-xl lg:scale-105 z-10" : "border-gray-100 shadow-sm"}`}>
            {plan.isPopular && <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">Paling Populer</div>}
            <div className="flex-1">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${plan.color === 'amber' ? 'bg-amber-100 text-amber-600' : plan.color === 'purple' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}><plan.icon size={28} strokeWidth={2.5} /></div>
              <h2 className="text-xl font-black text-gray-900">{plan.name}</h2>
              <p className="text-xs text-gray-500 mt-2 font-medium">{plan.description}</p>
              <div className="mt-8 flex items-baseline gap-1">
                {typeof plan.price === 'number' ? <><span className="text-xs font-bold text-gray-400">Rp</span><span className="text-4xl font-black text-gray-900 tracking-tighter">{(plan.price / 1000).toLocaleString("id-ID")}k</span></> : <span className="text-3xl font-black text-gray-900 tracking-tight">{plan.price}</span>}
                {typeof plan.price === 'number' && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">/ Acara</span>}
              </div>
              <ul className="mt-8 space-y-3">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={`mt-1 p-0.5 rounded-full ${plan.color === 'amber' ? 'bg-amber-100 text-amber-600' : plan.color === 'purple' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}><Check size={10} strokeWidth={4} /></div>
                    <span className="text-xs font-bold text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            {plan.isWA ? (
              <a href={`https://wa.me/${waNumber}?text=${waMessage}`} target="_blank" className="mt-10 w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all bg-purple-600 text-white hover:bg-purple-700 shadow-xl">Hubungi Kami <MessageCircle size={14} /></a>
            ) : (
              <Link href={`/dashboard/user/checkout?plan=${plan.id}`} className={`mt-10 w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${plan.color === 'amber' ? "bg-gray-900 text-white hover:bg-black shadow-xl" : "bg-blue-600 text-white hover:bg-blue-700 shadow-xl"}`}>Pilih {plan.name} <ArrowRight size={14} /></Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
