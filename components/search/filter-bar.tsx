"use client";

import { Map, MapPin, Home, CircleDollarSign, SlidersHorizontal, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  filters: any;
  onShowMap: () => void;
  onOpenLocation: () => void;
  onOpenPropertyType: () => void;
  onOpenPrice: () => void;
  onOpenFilters: () => void;
  onRemoveFilter: (filterKey: string, value?: string) => void;
  activeFiltersCount: number;
  sortBy: string;
  sortOrder: string;
  onSortChange: (sortBy: string, sortOrder: string) => void;
}

export function FilterBar({
  filters,
  onShowMap,
  onOpenLocation,
  onOpenPropertyType,
  onOpenPrice,
  onOpenFilters,
  onRemoveFilter,
  activeFiltersCount,
  sortBy,
  sortOrder,
  onSortChange,
}: FilterBarProps) {
  const getPropertyTypeLabel = () => {
    if (filters.propertyTypes.length === 0) return "Type de bien";
    if (filters.propertyTypes.length === 1) {
      const labels: Record<string, string> = {
        house: "Maison",
        apartment: "Appartement",
        building: "Immeuble",
        land: "Terrain",
        other: "Autre",
      };
      return labels[filters.propertyTypes[0]] || "Type de bien";
    }
    return `${filters.propertyTypes.length} types`;
  };

  const getPriceLabel = () => {
    if (!filters.minPrice && !filters.maxPrice) return "Prix";
    const min = filters.minPrice ? filters.minPrice.replace(/\s/g, "") : "0";
    const max = filters.maxPrice ? filters.maxPrice.replace(/\s/g, "") : "∞";
    return `${min}€ - ${max}€`;
  };

  const getSortLabel = () => {
    const labels: Record<string, string> = {
      date: "Pertinence",
      price: "Prix",
      surface: "Surface",
      renovationLevel: "Rénovation",
    };
    return labels[sortBy] || "Pertinence";
  };

  const hasActiveChips = filters.cities?.length > 0 || filters.minPrice || filters.maxPrice || filters.propertyTypes.length > 0;

  return (
    <div className="sticky top-0 z-40 bg-background border-b">
      {/* Pills bar */}
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="lg"
            onClick={onShowMap}
            className="rounded-full h-11 px-6 whitespace-nowrap flex-1 min-w-[140px] max-w-[200px]"
          >
            <Map className="h-5 w-5 mr-2" />
            Carte
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onOpenLocation}
            className="rounded-full h-11 px-6 whitespace-nowrap flex-1 min-w-[200px] max-w-[250px]"
          >
            <MapPin className="h-5 w-5 mr-2" />
            <span className="truncate">
              {filters.cities?.length > 0
                ? filters.cities.length === 1
                  ? filters.cities[0]
                  : `${filters.cities.length} villes`
                : "Choisir une localisation"}
            </span>
            <ChevronRight className="h-5 w-5 ml-2 shrink-0" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onOpenPropertyType}
            className="rounded-full h-11 px-6 whitespace-nowrap flex-1 min-w-[160px] max-w-[200px]"
          >
            <Home className="h-5 w-5 mr-2" />
                    <span className="truncate capitalize">{getPropertyTypeLabel()}</span>
            <ChevronRight className="h-5 w-5 ml-2 shrink-0" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onOpenPrice}
            className="rounded-full h-11 px-6 whitespace-nowrap flex-1 min-w-[140px] max-w-[200px]"
          >
            <CircleDollarSign className="h-5 w-5 mr-2" />
            <span className="truncate">{getPriceLabel()}</span>
            <ChevronRight className="h-5 w-5 ml-2 shrink-0" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onOpenFilters}
            className="rounded-full h-11 px-6 whitespace-nowrap flex-1 min-w-[140px] max-w-[200px] relative"
          >
            <SlidersHorizontal className="h-5 w-5 mr-2" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Context chips */}
        {hasActiveChips && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-sm">
              <span>Ventes immobilières</span>
              <ChevronRight className="h-3 w-3" />
            </div>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-sm">
              <span>Tri : {getSortLabel()}</span>
              <ChevronRight className="h-3 w-3" />
            </div>
            {filters.cities?.map((city: string, index: number) => (
              <div
                key={index}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-sm"
              >
                <MapPin className="h-3 w-3" />
                <span>{city}</span>
                <button
                  onClick={() => onRemoveFilter("city", city)}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {filters.minPrice && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-sm">
                <span>Prix: {filters.minPrice}€</span>
                <button
                  onClick={() => onRemoveFilter("minPrice")}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.maxPrice && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-sm">
                <span>Prix max: {filters.maxPrice}€</span>
                <button
                  onClick={() => onRemoveFilter("maxPrice")}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.propertyTypes.length > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-sm">
                <span>{getPropertyTypeLabel()}</span>
                <button
                  onClick={() => onRemoveFilter("propertyTypes")}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

