"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Loader2,
  Search,
  Filter,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  Bug,
  Sparkles,
  Wrench,
  FileText,
  Save,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Feedback {
  _id: string;
  agencyId: string;
  createdByUserId: string;
  title: string;
  message: string;
  category: "BUG" | "FEATURE_REQUEST" | "IMPROVEMENT" | "OTHER";
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_REVIEW" | "PLANNED" | "DONE" | "REJECTED";
  pageUrl?: string;
  adminNote?: string;
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

const categoryLabels: Record<string, string> = {
  BUG: "Bug",
  FEATURE_REQUEST: "Demande de fonctionnalité",
  IMPROVEMENT: "Amélioration",
  OTHER: "Autre",
};

const severityLabels: Record<string, string> = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Élevée",
  CRITICAL: "Critique",
};

const statusLabels: Record<string, string> = {
  OPEN: "Ouvert",
  IN_REVIEW: "En cours",
  PLANNED: "Planifié",
  DONE: "Traité",
  REJECTED: "Rejeté",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-500",
  IN_REVIEW: "bg-yellow-500",
  PLANNED: "bg-purple-500",
  DONE: "bg-green-500",
  REJECTED: "bg-red-500",
};

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState({
    status: "",
    category: "",
    severity: "",
    search: "",
  });

  const [editData, setEditData] = useState({
    status: "",
    adminNote: "",
    adminReply: "",
  });

  useEffect(() => {
    fetchFeedbacks();
  }, [filters]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.category) params.append("category", filters.category);
      if (filters.severity) params.append("severity", filters.severity);
      if (filters.search) params.append("search", filters.search);

      const res = await fetch(`/api/admin/feedback?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.data);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des feedbacks");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/feedback/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedFeedback(data.data);
        setEditData({
          status: data.data.status,
          adminNote: data.data.adminNote || "",
          adminReply: data.data.adminReply || "",
        });
        setIsDetailOpen(true);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement du détail");
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Statut mis à jour");
        fetchFeedbacks();
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleSave = async () => {
    if (!selectedFeedback) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/feedback/${selectedFeedback._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Modifications enregistrées");
        setIsDetailOpen(false);
        fetchFeedbacks();
      } else {
        toast.error(data.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "BUG":
        return <Bug className="w-4 h-4" />;
      case "FEATURE_REQUEST":
        return <Sparkles className="w-4 h-4" />;
      case "IMPROVEMENT":
        return <Wrench className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      category: "",
      severity: "",
      search: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Feedback</h1>
        <p className="text-muted-foreground mt-2">
          Gérer les retours et demandes des agences
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Titre ou message..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value === "all" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="OPEN">Ouvert</SelectItem>
                  <SelectItem value="IN_REVIEW">En cours</SelectItem>
                  <SelectItem value="PLANNED">Planifié</SelectItem>
                  <SelectItem value="DONE">Traité</SelectItem>
                  <SelectItem value="REJECTED">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={filters.category || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, category: value === "all" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="BUG">Bug</SelectItem>
                  <SelectItem value="FEATURE_REQUEST">
                    Demande de fonctionnalité
                  </SelectItem>
                  <SelectItem value="IMPROVEMENT">Amélioration</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sévérité</Label>
              <Select
                value={filters.severity || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, severity: value === "all" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="LOW">Faible</SelectItem>
                  <SelectItem value="MEDIUM">Moyenne</SelectItem>
                  <SelectItem value="HIGH">Élevée</SelectItem>
                  <SelectItem value="CRITICAL">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : feedbacks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun feedback trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <Card key={feedback._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getCategoryIcon(feedback.category)}
                      <h3 className="font-semibold">{feedback.title}</h3>
                      <Badge
                        className={`${statusColors[feedback.status]} text-white`}
                      >
                        {statusLabels[feedback.status]}
                      </Badge>
                      {feedback.severity && (
                        <Badge variant="outline">
                          {severityLabels[feedback.severity]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {feedback.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{categoryLabels[feedback.category]}</span>
                      <span>
                        {new Date(feedback.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                      <span>Agence: {feedback.agencyId}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickStatusChange(feedback._id, "IN_REVIEW")}
                        disabled={feedback.status === "IN_REVIEW"}
                      >
                        <Clock className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickStatusChange(feedback._id, "DONE")}
                        disabled={feedback.status === "DONE"}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleViewDetail(feedback._id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog détail */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedFeedback?.title}</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Catégorie</Label>
                  <p className="font-medium">
                    {categoryLabels[selectedFeedback.category]}
                  </p>
                </div>
                {selectedFeedback.severity && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Sévérité</Label>
                    <p className="font-medium">
                      {severityLabels[selectedFeedback.severity]}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Statut</Label>
                  <Select
                    value={editData.status}
                    onValueChange={(value) =>
                      setEditData({ ...editData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Ouvert</SelectItem>
                      <SelectItem value="IN_REVIEW">En cours</SelectItem>
                      <SelectItem value="PLANNED">Planifié</SelectItem>
                      <SelectItem value="DONE">Traité</SelectItem>
                      <SelectItem value="REJECTED">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <p className="font-medium">
                    {new Date(selectedFeedback.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Message</Label>
                <p className="mt-1 whitespace-pre-wrap bg-muted p-3 rounded-lg">
                  {selectedFeedback.message}
                </p>
              </div>
              {selectedFeedback.pageUrl && (
                <div>
                  <Label className="text-xs text-muted-foreground">Page concernée</Label>
                  <p className="font-medium">{selectedFeedback.pageUrl}</p>
                </div>
              )}
              <div>
                <Label htmlFor="adminNote">Note interne (admin uniquement)</Label>
                <Textarea
                  id="adminNote"
                  rows={3}
                  value={editData.adminNote}
                  onChange={(e) =>
                    setEditData({ ...editData, adminNote: e.target.value })
                  }
                  placeholder="Notes internes..."
                />
              </div>
              <div>
                <Label htmlFor="adminReply">
                  Réponse à l'agence (visible par l'agence)
                </Label>
                <Textarea
                  id="adminReply"
                  rows={4}
                  value={editData.adminReply}
                  onChange={(e) =>
                    setEditData({ ...editData, adminReply: e.target.value })
                  }
                  placeholder="Réponse visible par l'agence..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

