// src/app/dashboard/layout.jsx
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
  Loader2
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigasi Dinamis untuk User
  const navItems = [
    { name: "Overview", href: "/dashboard/user", icon: LayoutDashboard },
    { name: "Pesanan Saya", href: "/dashboard/user/orders", icon: CreditCard },
    { name: "Pengaturan", href: "/dashboard/user/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  // Mencegah flash content sebelum middleware/auth context selesai loading
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* 📱 Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 🖥️ Sidebar Asli */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out md:static md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Brand Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Sebar<span className="text-blue-600">.in</span>
            </Link>
            <button className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Navigasi Menu */}
          <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-blue-700" : "text-gray-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-4 px-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-gray-900">
                  {user?.user_metadata?.full_name || "Pengguna"}
                </span>
                <span className="truncate text-xs text-gray-500">{user?.email}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* 📄 Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar Mobile */}
        <header className="flex h-16 shrink-0 items-center border-b border-gray-200 bg-white px-4 md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="ml-4 text-lg font-semibold text-gray-900">Dashboard</span>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}