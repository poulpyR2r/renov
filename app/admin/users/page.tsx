"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  Loader2,
  Shield,
  ShieldOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Calendar,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface User {
  _id: string;
  email: string;
  name?: string;
  image?: string;
  role: "user" | "admin" | "agency";
  agencyId?: string;
  googleId?: string;
  favorites: string[];
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();

      if (data.success) {
        setUsers(data.users);
        setTotalPages(data.pages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    }
    setIsLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleRoleChange = async (
    userId: string,
    newRole: "user" | "admin" | "agency"
  ) => {
    // Trouver l'ancien rôle pour pouvoir le restaurer en cas d'erreur
    const user = users.find((u) => u._id === userId);
    const oldRole = user?.role;

    if (!user || oldRole === newRole) return;

    // Mise à jour optimiste
    setUpdatingRoles((prev) => new Set(prev).add(userId));
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
    );

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Rôle mis à jour: ${newRole}`);
      } else {
        // Restaurer l'ancien rôle en cas d'erreur
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: oldRole! } : u))
        );
        toast.error(data.error || "Erreur lors de la mise à jour du rôle");
      }
    } catch (error) {
      // Restaurer l'ancien rôle en cas d'erreur
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: oldRole! } : u))
      );
      toast.error("Erreur lors de la mise à jour du rôle");
    } finally {
      setUpdatingRoles((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      const res = await fetch(`/api/admin/users/${userToDelete}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== userToDelete));
        setTotal((prev) => prev - 1);
        toast.success("Utilisateur supprimé");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Utilisateurs</h2>
          <p className="text-muted-foreground">
            {total} utilisateur{total > 1 ? "s" : ""} au total
          </p>
        </div>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email ou nom..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit">Rechercher</Button>
          </form>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Users className="w-12 h-12 mb-4" />
              <p>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div>
              {/* Utilisateurs d'agence */}
              {users.filter((u) => u.agencyId || u.role === "agency").length >
                0 && (
                <div className="border-b">
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border-b">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-orange-600" />
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                        Utilisateurs d'agence
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-orange-200 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200">
                        {
                          users.filter((u) => u.agencyId || u.role === "agency")
                            .length
                        }
                      </span>
                    </div>
                  </div>
                  <div className="divide-y">
                    {users
                      .filter((u) => u.agencyId || u.role === "agency")
                      .map((user) => (
                        <div
                          key={user._id}
                          className="p-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt=""
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <span className="text-orange-600 font-semibold">
                                  {(user.name || user.email)[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {user.name || "Sans nom"}
                              </p>
                              <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(user.createdAt).toLocaleDateString(
                              "fr-FR"
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {user.googleId && (
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-600">
                                Google
                              </span>
                            )}
                            <span className="px-2 py-1 rounded-full text-xs bg-orange-500/10 text-orange-600">
                              Agence
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {user.favorites?.length || 0} favoris
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Select
                              value={user.role}
                              onValueChange={(
                                value: "user" | "admin" | "agency"
                              ) => handleRoleChange(user._id, value)}
                              disabled={updatingRoles.has(user._id)}
                            >
                              <SelectTrigger className="w-32">
                                {updatingRoles.has(user._id) ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Sauvegarde...</span>
                                  </div>
                                ) : (
                                  <SelectValue />
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">
                                  <div className="flex items-center gap-2">
                                    <ShieldOff className="w-3.5 h-3.5" />
                                    Utilisateur
                                  </div>
                                </SelectItem>
                                <SelectItem value="agency">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5" />
                                    Agence
                                  </div>
                                </SelectItem>
                                <SelectItem value="admin">
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-3.5 h-3.5" />
                                    Admin
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(user._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Autres utilisateurs */}
              {users.filter((u) => !u.agencyId && u.role !== "agency").length >
                0 && (
                <div>
                  {users.filter((u) => u.agencyId || u.role === "agency")
                    .length > 0 && (
                    <div className="p-4 bg-muted/30 border-b">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <h3 className="font-semibold">Autres utilisateurs</h3>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                          {
                            users.filter(
                              (u) => !u.agencyId && u.role !== "agency"
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="divide-y">
                    {users
                      .filter((u) => !u.agencyId && u.role !== "agency")
                      .map((user) => (
                        <div
                          key={user._id}
                          className="p-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt=""
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-semibold">
                                  {(user.name || user.email)[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {user.name || "Sans nom"}
                              </p>
                              <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(user.createdAt).toLocaleDateString(
                              "fr-FR"
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {user.googleId && (
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-600">
                                Google
                              </span>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {user.favorites?.length || 0} favoris
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Select
                              value={user.role}
                              onValueChange={(
                                value: "user" | "admin" | "agency"
                              ) => handleRoleChange(user._id, value)}
                              disabled={updatingRoles.has(user._id)}
                            >
                              <SelectTrigger className="w-32">
                                {updatingRoles.has(user._id) ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Sauvegarde...</span>
                                  </div>
                                ) : (
                                  <SelectValue />
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">
                                  <div className="flex items-center gap-2">
                                    <ShieldOff className="w-3.5 h-3.5" />
                                    Utilisateur
                                  </div>
                                </SelectItem>
                                <SelectItem value="agency">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5" />
                                    Agence
                                  </div>
                                </SelectItem>
                                <SelectItem value="admin">
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-3.5 h-3.5" />
                                    Admin
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(user._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
