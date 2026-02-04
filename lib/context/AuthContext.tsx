"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../supabase/client";
import { authService } from "../auth/auth";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log("Initial session found for user:", session.user.email);
        // Fetch user profile
        authService
          .getUserProfile(session.user.id)
          .then((profileData) => {
            if (profileData) {
              console.log("Profile loaded successfully:", profileData.email);
              setProfile(profileData);
            } else {
              console.warn("No profile found for user:", session.user.email);
            }
            setLoading(false);
          })
          .catch((error) => {
            console.error("Failed to load profile:", error);
            setLoading(false);
          });
      } else {
        console.log("No initial session found");
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        authService
          .getUserProfile(session.user.id)
          .then((profileData) => {
            if (profileData) {
              console.log("Profile synced on auth change:", profileData.email);
              setProfile(profileData);
            } else {
              console.warn("Profile sync failed - no data returned");
            }
          })
          .catch((error) => {
            console.error("Profile sync error:", error);
            setProfile(null);
          });
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await authService.logout();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
