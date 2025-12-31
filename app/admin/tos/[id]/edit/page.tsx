"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Save,
  Send,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface TermsOfServiceDetail {
  id: string;
  version: string;
  title: string;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isCurrent: boolean;
}

export default function AdminTOSEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [tos, setTos] = useState<TermsOfServiceDetail | null>(null);
  const [formData, setFormData] = useState({
    version: "",
    title: "",
    content: "",
  });

  useEffect(() => {
    if (id) {
      fetchTOS();
    }
  }, [id]);

  const fetchTOS = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/tos/${id}`);
      const data = await res.json();

      if (data.success) {
        setTos(data.tos);
        setFormData({
          version: data.tos.version,
          title: data.tos.title,
          content: data.tos.content,
        });

        // Vérifier si on peut éditer
        if (data.tos.status !== "DRAFT") {
          toast.error("Seules les versions DRAFT peuvent être modifiées");
          router.push(`/admin/tos/${id}`);
        }
      } else {
        toast.error(data.error || "Erreur lors du chargement");
        router.push("/admin/tos");
      }
    } catch (error) {
      console.error("Error fetching TOS:", error);
      toast.error("Erreur lors du chargement");
      router.push("/admin/tos");
    }
    setIsLoading(false);
  };

  const handleSave = async (publish: boolean = false) => {
    if (!formData.version.trim() || !formData.title.trim() || !formData.content.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (publish) {
      setIsPublishing(true);
    } else {
      setIsSaving(true);
    }

    try {
      const res = await fetch(`/api/admin/tos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: formData.version.trim(),
          title: formData.title.trim(),
          content: formData.content.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (publish) {
          // Publier après sauvegarde
          const publishRes = await fetch(`/api/admin/tos/${id}/publish`, {
            method: "POST",
          });
          const publishData = await publishRes.json();

          if (publishData.success) {
            toast.success("CGU modifiées et publiées avec succès");
            router.push(`/admin/tos/${id}`);
          } else {
            toast.success("CGU modifiées avec succès, mais erreur lors de la publication");
            fetchTOS();
          }
        } else {
          toast.success("CGU modifiées avec succès");
          fetchTOS();
        }
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Error updating TOS:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tos) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/tos/${id}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Éditer les CGU</h2>
              <Badge variant="secondary">Brouillon</Badge>
            </div>
            <p className="text-muted-foreground">Version {tos.version}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Informations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="version">Version *</Label>
            <Input
              id="version"
              value={formData.version}
              onChange={(e) =>
                setFormData({ ...formData, version: e.target.value })
              }
              placeholder="ex: 1.0.0 ou 2025-01-15"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Identifiant unique de la version (format libre : numéro ou date)
            </p>
          </div>

          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Conditions Générales d'Utilisation"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="content">Contenu *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="Saisissez le contenu des CGU..."
              rows={20}
              className="mt-1 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Le contenu est stocké en texte brut. Les retours à la ligne sont préservés.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" asChild>
              <Link href={`/admin/tos/${id}`}>Annuler</Link>
            </Button>
            <Button
              onClick={() => handleSave(false)}
              disabled={isSaving || isPublishing}
            >
              {isSaving ? (
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
            <Button
              onClick={() => handleSave(true)}
              disabled={isSaving || isPublishing}
              variant="default"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publication...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enregistrer et publier
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
