// src/components/providers/AuthProvider.jsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const AuthContext = createContext({
  user: null,
  session: null,
  isLoading: true,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 1. Ambil session awal saat pertama render
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error("Auth init error:", error.message);
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    getInitialSession();

    // 2. Listen perubahan state (Login, Logout, Token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        router.refresh(); // Memaksa Server Component untuk re-render dengan auth baru
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <AuthContext.Provider value={{ user, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook untuk mengambil data user di Client Components.
 */
export const useAuth = () => {
  return useContext(AuthContext);
};