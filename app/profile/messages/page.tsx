"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Home,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (days === 1) {
    return "Hier";
  } else if (days < 7) {
    return `Il y a ${days} jours`;
  } else {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

interface Conversation {
  id: string;
  listingId: string | null;
  listing: {
    id: string;
    title: string;
    price: number;
  } | null;
  agency: {
    id: string;
    companyName: string;
    logo?: string;
  } | null;
  lastMessage: {
    body: string;
    senderType: "USER" | "AGENCY";
    createdAt: string;
  } | null;
  unreadCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  status: string;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user?.role === "agency" || session.user?.role === "admin") {
      router.push("/");
      return;
    }

    fetchConversations();
  }, [session, status, router]);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/me/conversations");
      const data = await response.json();

      if (data.success) {
        setConversations(data.conversations);
      } else {
        toast.error("Erreur lors du chargement des conversations");
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Erreur lors du chargement des conversations");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/30 to-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/30 to-background">
      <Header />

      <main className="flex-1 container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary" />
            Messagerie
          </h1>
          <p className="text-muted-foreground">
            Vos conversations avec les agences immobilières
          </p>
        </div>

        {conversations.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Aucune conversation
              </h2>
              <p className="text-muted-foreground mb-6">
                Vous n'avez pas encore de conversation avec une agence.
              </p>
              <Button asChild>
                <Link href="/search">
                  <Home className="w-4 h-4 mr-2" />
                  Parcourir les annonces
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => router.push(`/profile/messages/${conv.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Logo Agence */}
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {conv.agency?.logo ? (
                        <img
                          src={conv.agency.logo}
                          alt={conv.agency.companyName}
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-primary" />
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {conv.agency?.companyName || "Agence"}
                          </h3>
                          {conv.listing && (
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.listing.title}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {conv.unreadCount > 0 && (
                            <Badge variant="default" className="rounded-full">
                              {conv.unreadCount}
                            </Badge>
                          )}
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>

                      {conv.lastMessage && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {conv.lastMessage.body}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(conv.lastMessage.createdAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
