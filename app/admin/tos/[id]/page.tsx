"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Edit,
  FileText,
  Calendar,
  User,
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
  publishedAt?: string;
  createdByAdminId?: string;
  updatedByAdminId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTOSDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [tos, setTos] = useState<TermsOfServiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
            <Link href="/admin/tos">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{tos.title}</h2>
            <p className="text-muted-foreground">Version {tos.version}</p>
          </div>
        </div>
        {tos.status === "DRAFT" && (
          <Button asChild>
            <Link href={`/admin/tos/${tos.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Éditer
            </Link>
          </Button>
        )}
      </div>

      {/* Status and Info */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Informations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Statut</p>
              {getStatusBadge(tos.status)}
              {tos.isCurrent && (
                <Badge className="bg-primary mt-2">Version courante</Badge>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Version</p>
              <p className="font-medium">{tos.version}</p>
            </div>
            {tos.publishedAt && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Date de publication
                </p>
                <p className="font-medium">{formatDate(tos.publishedAt)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Créée le</p>
              <p className="font-medium">{formatDate(tos.createdAt)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Dernière mise à jour
              </p>
              <p className="font-medium">{formatDate(tos.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Preview */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Contenu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-stone dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm bg-muted/50 p-4 rounded-lg">
              {tos.content}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
