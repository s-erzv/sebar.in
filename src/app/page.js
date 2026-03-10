import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react"; 

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-gray-900 selection:bg-blue-200">
      <main className="flex w-full max-w-4xl flex-col items-center justify-center px-6 text-center sm:px-12">
        
        <div className="mb-6 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700 shadow-sm">
          #PASTIMUDAHDISEBAR
        </div>

        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl sm:leading-tight">
          Buat Undangan Digital <br className="hidden sm:block" />
          <span className="text-blue-600">Tanpa Ribet</span>
        </h1>

        <p className="mb-10 max-w-2xl text-lg text-gray-600 sm:text-xl">
          Platform pembuatan undangan digital premium untuk pernikahan, ulang tahun, dan event lainnya. Pilih template, isi data, bayar, dan langsung sebar!
        </p>

        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="group flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3.5 text-base font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Mulai Buat Undangan
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-3.5 text-base font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <LogIn className="h-5 w-5 text-gray-500 transition-colors group-hover:text-blue-600" />
            Masuk ke Dashboard
          </Link>
        </div>

      </main>
    </div>
  );
}