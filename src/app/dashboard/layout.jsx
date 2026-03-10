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
  CheckSquare
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const adminNavItems = [
    { name: "Admin Stats", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Validasi Bayar", href: "/dashboard/admin/payments", icon: CheckSquare },
    { name: "Manajemen User", href: "/dashboard/admin/users", icon: Users },
    { name: "Kelola Template", href: "/dashboard/admin/templates", icon: Palette },
  ];

  const userNavItems = [
    { name: "Overview", href: "/dashboard/user", icon: LayoutDashboard },
    { name: "Pesanan Saya", href: "/dashboard/user/orders", icon: CreditCard },
    { name: "Pengaturan", href: "/dashboard/user/settings", icon: Settings },
  ];

  const navItems = profile?.role === "admin" ? adminNavItems : userNavItems;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out md:static md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
            <Link href="/" className="text-xl font-black tracking-tight text-gray-900">
              SEBAR<span className="text-blue-600">.IN</span>
            </Link>
            <button className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Menu {profile?.role === "admin" ? "Administrator" : "Pelanggan"}
            </p>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                    isActive 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-100 p-4 bg-gray-50/50">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold shadow-sm">
                {profile?.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-bold text-gray-900">
                  {profile?.full_name || "Pengguna"}
                </span>
                <span className={cn(
                  "inline-flex w-fit items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter",
                  profile?.role === "admin" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                )}>
                  {profile?.role === "admin" && <ShieldCheck className="w-2.5 h-2.5" />}
                  {profile?.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b border-gray-200 bg-white px-6 md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="ml-4 text-sm font-bold text-gray-900 uppercase tracking-widest">
            {profile?.role} Panel
          </span>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}