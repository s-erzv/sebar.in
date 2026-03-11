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
  Globe,
  ChevronRight,
  Sparkles,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Auto-collapse sidebar on builder page for better experience
  useEffect(() => {
    if (pathname?.includes("/builder")) {
      setIsSidebarCollapsed(true);
    }
  }, [pathname]);

  const isPreviewFrame = pathname?.includes("preview-frame");

  const adminNavItems = [
    { name: "Ringkasan", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Daftar Undangan", href: "/dashboard/admin/invitations", icon: Globe },
    { name: "Daftar User", href: "/dashboard/admin/users", icon: Users },
    { name: "Katalog Template", href: "/dashboard/admin/templates", icon: Palette },
  ];

  const userNavItems = [
    { name: "Beranda", href: "/dashboard/user", icon: LayoutDashboard },
    { name: "Katalog Desain", href: "/dashboard/user/templates", icon: Palette },
    { name: "Beli Paket", href: "/dashboard/user/checkout/plans", icon: Sparkles },
    { name: "Pesanan Saya", href: "/dashboard/user/orders", icon: CreditCard },
    { name: "Pengaturan", href: "/dashboard/user/settings", icon: Settings },
  ];

  const navItems = profile?.role === "admin" ? adminNavItems : userNavItems;

  if (isLoading) return <div className="flex h-screen w-full items-center justify-center bg-white"><Loader2 className="animate-spin text-gray-900" /></div>;
  if (isPreviewFrame) return <main className="h-screen w-full overflow-hidden bg-white">{children}</main>;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50 font-sans">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && <div className="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 transform bg-white border-r border-gray-100 transition-all duration-300 md:static md:translate-x-0 shadow-2xl md:shadow-none flex flex-col",
        isSidebarCollapsed ? "md:w-20" : "md:w-72",
        isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col p-4">
          <div className={cn("flex items-center justify-between mb-8 px-2", isSidebarCollapsed && !isMobileMenuOpen ? "justify-center" : "")}>
            {(!isSidebarCollapsed || isMobileMenuOpen) ? (
              <Link href="/" className="text-xl font-semibold tracking-tight text-gray-900">Sebar<span className="text-blue-600">.in</span></Link>
            ) : (
              <Link href="/" className="text-xl font-bold text-blue-600">S<span className="text-gray-900">.</span></Link>
            )}
            <button className="md:hidden p-2 bg-gray-50 rounded-xl" onClick={() => setIsMobileMenuOpen(false)}><X className="h-5 w-5" /></button>
          </div>

          <nav className="flex-1 space-y-1">
            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <p className="px-4 text-[10px] font-medium text-gray-400 mb-4 uppercase tracking-widest">Menu</p>
            )}
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href} 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  title={item.name}
                  className={cn(
                    "flex items-center group rounded-xl transition-all relative",
                    isSidebarCollapsed && !isMobileMenuOpen ? "justify-center px-0 py-3" : "px-4 py-3 gap-3",
                    isActive ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"
                  )}
                >
                  <item.icon size={20} className={isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"} />
                  {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="text-sm font-medium">{item.name}</span>}
                  {isActive && !isSidebarCollapsed && <ChevronRight size={14} className="ml-auto opacity-50" />}
                  {isActive && isSidebarCollapsed && !isMobileMenuOpen && (
                    <div className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className={cn("flex items-center gap-3 p-2 bg-gray-50 rounded-xl mb-4 overflow-hidden", isSidebarCollapsed && !isMobileMenuOpen ? "justify-center" : "")}>
              <div className="h-9 w-9 shrink-0 rounded-lg bg-blue-600 flex items-center justify-center text-white font-medium shadow-sm">{profile?.full_name?.charAt(0).toUpperCase()}</div>
              {(!isSidebarCollapsed || isMobileMenuOpen) && (
                <div className="flex flex-col overflow-hidden leading-tight">
                  <span className="truncate text-xs font-semibold text-gray-900">{profile?.full_name}</span>
                  <span className="text-[10px] text-gray-400 capitalize">{profile?.role}</span>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-400 hover:bg-gray-50 transition-all mb-2"
            >
              {isSidebarCollapsed ? <PanelLeft size={18} /> : <><PanelLeftClose size={18} /> <span>Sembunyikan</span></>}
            </button>

            <button onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className={cn("flex items-center gap-3 rounded-xl py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-all w-full", isSidebarCollapsed && !isMobileMenuOpen ? "justify-center" : "px-4")}>
              <LogOut size={18} /> 
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span>Keluar</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md px-6 md:hidden sticky top-0 z-30">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-gray-50 rounded-xl"><Menu size={20} /></button>
          <span className="text-sm font-medium text-gray-900">Sebar.in</span>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-medium text-xs">{profile?.full_name?.charAt(0)}</div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
