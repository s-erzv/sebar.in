// src/app/dashboard/admin/users/page.jsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import AccessDenied from "@/components/ui/AccessDenied";
import { 
  Loader2, Search, User, Mail, 
  Calendar, Shield, Phone
} from "lucide-react";

export default function AdminUsersPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (profile?.role === "admin") fetchUsers();
  }, [profile]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error) setUsers(data || []);
    setLoading(false);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.whatsapp_number?.includes(searchQuery)
    );
  }, [users, searchQuery]);

  if (authLoading || loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-gray-400 w-8 h-8" />
    </div>
  );
  
  if (profile?.role !== "admin") return <AccessDenied />;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 md:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Daftar Pengguna</h1>
        <p className="text-sm text-gray-500">Kelola dan lihat semua pengguna yang terdaftar di sistem.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input 
          type="text"
          placeholder="Cari nama atau nomor WA..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-all"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-medium">
                <th className="px-6 py-3 border-b border-gray-100">Nama Pengguna</th>
                <th className="px-6 py-3 border-b border-gray-100">WhatsApp</th>
                <th className="px-6 py-3 border-b border-gray-100">Role</th>
                <th className="px-6 py-3 border-b border-gray-100">Terdaftar Pada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                          <User size={16} />
                        </div>
                        <span className="font-medium text-gray-900">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {u.whatsapp_number || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}