"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  CreditCard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Loader2,
  Users,
  Palette,
  ShieldCheck,
  CheckSquare,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isPreviewFrame = pathname?.includes("preview-frame");

  const adminNavItems = [
    { name: "Ringkasan", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Validasi Bayar", href: "/dashboard/admin/payments", icon: CheckSquare },
    { name: "Daftar User", href: "/dashboard/admin/users", icon: Users },
    { name: "Katalog Template", href: "/dashboard/admin/templates", icon: Palette },
  ];

  const userNavItems = [
    { name: "Beranda", href: "/dashboard/user", icon: LayoutDashboard },
    { name: "Beli Paket", href: "/dashboard/user/checkout/plans", icon: Sparkles },
    { name: "Pesanan Saya", href: "/dashboard/user/orders", icon: CreditCard },
    { name: "Pengaturan", href: "/dashboard/user/settings", icon: Settings },
  ];

  const navItems = profile?.role === "admin" ? adminNavItems : userNavItems;

  if (isLoading) return <div className="flex h-screen w-full items-center justify-center bg-white"><Loader2 className="animate-spin text-gray-900" /></div>;
  if (isPreviewFrame) return <main className="h-screen w-full overflow-hidden bg-white">{children}</main>;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50 font-sans">
      {isMobileMenuOpen && <div className="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      <aside className={cn("fixed inset-y-0 left-0 z-50 w-72 transform bg-white border-r border-gray-100 transition-transform duration-300 md:static md:translate-x-0 shadow-2xl md:shadow-none", isMobileMenuOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-full flex-col p-6">
          <div className="flex items-center justify-between mb-10 px-2">
            <Link href="/" className="text-2xl font-black tracking-tighter text-gray-900">SEBAR<span className="text-blue-600">.IN</span></Link>
            <button className="md:hidden p-2 bg-gray-50 rounded-xl" onClick={() => setIsMobileMenuOpen(false)}><X className="h-5 w-5" /></button>
          </div>
          <nav className="flex-1 space-y-2">
            <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Menu {profile?.role}</p>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={cn("flex items-center justify-between group rounded-2xl px-4 py-3.5 transition-all", isActive ? "bg-gray-900 text-white shadow-xl" : "text-gray-500 hover:bg-gray-50")}>
                  <div className="flex items-center gap-3"><item.icon size={18} className={isActive ? "text-blue-400" : "text-gray-400"} /><span className="text-sm font-bold">{item.name}</span></div>
                  {isActive && <ChevronRight size={16} />}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto pt-6 border-t border-gray-50">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md">{profile?.full_name?.charAt(0).toUpperCase()}</div>
              <div className="flex flex-col overflow-hidden"><span className="truncate text-xs font-black text-gray-900">{profile?.full_name}</span><span className="text-[8px] font-black uppercase text-blue-600">{profile?.role}</span></div>
            </div>
            <button onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-black uppercase text-red-500 hover:bg-red-50 transition-all"><LogOut size={16} /> Keluar</button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md px-6 md:hidden sticky top-0 z-30">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-gray-50 rounded-xl"><Menu size={20} /></button>
          <span className="text-xs font-black uppercase tracking-widest">Dashboard</span>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">{profile?.full_name?.charAt(0)}</div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16">{children}</main>
      </div>
    </div>
  );
}
