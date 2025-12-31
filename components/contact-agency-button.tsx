"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface ContactAgencyButtonProps {
  listingId: string;
  agencyId: string;
  className?: string;
}

export function ContactAgencyButton({
  listingId,
  agencyId,
  className,
}: ContactAgencyButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (status === "loading") {
      return;
    }

    if (!session) {
      // Utilisateur non connecté : rediriger vers login avec returnTo
      const returnTo = encodeURIComponent(
        JSON.stringify({
          type: "conversation",
          listingId,
          agencyId,
        })
      );
      router.push(`/login?returnTo=${returnTo}`);
      return;
    }

    // Utilisateur connecté : créer la conversation
    setIsLoading(true);
    try {
      const response = await fetch(`/api/listings/${listingId}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création de la conversation");
      }

      // Rediriger vers la page de conversation
      router.push(`/profile/messages/${data.conversationId}`);
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      toast.error(error.message || "Erreur lors de la création de la conversation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      size="lg"
      className={className}
      disabled={isLoading || status === "loading"}
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      {isLoading ? "Chargement..." : "Envoyer un message"}
    </Button>
  );
}

