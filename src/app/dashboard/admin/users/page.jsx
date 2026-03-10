// src/app/dashboard/admin/users/page.jsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import AccessDenied from "@/components/ui/AccessDenied";
import { Users, ShieldCheck, User as UserIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminUsersPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === "admin") fetchUsers();
  }, [profile]);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const toggleAdmin = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await supabase.from("profiles").update({ role: newRole }).eq("id", id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  if (authLoading || loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (profile?.role !== "admin") return <AccessDenied />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Users size={24} /></div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Manajemen Pengguna</h1>
          <p className="text-sm text-gray-500">Total {users.length} pengguna terdaftar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => (
          <div key={u.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-400">
              {u.full_name?.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 truncate">{u.full_name}</h3>
              <p className="text-xs text-gray-400 uppercase font-black tracking-tighter">{u.role}</p>
            </div>
            <button onClick={() => toggleAdmin(u.id, u.role)} className={cn(
              "p-2 rounded-lg transition-colors",
              u.role === 'admin' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
            )}>
              <ShieldCheck size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}