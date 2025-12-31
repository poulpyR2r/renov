"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  url: string;
  title?: string;
  text?: string;
}

export function ShareButton({ url, title, text }: ShareButtonProps) {
  const handleShare = async () => {
    const shareData: ShareData = {
      title: title || "Annonce immobilière",
      text: text || "Découvrez cette annonce immobilière",
      url: url,
    };

    try {
      // Vérifier si l'API Web Share est disponible (principalement sur mobile)
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
        toast.success("Partagé avec succès");
      } else {
        // Fallback: copier le lien dans le presse-papiers
        await navigator.clipboard.writeText(url);
        toast.success("Lien copié dans le presse-papiers");
      }
    } catch (error: any) {
      // L'utilisateur a annulé le partage ou une erreur s'est produite
      if (error.name !== "AbortError") {
        // Si ce n'est pas une annulation, essayer de copier dans le presse-papiers
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Lien copié dans le presse-papiers");
        } catch (clipboardError) {
          toast.error("Erreur lors du partage");
        }
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={handleShare}
      aria-label="Partager cette annonce"
    >
      <Share2 className="w-4 h-4" />
    </Button>
  );
}
