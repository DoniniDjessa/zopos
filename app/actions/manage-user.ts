"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function deleteUserAction(userId: string) {
  try {
    // 1. Delete from auth
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting from auth:", authError);
      throw authError;
    }

    // 2. Delete from zop-users table
    const { error: dbError } = await supabaseAdmin
      .from("zop-users")
      .delete()
      .eq("id", userId);

    if (dbError) {
      console.error("Error deleting from database:", dbError);
      throw dbError;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
}

export async function suspendUserAction(userId: string, suspend: boolean) {
  try {
    // Update user's banned status in auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { ban_duration: suspend ? "876000h" : "none" }, // 100 years if suspended
    );

    if (authError) {
      console.error("Error updating auth status:", authError);
      throw authError;
    }

    // Optionally update a suspended flag in the database
    const { error: dbError } = await supabaseAdmin
      .from("zop-users")
      .update({
        suspended: suspend,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (dbError) {
      console.error("Error updating database:", dbError);
      // Don't throw - the auth suspension is the critical part
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error suspending user:", error);
    return { success: false, error: error.message };
  }
}

export async function forceUpdatePasswordAction(email: string, newPassword: string) {
  try {
    // 1. Get user by email to find their ID
    const { data: profile, error: selectError } = await supabaseAdmin
      .from("zop-users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (selectError) throw selectError;
    if (!profile) throw new Error("Utilisateur non trouvé.");

    // 2. Update password in auth (admin bypasses existing password)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    );

    if (authError) throw authError;

    return { success: true };
  } catch (error: any) {
    console.error("Error forcing password update:", error);
    return { success: false, error: error.message };
  }
}
