"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FavoriteButtonProps {
  listingId: string;
  variant?: "icon" | "button";
  className?: string;
  initialFavorites?: string[];
}

export function FavoriteButton({
  listingId,
  variant = "icon",
  className = "",
  initialFavorites = [],
}: FavoriteButtonProps) {
  const { data: session, status } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialFavorites.includes(listingId)) {
      setIsFavorite(true);
    }
  }, [initialFavorites, listingId]);

  useEffect(() => {
    // Charger les favoris de l'utilisateur
    if (session?.user) {
      fetch("/api/favorites")
        .then((res) => res.json())
        .then((data) => {
          if (data.favorites?.includes(listingId)) {
            setIsFavorite(true);
          }
        })
        .catch(console.error);
    }
  }, [session, listingId]);

  // Ne pas afficher le bouton favoris pour les admins et les agences
  if (session?.user?.role === "admin" || session?.user?.role === "agency") {
    return null;
  }

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status === "loading") return;

    if (!session) {
      toast.info("Connectez-vous pour sauvegarder vos favoris");
      signIn("google");
      return;
    }

    setIsLoading(true);

    try {
      const method = isFavorite ? "DELETE" : "POST";
      const res = await fetch(`/api/favorites/${listingId}`, { method });
      const data = await res.json();

      if (res.ok) {
        setIsFavorite(!isFavorite);
        toast.success(isFavorite ? "Retiré des favoris" : "Ajouté aux favoris");
      } else {
        toast.error(data.error || "Une erreur est survenue");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "button") {
    return (
      <Button
        variant={isFavorite ? "secondary" : "outline"}
        size="sm"
        onClick={toggleFavorite}
        disabled={isLoading}
        className={`gap-2 ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? "fill-red-500 text-red-500" : ""
            }`}
          />
        )}
        {isFavorite ? "Favori" : "Sauvegarder"}
      </Button>
    );
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`p-2 rounded-full bg-white/90 backdrop-blur shadow-lg hover:scale-110 transition-all disabled:opacity-50 ${className}`}
      aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : (
        <Heart
          className={`w-5 h-5 transition-colors ${
            isFavorite
              ? "fill-red-500 text-red-500"
              : "text-muted-foreground hover:text-red-500"
          }`}
        />
      )}
    </button>
  );
}
