"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Send,
  Loader2,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
  Plus,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Newsletter {
  _id: string;
  subject: string;
  content: string;
  status: "draft" | "sent" | "failed";
  recipientCount?: number;
  sentAt?: string;
  createdAt: string;
}

interface Stats {
  subscribers: number;
  totalSent: number;
  drafts: number;
}

interface Subscriber {
  _id: string;
  email: string;
  name?: string;
  subscribedAt: string;
  consentDate: string;
  source: string;
}

export default function AdminNewsletterPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [newsletterToSend, setNewsletterToSend] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [subscribersPage, setSubscribersPage] = useState(1);
  const [subscribersTotalPages, setSubscribersTotalPages] = useState(1);
  const [subscribersTotal, setSubscribersTotal] = useState(0);
  const [subscribersSearch, setSubscribersSearch] = useState("");

  // Form state
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchData();
    fetchSubscribers();
  }, [subscribersPage, subscribersSearch]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/newsletter");
      const data = await res.json();

      if (data.success) {
        setNewsletters(data.newsletters);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching newsletters:", error);
      toast.error("Erreur lors du chargement");
    }
    setIsLoading(false);
  };

  const handleCreate = async (asDraft: boolean = true) => {
    if (!subject.trim() || !content.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          content,
          sendNow: !asDraft,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          asDraft ? "Brouillon enregistré" : "Newsletter envoyée avec succès"
        );
        setSubject("");
        setContent("");
        setShowForm(false);
        fetchData();
      } else {
        toast.error(data.error || "Erreur lors de la création");
      }
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
    setIsCreating(false);
  };

  const handleSendClick = (newsletterId: string) => {
    setNewsletterToSend(newsletterId);
    setSendDialogOpen(true);
  };

  const handleSend = async () => {
    if (!newsletterToSend) return;

    setIsSending(true);
    try {
      const res = await fetch(
        `/api/admin/newsletter/${newsletterToSend}/send`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success(`Newsletter envoyée à ${data.recipientCount} abonnés`);
        fetchData();
      } else {
        toast.error(data.error || "Erreur lors de l'envoi");
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setIsSending(false);
      setNewsletterToSend(null);
    }
  };

  const fetchSubscribers = async () => {
    setSubscribersLoading(true);
    try {
      const params = new URLSearchParams({
        page: subscribersPage.toString(),
        limit: "50",
      });
      if (subscribersSearch) params.set("search", subscribersSearch);

      const res = await fetch(`/api/admin/newsletter/subscribers?${params}`);
      const data = await res.json();

      if (data.success) {
        setSubscribers(data.subscribers);
        setSubscribersTotalPages(data.pages);
        setSubscribersTotal(data.total);
      }
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      toast.error("Erreur lors du chargement des abonnés");
    }
    setSubscribersLoading(false);
  };

  const handleSubscribersSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribersPage(1);
    fetchSubscribers();
  };

  const handlePreview = async () => {
    try {
      const res = await fetch("/api/admin/newsletter/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, content }),
      });

      const data = await res.json();

      if (data.success) {
        setPreviewHtml(data.html);
        setShowPreview(true);
      }
    } catch (error) {
      toast.error("Erreur lors de la prévisualisation");
    }
  };

  const getStatusIcon = (status: Newsletter["status"]) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: Newsletter["status"]) => {
    switch (status) {
      case "sent":
        return "Envoyée";
      case "failed":
        return "Échec";
      default:
        return "Brouillon";
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
          <h2 className="text-2xl font-bold">Newsletter</h2>
          <p className="text-muted-foreground">
            Créez et envoyez des newsletters à vos abonnés
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle newsletter
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abonnés</p>
                <p className="text-2xl font-bold">
                  {stats?.subscribers.toLocaleString("fr-FR") || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Newsletters envoyées
                </p>
                <p className="text-2xl font-bold">{stats?.totalSent || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Send className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Brouillons</p>
                <p className="text-2xl font-bold">{stats?.drafts || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10">
                <FileText className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscribers List */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Liste des abonnés</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <form onSubmit={handleSubscribersSearch} className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email ou nom..."
                value={subscribersSearch}
                onChange={(e) => setSubscribersSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </form>

          {/* Subscribers Table */}
          {subscribersLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4" />
              <p>Aucun abonné trouvé</p>
            </div>
          ) : (
            <>
              <div className="divide-y border rounded-lg overflow-hidden">
                {subscribers.map((subscriber) => (
                  <div
                    key={subscriber._id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {subscriber.name || "Sans nom"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {subscriber.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="text-right">
                        <p className="text-xs">
                          Abonné le{" "}
                          {new Date(subscriber.subscribedAt).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                        {subscriber.source && (
                          <p className="text-xs mt-1">
                            Source: {subscriber.source}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {subscribersTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={subscribersPage === 1}
                    onClick={() => setSubscribersPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {subscribersPage} sur {subscribersTotalPages} (
                    {subscribersTotal} abonné
                    {subscribersTotal > 1 ? "s" : ""})
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={subscribersPage === subscribersTotalPages}
                    onClick={() => setSubscribersPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Form */}
      {showForm && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Créer une newsletter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Sujet</Label>
              <Input
                id="subject"
                placeholder="Sujet de la newsletter..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenu (Markdown supporté)</Label>
              <Textarea
                id="content"
                placeholder="Contenu de votre newsletter...

Vous pouvez utiliser **gras**, *italique*, et des [liens](url).

## Titre de section

- Liste
- D'éléments"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={!subject || !content}
              >
                <Eye className="w-4 h-4 mr-2" />
                Prévisualiser
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCreate(true)}
                disabled={isCreating || !subject || !content}
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Enregistrer comme brouillon
              </Button>
              <Button
                onClick={() => handleCreate(false)}
                disabled={isCreating || !subject || !content}
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Envoyer maintenant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Prévisualisation</CardTitle>
              <Button variant="ghost" onClick={() => setShowPreview(false)}>
                ✕
              </Button>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Newsletters List */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Historique</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {newsletters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4" />
              <p>Aucune newsletter créée</p>
            </div>
          ) : (
            <div className="divide-y">
              {newsletters.map((newsletter) => (
                <div
                  key={newsletter._id}
                  className="p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(newsletter.status)}
                    <div>
                      <p className="font-medium">{newsletter.subject}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(newsletter.createdAt).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                        {newsletter.recipientCount && (
                          <>
                            <span>•</span>
                            <Users className="w-3.5 h-3.5" />
                            {newsletter.recipientCount} destinataires
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        newsletter.status === "sent"
                          ? "bg-emerald-100 text-emerald-700"
                          : newsletter.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {getStatusLabel(newsletter.status)}
                    </span>

                    {newsletter.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => handleSendClick(newsletter._id)}
                        disabled={isSending}
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-1" />
                            Envoyer
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
