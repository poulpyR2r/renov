"use client";

import { useState, useEffect } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  MessageSquare,
  Send,
  List,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Bug,
  Sparkles,
  Wrench,
  FileText,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Feedback {
  _id: string;
  title: string;
  message: string;
  category: "BUG" | "FEATURE_REQUEST" | "IMPROVEMENT" | "OTHER";
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_REVIEW" | "PLANNED" | "DONE" | "REJECTED";
  pageUrl?: string;
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

export default function FeedbackPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("create");
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    category: "" as "" | "BUG" | "FEATURE_REQUEST" | "IMPROVEMENT" | "OTHER",
    severity: "" as "" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    pageUrl: "",
  });

  useEffect(() => {
    fetchFeedbacks();
    // Auto-remplir pageUrl avec la route courante
    if (typeof window !== "undefined") {
      setFormData((prev) => ({
        ...prev,
        pageUrl: window.location.pathname,
      }));
    }
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agency/feedback");
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.data);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des retours");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message || !formData.category) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/agency/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
          category: formData.category,
          severity: formData.severity || undefined,
          pageUrl: formData.pageUrl || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Retour envoyé avec succès !");
        setFormData({
          title: "",
          message: "",
          category: "",
          severity: "",
          pageUrl: window.location.pathname,
        });
        fetchFeedbacks();
        setActiveTab("list");
      } else {
        toast.error(data.error || "Erreur lors de l'envoi");
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi du retour");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/agency/feedback/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedFeedback(data.data);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement du détail");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support / Retours</h1>
        <p className="text-muted-foreground mt-2">
          Envoyez vos retours, signalez des bugs ou proposez des améliorations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="create">
            <Send className="w-4 h-4 mr-2" />
            Envoyer un retour
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="w-4 h-4 mr-2" />
            Mes retours ({feedbacks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Nouveau retour</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Titre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Ex: Bug sur la page de recherche"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">
                    Catégorie <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, category: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Label htmlFor="severity">Sévérité (optionnel)</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, severity: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une sévérité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Faible</SelectItem>
                      <SelectItem value="MEDIUM">Moyenne</SelectItem>
                      <SelectItem value="HIGH">Élevée</SelectItem>
                      <SelectItem value="CRITICAL">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">
                    Message <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Décrivez votre retour en détail..."
                    rows={6}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pageUrl">Page concernée (optionnel)</Label>
                  <Input
                    id="pageUrl"
                    placeholder="/agency/listings"
                    value={formData.pageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, pageUrl: e.target.value })
                    }
                  />
                </div>

                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : feedbacks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Aucun retour envoyé pour le moment
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <Card
                  key={feedback._id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleViewDetail(feedback._id)}
                >
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
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {feedback.message}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>
                            {categoryLabels[feedback.category]}
                            {feedback.severity &&
                              ` • ${severityLabels[feedback.severity]}`}
                          </span>
                          <span>
                            {new Date(feedback.createdAt).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                          {feedback.pageUrl && (
                            <span className="flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              {feedback.pageUrl}
                            </span>
                          )}
                        </div>
                        {feedback.adminReply && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">
                              Réponse de l'équipe :
                            </p>
                            <p className="text-sm">{feedback.adminReply}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedFeedback && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedFeedback.title}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedFeedback(null)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <Badge
                  className={`${statusColors[selectedFeedback.status]} text-white`}
                >
                  {statusLabels[selectedFeedback.status]}
                </Badge>
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
              <p className="mt-1 whitespace-pre-wrap">
                {selectedFeedback.message}
              </p>
            </div>
            {selectedFeedback.pageUrl && (
              <div>
                <Label className="text-xs text-muted-foreground">Page concernée</Label>
                <p className="font-medium">{selectedFeedback.pageUrl}</p>
              </div>
            )}
            {selectedFeedback.adminReply && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Réponse de l'équipe
                </Label>
                <p className="whitespace-pre-wrap">
                  {selectedFeedback.adminReply}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

