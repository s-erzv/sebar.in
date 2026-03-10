// src/app/dashboard/user/page.jsx
"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function UserDashboard() {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "Sobat";

  const plans = [
    {
      id: "standard",
      name: "Standard",
      price: "150.000",
      description: "Desain cantik, isi data sendiri. Cocok untuk yang butuh cepat.",
      features: ["Pilih template standard", "Self-service editor", "Aktif selamanya", "Maks 500 tamu"],
      isPopular: false,
    },
    {
      id: "premium",
      name: "Premium",
      price: "350.000",
      description: "Terima beres. Admin kami yang akan merapikan data dan foto kamu.",
      features: ["Semua template terbuka", "Dibantu setup oleh Admin", "Revisi 3x", "Tamu tak terbatas"],
      isPopular: true,
    },
    {
      id: "custom",
      name: "Custom",
      price: "750.000+",
      description: "Desain eksklusif dari nol sesuai tema acaramu.",
      features: ["Desain UI/UX Custom", "Animasi khusus", "Domain personal (.com)", "Prioritas Support 24/7"],
      isPopular: false,
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Halo, {userName}! 👋</h1>
        <p className="mt-1 text-gray-500">Mulai buat undangan pertamamu dengan memilih paket di bawah ini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`relative flex flex-col rounded-2xl bg-white p-6 shadow-sm border ${
              plan.isPopular ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200"
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-0 right-0 mx-auto w-32 rounded-full bg-blue-500 px-3 py-1 text-center text-xs font-semibold text-white">
                Paling Laris
              </div>
            )}
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-500 min-h-[40px]">{plan.description}</p>
            </div>
            
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-gray-900">Rp {plan.price}</span>
            </div>
            
            <ul className="mb-8 flex-1 space-y-3">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link 
              href={`/dashboard/user/checkout?plan=${plan.id}`}
              className={`mt-auto flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                plan.isPopular 
                  ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500" 
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 focus:ring-blue-500"
              }`}
            >
              Pilih Paket {plan.name}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}