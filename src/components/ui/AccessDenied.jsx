// src/components/ui/AccessDenied.jsx
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AccessDenied({ fallbackUrl = "/dashboard/user" }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center min-h-[60vh]">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
      <h1 className="text-2xl font-bold text-gray-900">Akses Ditolak</h1>
      <p className="text-gray-500 mt-2 max-w-md">
        Kamu tidak memiliki izin untuk mengakses halaman ini. Halaman ini diproteksi khusus untuk Administrator.
      </p>
      <Link
        href={fallbackUrl}
        className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
      </Link>
    </div>
  );
}