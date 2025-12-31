"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  ArrowLeft,
  Send,
  Loader2,
  User,
  Home,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAgencyRole } from "@/hooks/useAgencyRole";

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
  userId: string;
  status: string;
  lastMessageAt: string | null;
  createdAt: string;
}

export default function AgencyConversationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;
  const agencyRole = useAgencyRole();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user?.role !== "agency") {
      router.push("/login");
      return;
    }

    fetchAgencyId();
  }, [session, status, router]);

  useEffect(() => {
    if (agencyId) {
      fetchConversation();
    }
  }, [agencyId, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchAgencyId = async () => {
    try {
      const response = await fetch("/api/agency/me");
      const data = await response.json();
      if (data.success && data.agency?._id) {
        const agencyIdValue = data.agency._id;
        setAgencyId(
          typeof agencyIdValue === "string"
            ? agencyIdValue
            : agencyIdValue.toString()
        );
      } else {
        console.error("Error fetching agency ID: response not successful", data);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching agency ID:", error);
      setIsLoading(false);
    }
  };

  const fetchConversation = useCallback(async (setLoading = true) => {
    if (!agencyId) return;

    if (setLoading) {
      setIsLoading(true);
    }

    try {
      const response = await fetch(
        `/api/agencies/${agencyId}/conversations/${conversationId}?page=1&limit=50`
      );
      const data = await response.json();

      if (data.success) {
        setConversation(data.conversation);
        setMessages(data.messages);

        // Les infos utilisateur et annonce sont déjà dans la réponse
        if (data.user) {
          setUser(data.user);
        }
        if (data.listing) {
          setListing(data.listing);
        }
      } else {
        toast.error("Erreur lors du chargement de la conversation");
        router.push("/agency/messages");
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
  }, [agencyId, conversationId, router]);

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
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/agency/messages")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            {user?.name || user?.email || "Utilisateur"}
          </h1>
          {listing && (
            <p className="text-sm text-muted-foreground">{listing.title}</p>
          )}
        </div>
        {conversation?.listingId && (
          <Button
            asChild
            variant="outline"
            className="gap-2"
          >
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
                const isAgency = msg.senderType === "AGENCY";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isAgency ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isAgency
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.body}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isAgency
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
    </div>
  );
}

