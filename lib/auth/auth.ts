import { supabase } from "../supabase/client";

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  /**
   * Register a new user and create their profile in zop-users table
   */
  async register({ email, password, firstName, lastName }: RegisterData) {
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user data returned");

      // 2. Create user profile in zop-users table
      const { error: profileError } = await supabase.from("zop-users").insert({
        id: authData.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        // If profile creation fails, we should clean up the auth user
        // Note: In production, this should be handled by a database trigger or function
        console.error("Profile creation failed:", profileError);
        throw new Error("Failed to create user profile");
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
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get user profile error:", error);
      throw error;
    }
  },
};
