"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Copy,
  Send,
  CheckCircle,
  FileText,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LegalDocumentType =
  | "CGU"
  | "MENTIONS_LEGALES"
  | "POLITIQUE_CONFIDENTIALITE"
  | "POLITIQUE_COOKIES"
  | "CGV";

interface TermsOfService {
  id: string;
  type: LegalDocumentType;
  version: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isCurrent: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<LegalDocumentType, string> = {
  CGU: "CGU",
  MENTIONS_LEGALES: "Mentions Légales",
  POLITIQUE_CONFIDENTIALITE: "Politique de Confidentialité",
  POLITIQUE_COOKIES: "Politique de Cookies",
  CGV: "CGV",
};

export default function AdminTOSPage() {
  const router = useRouter();
  const [tos, setTos] = useState<TermsOfService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedType, setSelectedType] = useState<LegalDocumentType | "all">("all");
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [tosToPublish, setTosToPublish] = useState<string | null>(null);
  const [makeCurrentDialogOpen, setMakeCurrentDialogOpen] = useState(false);
  const [tosToMakeCurrent, setTosToMakeCurrent] = useState<string | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [tosToDuplicate, setTosToDuplicate] = useState<string | null>(null);
  const [newVersion, setNewVersion] = useState("");

  useEffect(() => {
    fetchTOS();
  }, [page, selectedType]);

  const fetchTOS = async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/admin/tos", window.location.origin);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("limit", "20");
      if (selectedType !== "all") {
        url.searchParams.set("type", selectedType);
      }
      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.success) {
        setTos(data.tos);
        setTotalPages(data.pages);
        setTotal(data.total);
      } else {
        toast.error("Erreur lors du chargement des CGU");
      }
    } catch (error) {
      console.error("Error fetching TOS:", error);
      toast.error("Erreur lors du chargement des documents légaux");
    }
    setIsLoading(false);
  };

  const handlePublishClick = (id: string) => {
    setTosToPublish(id);
    setPublishDialogOpen(true);
  };

  const handlePublish = async () => {
    if (!tosToPublish) return;

    try {
      const res = await fetch(`/api/admin/tos/${tosToPublish}/publish`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("CGU publiées avec succès");
        setPublishDialogOpen(false);
        setTosToPublish(null);
        fetchTOS();
      } else {
        toast.error(data.error || "Erreur lors de la publication");
      }
    } catch (error) {
      console.error("Error publishing TOS:", error);
      toast.error("Erreur lors de la publication");
    }
  };

  const handleMakeCurrentClick = (id: string) => {
    setTosToMakeCurrent(id);
    setMakeCurrentDialogOpen(true);
  };

  const handleMakeCurrent = async () => {
    if (!tosToMakeCurrent) return;

    try {
      const res = await fetch(`/api/admin/tos/${tosToMakeCurrent}/make-current`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Version définie comme courante");
        setMakeCurrentDialogOpen(false);
        setTosToMakeCurrent(null);
        fetchTOS();
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Error making current TOS:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDuplicateClick = (id: string) => {
    setTosToDuplicate(id);
    setNewVersion("");
    setDuplicateDialogOpen(true);
  };

  const handleDuplicate = async () => {
    if (!tosToDuplicate || !newVersion.trim()) {
      toast.error("Veuillez saisir une version");
      return;
    }

    try {
      const res = await fetch(`/api/admin/tos/${tosToDuplicate}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newVersion: newVersion.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("CGU dupliquées avec succès");
        setDuplicateDialogOpen(false);
        setTosToDuplicate(null);
        setNewVersion("");
        fetchTOS();
        // Rediriger vers l'édition de la nouvelle version
        router.push(`/admin/tos/${data.tos.id}/edit`);
      } else {
        toast.error(data.error || "Erreur lors de la duplication");
      }
    } catch (error) {
      console.error("Error duplicating TOS:", error);
      toast.error("Erreur lors de la duplication");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge className="bg-emerald-500">Publié</Badge>;
      case "DRAFT":
        return <Badge variant="secondary">Brouillon</Badge>;
      case "ARCHIVED":
        return <Badge variant="outline">Archivé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documents Légaux</h2>
          <p className="text-muted-foreground">
            {total} document{total > 1 ? "s" : ""} au total
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/tos/new">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau document
          </Link>
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Label htmlFor="type-filter">Filtrer par type :</Label>
        <Select value={selectedType} onValueChange={(value) => setSelectedType(value as any)}>
          <SelectTrigger id="type-filter" className="w-[250px]">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* TOS List */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : tos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FileText className="w-12 h-12 mb-4" />
              <p>Aucun document légal</p>
              <Button asChild className="mt-4">
                <Link href="/admin/tos/new">Créer un nouveau document</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {tos.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold">{item.title}</p>
                      <Badge variant="outline">{TYPE_LABELS[item.type]}</Badge>
                      {item.isCurrent && (
                        <Badge className="bg-primary">Version courante</Badge>
                      )}
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Version: {item.version}</span>
                      <span>Créée: {formatDate(item.createdAt)}</span>
                      {item.publishedAt && (
                        <span>Publiée: {formatDate(item.publishedAt)}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <Link href={`/admin/tos/${item.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>

                    {item.status === "DRAFT" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/admin/tos/${item.id}/edit`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateClick(item.id)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>

                    {item.status === "DRAFT" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePublishClick(item.id)}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    )}

                    {item.status === "PUBLISHED" && !item.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMakeCurrentClick(item.id)}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
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

      {/* Publish Confirmation Dialog */}
      <ConfirmDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        onConfirm={handlePublish}
        title="Publier cette version"
        description="Cette version sera marquée comme PUBLISHED. Elle ne pourra plus être modifiée directement."
        confirmText="Publier"
        cancelText="Annuler"
        variant="default"
      />

      {/* Make Current Confirmation Dialog */}
      <ConfirmDialog
        open={makeCurrentDialogOpen}
        onOpenChange={setMakeCurrentDialogOpen}
        onConfirm={handleMakeCurrent}
        title="Définir comme version courante"
        description="Cette version sera définie comme version courante et sera visible par tous les utilisateurs. L'ancienne version courante sera désactivée."
        confirmText="Définir comme courante"
        cancelText="Annuler"
        variant="default"
      />

      {/* Duplicate Dialog */}
      <Dialog
        open={duplicateDialogOpen}
        onOpenChange={(open) => {
          setDuplicateDialogOpen(open);
          if (!open) {
            setTosToDuplicate(null);
            setNewVersion("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dupliquer cette version</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Créer une copie en brouillon avec une nouvelle version.
            </p>
            <div>
              <Label htmlFor="newVersion">Nouvelle version</Label>
              <Input
                id="newVersion"
                type="text"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                placeholder="ex: 1.0.1 ou 2025-01-20"
                className="mt-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleDuplicate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDuplicateDialogOpen(false);
                setTosToDuplicate(null);
                setNewVersion("");
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleDuplicate} disabled={!newVersion.trim()}>
              Dupliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
