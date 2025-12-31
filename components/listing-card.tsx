"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Home,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Building2,
  Eye,
  Calendar,
  ExternalLink,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { FavoriteButton } from "@/components/favorite-button";

interface ListingCardProps {
  listing: any;
  variant?: "default" | "compact" | "featured";
}

function formatPrice(price?: number): string {
  if (!price) return "Prix NC";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

function getPropertyTypeIcon(type?: string) {
  switch (type) {
    case "house":
      return Home;
    case "apartment":
      return Building2;
    case "building":
      return Building2;
    default:
      return Home;
  }
}

function getPropertyTypeLabel(type?: string): string {
  switch (type) {
    case "house":
      return "Maison";
    case "apartment":
      return "Appartement";
    case "building":
      return "Immeuble";
    default:
      return "Bien";
  }
}

function getScoreColor(score?: number | null): string {
  if (score === undefined || score === null)
    return "bg-muted text-muted-foreground";
  if (score >= 80) return "bg-emerald-500 text-white";
  if (score >= 60) return "bg-amber-500 text-white";
  if (score >= 40) return "bg-orange-500 text-white";
  if (score >= 20) return "bg-red-500 text-white";
  return "bg-stone-500 text-white"; // Score très faible (0-19)
}

function getScoreLabel(score?: number | null): string {
  if (score === undefined || score === null) return "N/A";
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Bon";
  if (score >= 40) return "Moyen";
  if (score >= 20) return "Faible";
  return "Très faible"; // Score 0-19
}

function getRenovationLevelLabel(level?: number): string {
  if (!level) return "Non renseigné";
  const labels: Record<number, string> = {
    1: "À rénover complètement",
    2: "Rénovation importante",
    3: "Rénovation partielle",
    4: "Bon état",
    5: "Excellent état",
  };
  return labels[level] || "Non renseigné";
}

function getRenovationLevelColor(level?: number): string {
  if (!level) return "bg-muted text-muted-foreground";
  if (level <= 2) return "bg-red-500 text-white";
  if (level === 3) return "bg-amber-500 text-white";
  return "bg-emerald-500 text-white";
}

function formatDate(date?: string | Date): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function ListingCard({
  listing,
  variant = "default",
}: ListingCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const images = listing.images?.filter(Boolean) || [];
  const hasMultipleImages = images.length > 1;
  const currentImage =
    images[currentImageIndex] || "/placeholder.svg?height=300&width=400";

  const PropertyIcon = getPropertyTypeIcon(listing.propertyType);

  const handleCardClick = async () => {
    // Track click when user clicks on the listing card
    if (listing._id) {
      try {
        await fetch(`/api/listings/${listing._id}/click`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Error tracking click:", error);
      }
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (variant === "compact") {
    return (
      <Link
        href={`/l/${listing._id}`}
        className="block group"
        onClick={handleCardClick}
      >
        <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
          <div className="flex">
            {/* Image */}
            <div className="relative w-32 h-32 shrink-0">
              <Image
                src={imageError ? "/placeholder.svg" : currentImage}
                alt={listing.title}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
              <div className="absolute bottom-1 left-1 flex items-center gap-1 z-10">
                {listing.isSponsored && (
                  <div className="px-2 py-1 rounded-md text-[10px] font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg animate-pulse">
                    <Zap className="w-2.5 h-2.5 inline mr-0.5 fill-white" />
                    Sponsorisée
                  </div>
                )}
                {typeof listing.renovationScore === "number" && (
                  <div
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getScoreColor(
                      listing.renovationScore
                    )}`}
                  >
                    {listing.renovationScore}
                  </div>
                )}
                {listing.renovation?.level && (
                  <div
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getRenovationLevelColor(
                      listing.renovation.level
                    )}`}
                  >
                    {listing.renovation.level}/5
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-3 min-w-0">
              <p className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                {listing.title}
              </p>
              <p className="text-primary font-bold text-lg mt-1">
                {formatPrice(listing.price)}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 min-w-0 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {listing.location?.city || "—"}
                  </span>
                </span>
                {listing.surface && (
                  <span className="flex items-center gap-1 shrink-0">
                    <Maximize2 className="w-3 h-3" />
                    {listing.surface}m²
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link
      href={`/l/${listing._id}`}
      className="block group"
      onClick={handleCardClick}
    >
      <Card
        className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 bg-card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Section */}
        <div className="relative h-56 overflow-hidden">
          {/* Image principale */}
          <Image
            src={imageError ? "/placeholder.svg" : currentImage}
            alt={listing.title}
            fill
            className={`object-cover transition-transform duration-700 ${
              isHovered ? "scale-110" : "scale-100"
            }`}
            onError={() => setImageError(true)}
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
            {/* Type de bien */}
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-white/90 backdrop-blur-sm text-foreground hover:bg-white shadow-lg"
              >
                <PropertyIcon className="w-3 h-3 mr-1" />
                {getPropertyTypeLabel(listing.propertyType)}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <FavoriteButton listingId={listing._id} />
            </div>
          </div>

          {/* Prix en bas de l'image */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-white/80 text-sm font-medium truncate">
                {listing.location?.city || "Localisation inconnue"}
              </p>
              <p className="text-white text-2xl font-bold drop-shadow-lg">
                {formatPrice(listing.price)}
              </p>
            </div>

            {/* Indicateur images */}
            {hasMultipleImages && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                {images.slice(0, 5).map((_: string, idx: number) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === currentImageIndex ? "bg-white w-3" : "bg-white/50"
                    }`}
                  />
                ))}
                {images.length > 5 && (
                  <span className="text-white text-[10px] ml-1">
                    +{images.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Navigation images */}
          {hasMultipleImages && isHovered && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col h-[200px]">
          {/* Badges au-dessus du titre */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {listing.isSponsored && (
              <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-lg">
                <Zap className="w-3.5 h-3.5 mr-1 fill-white" />
                Sponsorisée
              </Badge>
            )}
            {/* {typeof listing.renovationScore === "number" && (
              <Badge
                className={`${getScoreColor(
                  listing.renovationScore
                )} border-0 shadow-lg`}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                {listing.renovationScore} -{" "}
                {getScoreLabel(listing.renovationScore)}
              </Badge>
            )} */}
            {listing.renovation?.level && (
              <Badge
                className={`${getRenovationLevelColor(
                  listing.renovation.level
                )} border-0 shadow-lg`}
              >
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                Score rénovation: {listing.renovation.level}/5
              </Badge>
            )}

            {listing.renovation.level && (
              <Badge
                className={`${getRenovationLevelColor(
                  listing.renovation.level
                )} border-0 shadow-lg`}
              >
                {getRenovationLevelLabel(listing.renovation.level)}
              </Badge>
            )}
          </div>

          {/* Titre - hauteur fixe pour 2 lignes */}
          <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors mb-1 min-h-[2.75rem]">
            {listing.title}
          </h3>

          {/* Caractéristiques - hauteur fixe */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mb-2 min-h-[1.5rem]">
            <div className="flex items-center gap-1 min-w-0 max-w-[45%]">
              <MapPin className="w-3.5 h-3.5 text-primary/60 shrink-0" />
              <span className="truncate text-xs">
                {listing.location?.city || "—"}
              </span>
              {listing.location?.department && (
                <span className="text-[10px] shrink-0 text-muted-foreground/70">
                  ({listing.location.department})
                </span>
              )}
            </div>
            {listing.surface && (
              <div className="flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-primary/60" />
                <span className="text-xs">{listing.surface} m²</span>
              </div>
            )}
            {listing.rooms && (
              <div className="flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-primary/60" />
                <span className="text-xs">{listing.rooms} p.</span>
              </div>
            )}
          </div>

          {/* Description courte - hauteur fixe */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2 min-h-[2.5rem]">
            {listing.description || "Aucune description disponible."}
          </p>

          {/* Footer - toujours en bas */}
          <div className="flex items-center justify-between pt-2 border-t mt-auto">
            <div className="flex items-center gap-2 min-w-0">
              {/* Source */}
              {listing.sourceName && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-normal bg-muted/50 px-1.5 py-0.5"
                >
                  <ExternalLink className="w-2.5 h-2.5 mr-1 opacity-50" />
                  {listing.sourceName}
                </Badge>
              )}

              {/* Date */}
              {listing.createdAt && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {formatDate(listing.createdAt)}
                </span>
              )}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-1 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Eye className="w-3.5 h-3.5" />
              <span>Voir</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
