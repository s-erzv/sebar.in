"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { 
  Check, 
  Crown, 
  Sparkles, 
  ArrowRight,
  MessageCircle,
  Layout,
  ShieldCheck,
  Lock
} from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    type: "standard",
    name: "Standard",
    price: 150000,
    features: [
      "Akses semua Template Standard",
      "Masa Aktif 1 Tahun",
      "Hingga 500 Nama Tamu",
      "Fitur RSVP & Ucapan",
      "Music Latar Standard",
      "Integrasi Google Maps"
    ],
    icon: Layout,
    color: "blue"
  },
  {
    type: "premium",
    name: "Premium",
    price: 350000,
    features: [
      "Semua Fitur Paket Standard",
      "Akses Seluruh Template Premium",
      "Masa Aktif Selamanya",
      "Kirim Tamu Tanpa Batas",
      "Bebas Upload Musik (.mp3)",
      "Galeri Foto & Video",
      "Prioritas Verifikasi"
    ],
    icon: Crown,
    color: "amber",
    popular: true
  },
  {
    type: "custom",
    name: "Custom / Private",
    price: null, // "Hubungi Kami"
    features: [
      "Template Eksklusif (Hanya Anda)",
      "Desain Request Sesuai Keinginan",
      "Fitur Khusus Sesuai Kebutuhan",
      "Domain Custom (Opsional)",
      "Pendampingan Setup Data",
      "Revisi Hingga Puas"
    ],
    icon: Lock,
    color: "purple"
  }
];

export default function PlansPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 md:px-6 space-y-10 text-gray-800 pb-20">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Pilih Paket Undangan</h1>
        <p className="text-sm text-gray-500 max-w-lg mx-auto">Solusi undangan digital terbaik untuk momen sekali seumur hidup Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {PLANS.map((plan) => (
          <div 
            key={plan.type} 
            className={`relative bg-white border rounded-[2rem] p-8 transition-all flex flex-col shadow-sm hover:shadow-md
              ${plan.popular ? "border-amber-200 ring-4 ring-amber-50" : "border-gray-200"}
              ${plan.type === 'custom' ? "border-purple-100 bg-purple-50/10" : ""}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                Recommended
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center 
                ${plan.type === 'premium' ? 'bg-amber-100 text-amber-600' : 
                  plan.type === 'custom' ? 'bg-purple-100 text-purple-600' : 
                  'bg-blue-100 text-blue-600'}`}>
                <plan.icon size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  {plan.type === 'custom' ? 'Enterprise' : 'Sekali Bayar'}
                </p>
              </div>
            </div>

            <div className="mb-8">
              {plan.price ? (
                <>
                  <span className="text-3xl font-bold text-gray-900">Rp {plan.price.toLocaleString("id-ID")}</span>
                  <span className="text-gray-400 text-xs font-medium ml-1">/event</span>
                </>
              ) : (
                <span className="text-2xl font-bold text-purple-600">Hubungi Kami</span>
              )}
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600 leading-tight">
                  <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0
                    ${plan.type === 'custom' ? 'bg-purple-100 text-purple-600' : 'bg-green-50 text-green-600'}`}>
                    <Check size={12} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            {plan.type === 'custom' ? (
              <div className="space-y-3">
                <a 
                  href={`https://wa.me/628123456789?text=${encodeURIComponent("Halo Admin Sebar.in, saya ingin berdiskusi mengenai Paket Custom/Private.")}`}
                  target="_blank"
                  className="w-full py-4 bg-purple-600 text-white rounded-2xl text-sm font-bold text-center hover:bg-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-100"
                >
                  <MessageCircle size={16} /> Diskusi Sekarang
                </a>
                <Link 
                  href="/dashboard/user/checkout?plan=custom"
                  className="block text-center text-[11px] font-bold text-purple-400 hover:text-purple-600 transition-colors uppercase tracking-widest"
                >
                  Sudah diskusi? Lanjut Bayar &rarr;
                </Link>
              </div>
            ) : (
              <Link 
                href={`/dashboard/user/checkout?plan=${plan.type}`}
                className={`w-full py-4 rounded-2xl text-sm font-bold text-center transition-all flex items-center justify-center gap-2
                  ${plan.type === 'premium' 
                    ? "bg-amber-400 text-amber-950 hover:bg-amber-500 shadow-lg shadow-amber-100" 
                    : "bg-gray-900 text-white hover:bg-gray-800"}`}
              >
                Pilih Paket Ini <ArrowRight size={16} />
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="text-center py-10 opacity-50">
        <p className="text-xs text-gray-400 font-medium">Semua transaksi di Sebar.in aman dan melalui proses verifikasi manual.</p>
      </div>
    </div>
  );
}