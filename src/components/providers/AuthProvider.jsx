"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const AuthContext = createContext({
  user: null,
  profile: null,
  isLoading: true,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser?.user_metadata?.role) {
        setProfile({ 
          role: currentUser.user_metadata.role,
          full_name: currentUser.user_metadata.full_name 
        });
        
        setIsLoading(false); 
      }

      if (currentUser) {
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        
        if (dbProfile) setProfile(dbProfile);
      }

      setIsLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      
      if (!newUser) {
        setProfile(null);
      } else if (newUser.user_metadata?.role) {
        setProfile({ 
          role: newUser.user_metadata.role,
          full_name: newUser.user_metadata.full_name 
        });
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);