"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  ArrowLeft,
  Send,
  Loader2,
  Building2,
  Home,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Message {
  id: string;
  senderType: "USER" | "AGENCY";
  body: string;
  createdAt: string;
  readByUserAt?: string;
  readByAgencyAt?: string;
}

interface Conversation {
  id: string;
  listingId: string | null;
  agencyId: string;
  status: string;
  lastMessageAt: string | null;
  createdAt: string;
}

export default function ConversationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [agency, setAgency] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

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

    fetchConversation();
  }, [session, status, router, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversation = useCallback(
    async (setLoading = true) => {
      if (setLoading) {
        setIsLoading(true);
      }
      try {
        const response = await fetch(
          `/api/me/conversations/${conversationId}?page=${page}&limit=50`
        );
        const data = await response.json();

        if (data.success) {
          setConversation(data.conversation);
          setMessages(data.messages);
          setHasMore(data.page < data.pages);

          // Récupérer les infos de l'agence et de l'annonce
          if (data.conversation.agencyId) {
            const agencyResponse = await fetch(
              `/api/agencies/${data.conversation.agencyId}/public`
            );
            const agencyData = await agencyResponse.json();
            if (agencyData.success) {
              setAgency(agencyData.agency);
            }
          }

          if (data.conversation.listingId) {
            const listingResponse = await fetch(
              `/api/listing/${data.conversation.listingId}`
            );
            const listingData = await listingResponse.json();
            if (listingData) {
              setListing(listingData);
            }
          }
        } else {
          toast.error("Erreur lors du chargement de la conversation");
          router.push("/profile/messages");
        }
      } catch (error) {
        console.error("Error fetching conversation:", error);
        if (setLoading) {
          toast.error("Erreur lors du chargement de la conversation");
        }
      } finally {
        if (setLoading) {
          setIsLoading(false);
        }
      }
    },
    [conversationId, page, router]
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    setIsSending(true);
    const messageText = message.trim();
    setMessage("");

    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: messageText }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Ajouter le message à la liste
        setMessages((prev) => [
          ...prev,
          {
            id: data.message.id,
            senderType: data.message.senderType,
            body: data.message.body,
            createdAt: data.message.createdAt,
          },
        ]);
        // Recharger la conversation pour avoir les messages à jour
        setTimeout(() => fetchConversation(false), 500);
      } else {
        toast.error(data.error || "Erreur lors de l'envoi du message");
        setMessage(messageText);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur lors de l'envoi du message");
      setMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/profile/messages")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              {agency?.companyName || "Conversation"}
            </h1>
            {listing && (
              <p className="text-sm text-muted-foreground">{listing.title}</p>
            )}
          </div>
          {conversation?.listingId && (
            <Button asChild variant="outline" className="gap-2">
              <Link href={`/l/${conversation.listingId}`}>
                <ExternalLink className="w-4 h-4" />
                Voir l'annonce
              </Link>
            </Button>
          )}
        </div>

        {/* Messages */}
        <Card className="border-0 shadow-lg mb-4">
          <CardContent className="p-6">
            <div className="space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  Aucun message pour le moment
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.senderType === "USER";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.body}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            isUser
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatMessageTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Input */}
        <form onSubmit={handleSendMessage}>
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tapez votre message..."
              className="flex-1"
              disabled={isSending}
              maxLength={5000}
            />
            <Button type="submit" disabled={isSending || !message.trim()}>
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
