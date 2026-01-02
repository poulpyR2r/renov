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

  // Sur mobile : on montre seulement Carte, Localisation et Filtres
  // Sur desktop : on montre tous les boutons
  const allButtons = [
    { key: "map", component: (
      <Button
        key="map"
        variant="outline"
        size="default"
        onClick={onShowMap}
        className="rounded-full h-9 sm:h-10 px-4 sm:px-4 md:px-6 whitespace-nowrap sm:flex-1 sm:min-w-0 sm:max-w-[200px] text-sm"
      >
        <Map className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
        Carte
      </Button>
    )},
    { key: "location", component: (
      <Button
        key="location"
        variant="outline"
        size="default"
        onClick={onOpenLocation}
        className="rounded-full h-9 sm:h-10 px-4 sm:px-4 md:px-6 whitespace-nowrap sm:flex-1 sm:min-w-0 sm:max-w-[250px] text-sm"
      >
        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 shrink-0" />
        <span className="truncate max-w-[140px] sm:max-w-none">
          {filters.cities?.length > 0
            ? filters.cities.length === 1
              ? filters.cities[0]
              : `${filters.cities.length} villes`
            : "Choisir une localisation"}
        </span>
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1.5 sm:ml-2 shrink-0" />
      </Button>
    )},
    { key: "propertyType", component: (
      <Button
        key="propertyType"
        variant="outline"
        size="default"
        onClick={onOpenPropertyType}
        className="rounded-full h-9 sm:h-10 px-4 sm:px-4 md:px-6 whitespace-nowrap sm:flex-1 sm:min-w-0 sm:max-w-[200px] text-sm"
      >
        <Home className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 shrink-0" />
        <span className="truncate capitalize">{getPropertyTypeLabel()}</span>
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1.5 sm:ml-2 shrink-0" />
      </Button>
    )},
    { key: "price", component: (
      <Button
        key="price"
        variant="outline"
        size="default"
        onClick={onOpenPrice}
        className="rounded-full h-9 sm:h-10 px-4 sm:px-4 md:px-6 whitespace-nowrap sm:flex-1 sm:min-w-0 sm:max-w-[200px] text-sm"
      >
        <CircleDollarSign className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 shrink-0" />
        <span className="truncate">{getPriceLabel()}</span>
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1.5 sm:ml-2 shrink-0" />
      </Button>
    )},
    { key: "filters", component: (
      <Button
        key="filters"
        variant="outline"
        size="default"
        onClick={onOpenFilters}
        className="rounded-full h-9 sm:h-10 px-4 sm:px-4 md:px-6 whitespace-nowrap sm:flex-1 sm:min-w-0 sm:max-w-[200px] relative text-sm"
      >
        <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 shrink-0" />
        Filtres
        {activeFiltersCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 flex items-center justify-center text-[10px] sm:text-xs"
          >
            {activeFiltersCount}
          </Badge>
        )}
      </Button>
    )},
  ];

  // Sur mobile : seulement Carte, Localisation et Filtres (index 0, 1, 4)
  // Sur desktop : tous les boutons
  const mobileVisibleKeys = ["map", "location", "filters"];

  return (
    <div className="sticky top-0 z-40 bg-background border-b">
      {/* Pills bar */}
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 max-w-6xl">
        {/* Mobile : scroll horizontal */}
        <div className="flex items-center gap-2 sm:gap-2 md:gap-3 overflow-x-auto scrollbar-hide sm:flex-wrap sm:justify-center pb-2 sm:pb-0">
          {/* Boutons : Carte, Localisation, Filtres sur mobile / Tous sur desktop */}
          {allButtons.map(({ key, component }) => {
            const isVisibleOnMobile = mobileVisibleKeys.includes(key);
            return (
              <div 
                key={key} 
                className={
                  isVisibleOnMobile
                    ? "flex-shrink-0 sm:flex sm:flex-1 sm:min-w-0" 
                    : "hidden sm:flex sm:flex-1 sm:min-w-0"
                }
              >
                {component}
              </div>
            );
          })}
        </div>

        {/* Context chips */}
        {hasActiveChips && (
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 flex-wrap">
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

