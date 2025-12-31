"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Loader2,
  Mail,
  UserPlus,
  Shield,
  UserCheck,
  User,
  Trash2,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Member {
  _id: string;
  userId: string;
  role: "AGENCY_ADMIN" | "AGENCY_MANAGER" | "AGENCY_USER";
  email: string;
  name?: string;
  createdAt: string;
}

export default function AgencyMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberFirstName, setNewMemberFirstName] = useState("");
  const [newMemberLastName, setNewMemberLastName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<
    "AGENCY_ADMIN" | "AGENCY_MANAGER" | "AGENCY_USER"
  >("AGENCY_USER");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/agency/members");
      const result = await res.json();

      if (result.success) {
        setMembers(result.members);
      } else {
        toast.error(result.error || "Erreur lors du chargement");
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Erreur lors du chargement");
    }
    setIsLoading(false);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      const res = await fetch("/api/agency/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newMemberEmail,
          firstName: newMemberFirstName,
          lastName: newMemberLastName,
          role: newMemberRole,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(
          result.isNewUser
            ? "Invitation envoyée par email"
            : "Utilisateur existant ajouté à l'agence"
        );
        setNewMemberEmail("");
        setNewMemberFirstName("");
        setNewMemberLastName("");
        setNewMemberRole("AGENCY_USER");
        setShowAddForm(false);
        fetchMembers();
      } else {
        toast.error(result.error || "Erreur lors de l'ajout");
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
    setIsAdding(false);
  };

  const handleRoleChange = async (
    userId: string,
    newRole: "AGENCY_ADMIN" | "AGENCY_MANAGER" | "AGENCY_USER"
  ) => {
    // Trouver l'ancien rôle pour pouvoir le restaurer en cas d'erreur
    const member = members.find((m) => m.userId === userId);
    const oldRole = member?.role;

    if (!member || oldRole === newRole) return;

    // Mise à jour optimiste
    setUpdatingRoles((prev) => new Set(prev).add(userId));
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
    );

    try {
      const res = await fetch("/api/agency/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Rôle mis à jour avec succès");
      } else {
        // Restaurer l'ancien rôle en cas d'erreur
        setMembers((prev) =>
          prev.map((m) => (m.userId === userId ? { ...m, role: oldRole! } : m))
        );
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      // Restaurer l'ancien rôle en cas d'erreur
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role: oldRole! } : m))
      );
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdatingRoles((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleDeleteClick = (userId: string) => {
    setMemberToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!memberToDelete) return;

    try {
      const res = await fetch(`/api/agency/members?userId=${memberToDelete}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Membre retiré avec succès");
        fetchMembers();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }

    setDeleteDialogOpen(false);
    setMemberToDelete(null);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "AGENCY_ADMIN":
        return <Shield className="w-4 h-4 text-orange-500" />;
      case "AGENCY_MANAGER":
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "AGENCY_ADMIN":
        return "Administrateur";
      case "AGENCY_MANAGER":
        return "Manager";
      default:
        return "Utilisateur";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des membres</h2>
          <p className="text-muted-foreground">
            Gérez les membres de votre agence et leurs rôles
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Ajouter un membre
        </Button>
      </div>

      {/* Add Member Form */}
      {showAddForm && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Ajouter un membre</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={newMemberFirstName}
                    onChange={(e) => setNewMemberFirstName(e.target.value)}
                    placeholder="Prénom"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={newMemberLastName}
                    onChange={(e) => setNewMemberLastName(e.target.value)}
                    placeholder="Nom"
                    required
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select
                    value={newMemberRole}
                    onValueChange={(value: any) => setNewMemberRole(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AGENCY_USER">Utilisateur</SelectItem>
                      <SelectItem value="AGENCY_MANAGER">Manager</SelectItem>
                      <SelectItem value="AGENCY_ADMIN">
                        Administrateur
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isAdding}>
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Ajouter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Membres ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4" />
              <p>Aucun membre</p>
            </div>
          ) : (
            <div className="divide-y">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{member.name || "Sans nom"}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(value: any) =>
                          handleRoleChange(member.userId, value)
                        }
                        disabled={updatingRoles.has(member.userId)}
                      >
                        <SelectTrigger className="w-40">
                          {updatingRoles.has(member.userId) ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Sauvegarde...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {getRoleIcon(member.role)}
                              <span>{getRoleLabel(member.role)}</span>
                            </div>
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AGENCY_USER">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Utilisateur
                            </div>
                          </SelectItem>
                          <SelectItem value="AGENCY_MANAGER">
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4" />
                              Manager
                            </div>
                          </SelectItem>
                          <SelectItem value="AGENCY_ADMIN">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Administrateur
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(member.userId)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Retirer le membre"
        description="Êtes-vous sûr de vouloir retirer ce membre de l'agence ?"
        confirmText="Retirer"
        cancelText="Annuler"
        variant="destructive"
      />
    </div>
  );
}
