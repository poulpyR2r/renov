"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Loader2,
  ArrowLeft,
  Save,
  Send,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type LegalDocumentType =
  | "CGU"
  | "MENTIONS_LEGALES"
  | "POLITIQUE_CONFIDENTIALITE"
  | "POLITIQUE_COOKIES"
  | "CGV";

const TYPE_LABELS: Record<LegalDocumentType, string> = {
  CGU: "Conditions Générales d'Utilisation",
  MENTIONS_LEGALES: "Mentions Légales",
  POLITIQUE_CONFIDENTIALITE: "Politique de Confidentialité",
  POLITIQUE_COOKIES: "Politique de Cookies",
  CGV: "Conditions Générales de Vente",
};

export default function AdminTOSNewPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [formData, setFormData] = useState({
    type: "CGU" as LegalDocumentType,
    version: "",
    title: TYPE_LABELS.CGU,
    content: "",
  });

  const handleSave = async (publish: boolean = false) => {
    if (!formData.type || !formData.version.trim() || !formData.title.trim() || !formData.content.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (publish) {
      setIsPublishing(true);
    } else {
      setIsSaving(true);
    }

    try {
      const res = await fetch("/api/admin/tos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          version: formData.version.trim(),
          title: formData.title.trim(),
          content: formData.content.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (publish) {
          // Publier après création
          const publishRes = await fetch(`/api/admin/tos/${data.tos.id}/publish`, {
            method: "POST",
          });
          const publishData = await publishRes.json();

          if (publishData.success) {
            toast.success("Document créé et publié avec succès");
            router.push(`/admin/tos/${data.tos.id}`);
          } else {
            toast.success("Document créé avec succès, mais erreur lors de la publication");
            router.push(`/admin/tos/${data.tos.id}/edit`);
          }
        } else {
          toast.success("Document créé avec succès");
          router.push(`/admin/tos/${data.tos.id}/edit`);
        }
      } else {
        toast.error(data.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error creating TOS:", error);
      toast.error("Erreur lors de la création");
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/tos">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Nouveau document légal</h2>
          <p className="text-muted-foreground">Créer un nouveau document légal en brouillon</p>
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
            <Label htmlFor="type">Type de document *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => {
                const type = value as LegalDocumentType;
                setFormData({
                  ...formData,
                  type,
                  title: TYPE_LABELS[type],
                });
              }}
            >
              <SelectTrigger id="type" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              <Link href="/admin/tos">Annuler</Link>
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
                  Enregistrer comme brouillon
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
                  Créer et publier
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
