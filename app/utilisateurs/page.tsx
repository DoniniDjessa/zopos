"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase/client";
import { createUserAction } from "@/app/actions/create-user";
import { deleteUserAction, suspendUserAction } from "@/app/actions/manage-user";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  suspended?: boolean;
}

export default function UtilisateursPage() {
  const { user, loading: authLoading, profile } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && profile) {
      checkSuperAdmin();
    }
  }, [user, profile]);

  const checkSuperAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from("zop-users")
        .select("role")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      const userRole = data?.role;
      const isSuper = userRole === "super_admin";
      const canAccess = userRole === "super_admin" || userRole === "admin";

      setIsSuperAdmin(isSuper);
      setIsAdmin(canAccess);

      if (!canAccess) {
        router.push("/");
        return;
      }

      fetchUsers();
    } catch (error) {
      console.error("Error checking admin status:", error);
      router.push("/");
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("zop-users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Fetched users:", data); // Debug log
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createUserAction({
        email,
        password,
        firstName,
        lastName,
        role,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create user");
      }

      alert("Utilisateur créé avec succès !");
      setShowAddModal(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      alert(error.message || "Erreur lors de la création de l'utilisateur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setRole("admin");
  };

  const deleteUser = async (userId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.",
      )
    )
      return;

    try {
      const result = await deleteUserAction(userId);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete user");
      }

      alert("Utilisateur supprimé avec succès");
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert(error.message || "Erreur lors de la suppression de l'utilisateur");
    }
  };

  const suspendUser = async (userId: string, currentlySuspended: boolean) => {
    const action = currentlySuspended ? "réactiver" : "suspendre";
    if (!confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?`))
      return;

    try {
      const result = await suspendUserAction(userId, !currentlySuspended);

      if (!result.success) {
        throw new Error(result.error || "Failed to suspend user");
      }

      alert(
        `Utilisateur ${currentlySuspended ? "réactivé" : "suspendu"} avec succès`,
      );
      fetchUsers();
    } catch (error: any) {
      console.error("Error suspending user:", error);
      alert(
        error.message ||
          "Erreur lors de la modification du statut de l'utilisateur",
      );
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] flex items-center justify-center">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="Zo POS"
            className="h-16 w-16 mx-auto mb-4 animate-pulse"
          />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto"></div>
          <p className="mt-4 text-[#0F172A]/60">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#0F172A]">
                Utilisateurs
              </h1>
              <p className="text-sm text-[#0F172A]/60">
                {users.length} utilisateur{users.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-1.5 bg-[#3B82F6] text-white rounded-none 
                       hover:bg-[#2563EB] transition-all duration-200 font-medium shadow-lg shadow-[#3B82F6]/25"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nouvel Utilisateur
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white/70 backdrop-blur-md rounded-none border border-white/20 overflow-hidden">
          <div>
            <table className="w-full">
              <thead className="bg-[#F0F9FF]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((userItem) => (
                  <tr
                    key={userItem.id}
                    className="hover:bg-[#F0F9FF]/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-[#0F172A]">
                        {userItem.first_name} {userItem.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#0F172A]/70">
                      {userItem.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-medium ${
                          userItem.role === "super_admin"
                            ? "bg-purple-100 text-purple-700"
                            : userItem.role === "admin"
                              ? "bg-blue-100 text-blue-700"
                              : userItem.role === "accueil"
                                ? "bg-green-100 text-green-700"
                                : userItem.role === "vendeur"
                                  ? "bg-orange-100 text-orange-700"
                                  : userItem.role === "comptable"
                                    ? "bg-pink-100 text-pink-700"
                                    : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {userItem.role === "super_admin"
                          ? "Super Admin"
                          : userItem.role === "admin"
                            ? "Admin"
                            : userItem.role === "accueil"
                              ? "Accueil"
                              : userItem.role === "vendeur"
                                ? "Vendeur"
                                : userItem.role === "comptable"
                                  ? "Comptable"
                                  : "Utilisateur"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-none text-xs font-medium ${
                          userItem.suspended
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {userItem.suspended ? "Suspendu" : "Actif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#0F172A]/70">
                      {new Date(userItem.created_at).toLocaleDateString(
                        "fr-FR",
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {userItem.role !== "super_admin" && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() =>
                              suspendUser(
                                userItem.id,
                                userItem.suspended || false,
                              )
                            }
                            className={`px-4 py-1 text-xs rounded-lg transition-colors ${
                              userItem.suspended
                                ? "text-green-600 hover:bg-green-50"
                                : "text-orange-600 hover:bg-orange-50"
                            }`}
                          >
                            {userItem.suspended ? "Réactiver" : "Suspendre"}
                          </button>
                          <button
                            onClick={() => deleteUser(userItem.id)}
                            className="px-4 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-none shadow-2xl max-w-md w-full p-8">
            <h2 className="font-serif text-2xl font-bold text-[#0F172A] mb-6">
              Créer un Utilisateur
            </h2>

            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                             focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                             focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                             focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                             focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-2">
                    Rôle
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-1.5 bg-[#F0F9FF] border border-[#3B82F6]/20 rounded-none 
                             focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="accueil">Accueil</option>
                    <option value="vendeur">Vendeur</option>
                    <option value="comptable">Comptable</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-1.5 bg-gray-200 text-[#0F172A] rounded-none 
                           hover:bg-gray-300 transition-all duration-200 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-1.5 bg-[#3B82F6] text-white rounded-none 
                           hover:bg-[#2563EB] transition-all duration-200 font-medium
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
