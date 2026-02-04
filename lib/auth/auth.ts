import { supabase } from "../supabase/client";
import { User } from "@supabase/supabase-js";

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  autoSignIn?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

// Track profile check to prevent duplicate calls
const profileCheckCache = new Map<string, Promise<void>>();

/**
 * Ensure user profile exists in zop-users table
 * Creates profile if missing to prevent PGRST116 errors
 */
async function ensureUserProfile(user: User | null) {
  if (!user?.id) return;

  // Return existing promise if already checking this user
  const existing = profileCheckCache.get(user.id);
  if (existing) return existing;

  const checkPromise = (async () => {
    try {
      // Check if profile exists using maybeSingle to avoid PGRST116 error
      const { data: profile, error: selectError } = await supabase
        .from("zop-users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (selectError) {
        console.error("ensureUserProfile select error:", selectError);
        return; // Don't block login on read errors
      }

      // Create profile if it doesn't exist
      if (!profile) {
        console.log("Creating missing profile for user:", user.id);
        
        const { error: insertError } = await supabase.from("zop-users").insert({
          id: user.id,
          email: user.email ?? "",
          first_name: user.user_metadata?.first_name ?? "",
          last_name: user.user_metadata?.last_name ?? "",
          phone: user.user_metadata?.phone ?? null,
          role: "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (insertError) {
          // 23505 = duplicate key, means profile already exists (RLS might be blocking SELECT)
          if (insertError.code === "23505") {
            console.log("Profile already exists (RLS may be blocking read access)");
          } else {
            console.error("ensureUserProfile insert error:", insertError);
          }
          // Don't throw - allow login to proceed
        } else {
          console.log("Profile created successfully for user:", user.id);
        }
      }
    } catch (error) {
      console.error("ensureUserProfile unexpected error:", error);
      // Don't throw - allow login to proceed
    } finally {
      // Clear cache after 5 seconds
      setTimeout(() => profileCheckCache.delete(user.id), 5000);
    }
  })();

  profileCheckCache.set(user.id, checkPromise);
  return checkPromise;
}

export const authService = {
  /**
   * Register a new user and create their profile in zop-users table
   */
  async register({
    email,
    password,
    firstName,
    lastName,
    phone = "",
    role = "user",
    autoSignIn = true,
  }: RegisterData) {
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user data returned");

      // 2. Create user profile in zop-users table
      const { error: profileError } = await supabase.from("zop-users").insert({
        id: authData.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error("Profile creation failed:", profileError);
        throw new Error("Failed to create user profile");
      }

      // 3. If admin is creating user, sign them out immediately
      if (!autoSignIn && authData.session) {
        // Don't auto-login the newly created user
        // The session will be for the new user, we need to preserve the admin session
      }

      return { user: authData.user, session: authData.session };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  /**
   * Login an existing user
   */
  async login({ email, password }: LoginData) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Ensure user profile exists in zop-users table
      await ensureUserProfile(data.user);

      return { user: data.user, session: data.session };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  /**
   * Logout the current user
   */
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },

  /**
   * Get the current user session
   */
  async getSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error("Get session error:", error);
      return null;
    }
  },

  /**
   * Get user profile from zop-users table
   */
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("zop-users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get user profile error:", error);
      throw error;
    }
  },
};
