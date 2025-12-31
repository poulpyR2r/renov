"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Home, Building2, Building, MapPin, Grid3X3 } from "lucide-react";

interface FiltersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: any;
  onApplyFilters: (filters: any) => void;
  onClearFilters: () => void;
  resultsCount?: number;
  formatPrice: (value: string) => string;
  unformatPrice: (value: string) => string;
  scrollToSection?: string | null;
  onScrollToSection?: () => void;
  fetchCount?: (filters: any, signal?: AbortSignal) => Promise<number | null>;
}

export function FiltersDrawer({
  open,
  onOpenChange,
  filters,
  onApplyFilters,
  onClearFilters,
  resultsCount,
  formatPrice,
  unformatPrice,
  scrollToSection,
  onScrollToSection,
  fetchCount,
}: FiltersDrawerProps) {
  const [draftFilters, setDraftFilters] = useState(filters);
  const [draftCount, setDraftCount] = useState<number | null>(resultsCount ?? null);
  const [isValidating, setIsValidating] = useState(false);
  const drawerContentRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Copier les filtres appliqués dans draftFilters quand le drawer s'ouvre
  useEffect(() => {
    if (open) {
      setDraftFilters(filters);
      setDraftCount(resultsCount ?? null);
    }
  }, [open, filters, resultsCount]);

  // Scroll vers la section demandée
  useEffect(() => {
    if (open && scrollToSection && drawerContentRef.current) {
      // Attendre que le drawer soit monté
      requestAnimationFrame(() => {
        setTimeout(() => {
          const section = drawerContentRef.current?.querySelector(`#${scrollToSection}`);
          if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          onScrollToSection?.();
        }, 100);
      });
    }
  }, [open, scrollToSection, onScrollToSection]);

  // Comptage en temps réel avec debounce
  useEffect(() => {
    if (!open || !fetchCount) return;

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Débouncer la requête
    setIsValidating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    debounceRef.current = setTimeout(async () => {
      try {
        const count = await fetchCount(draftFilters, controller.signal);
        if (!controller.signal.aborted) {
          setDraftCount(count);
          setIsValidating(false);
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          setIsValidating(false);
        }
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (controller) {
        controller.abort();
      }
    };
  }, [draftFilters, open, fetchCount]);

  // Valider les filtres (min <= max)
  const validateFilters = useCallback((filtersToValidate: any): boolean => {
    const unformatPrice = (value: string): string => value.replace(/\s/g, "");
    const parseNumber = (value: string): number | null => {
      const cleaned = unformatPrice(value);
      if (!cleaned) return null;
      const num = Number.parseInt(cleaned, 10);
      return Number.isNaN(num) ? null : num;
    };

    const minPrice = parseNumber(filtersToValidate.minPrice || "");
    const maxPrice = parseNumber(filtersToValidate.maxPrice || "");
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      return false;
    }

    const minSurface = parseNumber(filtersToValidate.minSurface || "");
    const maxSurface = parseNumber(filtersToValidate.maxSurface || "");
    if (minSurface !== null && maxSurface !== null && minSurface > maxSurface) {
      return false;
    }

    const minEnergyCost = parseNumber(filtersToValidate.minEnergyCost || "");
    const maxEnergyCost = parseNumber(filtersToValidate.maxEnergyCost || "");
    if (minEnergyCost !== null && maxEnergyCost !== null && minEnergyCost > maxEnergyCost) {
      return false;
    }

    return true;
  }, []);

  const handleApply = () => {
    if (!validateFilters(draftFilters)) {
      // Les filtres sont invalides, ne pas appliquer
      return;
    }
    onApplyFilters(draftFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    // Annuler les requêtes en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const clearedFilters = {
      q: "",
      city: "",
      postalCode: "",
      propertyTypes: [],
      minPrice: "",
      maxPrice: "",
      minSurface: "",
      maxSurface: "",
      minRooms: "",
      minRenovationLevel: "",
      maxRenovationLevel: "",
      requiredWorks: [],
      dpeClasses: [],
      gesClasses: [],
      minEnergyCost: "",
      maxEnergyCost: "",
      coproprietySubject: undefined,
      maxCoproprietyCharges: "",
      coproprietyProcedure: undefined,
      sortBy: "date",
      sortOrder: "desc",
    };
    setDraftFilters(clearedFilters);
    setDraftCount(null);
    onClearFilters();
    onOpenChange(false);
  };

  const togglePropertyType = (type: string) => {
    setDraftFilters({
      ...draftFilters,
      propertyTypes: draftFilters.propertyTypes.includes(type)
        ? draftFilters.propertyTypes.filter((t: string) => t !== type)
        : [...draftFilters.propertyTypes, type],
    });
  };

  const toggleRequiredWork = (work: string) => {
    setDraftFilters({
      ...draftFilters,
      requiredWorks: draftFilters.requiredWorks.includes(work)
        ? draftFilters.requiredWorks.filter((w: string) => w !== work)
        : [...draftFilters.requiredWorks, work],
    });
  };

  const toggleDpeClass = (dpeClass: string) => {
    setDraftFilters({
      ...draftFilters,
      dpeClasses: draftFilters.dpeClasses.includes(dpeClass)
        ? draftFilters.dpeClasses.filter((c: string) => c !== dpeClass)
        : [...draftFilters.dpeClasses, dpeClass],
    });
  };

  const toggleGesClass = (gesClass: string) => {
    setDraftFilters({
      ...draftFilters,
      gesClasses: draftFilters.gesClasses.includes(gesClass)
        ? draftFilters.gesClasses.filter((c: string) => c !== gesClass)
        : [...draftFilters.gesClasses, gesClass],
    });
  };

  const handlePriceChange = (field: string, value: string) => {
    const formatted = formatPrice(value);
    setDraftFilters({ ...draftFilters, [field]: formatted });
  };

  const handleSurfaceChange = (field: string, value: string) => {
    const formatted = formatPrice(value);
    setDraftFilters({ ...draftFilters, [field]: formatted });
  };

  const isValid = validateFilters(draftFilters);
  const displayCount = draftCount !== null ? draftCount : (resultsCount ?? null);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right" className="flex flex-col">
        <DrawerHeader className="flex flex-row items-center justify-between">
          <DrawerTitle>Tous les filtres</DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </DrawerHeader>

        <div
          ref={drawerContentRef}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-6"
        >
          {/* Localisation */}
          <div id="location-section">
            <Label className="text-sm font-semibold mb-3 block">
              Localisation
            </Label>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Ville</Label>
                <Input
                  placeholder="Ex: Paris"
                  value={draftFilters.city}
                  onChange={(e) =>
                    setDraftFilters({ ...draftFilters, city: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Code postal
                </Label>
                <Input
                  placeholder="Ex: 75001"
                  value={draftFilters.postalCode}
                  onChange={(e) =>
                    setDraftFilters({
                      ...draftFilters,
                      postalCode: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Catégories */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Catégories</Label>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <span className="text-sm">Ventes immobilières</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Type de bien */}
          <div id="property-type-section">
            <Label className="text-sm font-semibold mb-3 block">
              Type de bien
            </Label>
            <div className="space-y-2">
              {[
                { value: "apartment", label: "Appartement", icon: Building2 },
                { value: "house", label: "Maison", icon: Home },
                { value: "land", label: "Terrain", icon: MapPin },
                { value: "building", label: "Immeuble", icon: Building },
                { value: "other", label: "Autre", icon: Grid3X3 },
              ].map((type) => (
                <label
                  key={type.value}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={draftFilters.propertyTypes.includes(type.value)}
                      onCheckedChange={() => togglePropertyType(type.value)}
                    />
                    <type.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{type.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Prix */}
          <div id="price-section">
            <Label className="text-sm font-semibold mb-3 block">Prix</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Minimum</Label>
                <div className="relative">
                  <Input
                    placeholder="0"
                    value={draftFilters.minPrice}
                    onChange={(e) =>
                      handlePriceChange("minPrice", e.target.value)
                    }
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    €
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Maximum</Label>
                <div className="relative">
                  <Input
                    placeholder="0"
                    value={draftFilters.maxPrice}
                    onChange={(e) =>
                      handlePriceChange("maxPrice", e.target.value)
                    }
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    €
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Surface habitable */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">
              Surface habitable
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Minimum</Label>
                <div className="relative">
                  <Input
                    placeholder="0"
                    value={draftFilters.minSurface}
                    onChange={(e) =>
                      handleSurfaceChange("minSurface", e.target.value)
                    }
                    className="pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    m²
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Maximum</Label>
                <div className="relative">
                  <Input
                    placeholder="0"
                    value={draftFilters.maxSurface}
                    onChange={(e) =>
                      handleSurfaceChange("maxSurface", e.target.value)
                    }
                    className="pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    m²
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Nombre de pièces */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">
              Nombre de pièces minimum
            </Label>
            <Input
              type="number"
              placeholder="0"
              value={draftFilters.minRooms}
              onChange={(e) =>
                setDraftFilters({ ...draftFilters, minRooms: e.target.value })
              }
            />
          </div>

          {/* Rénovation & Travaux */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">
              Rénovation & Travaux
            </Label>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Niveau min
                  </Label>
                  <Select
                    value={draftFilters.minRenovationLevel || "all"}
                    onValueChange={(v) =>
                      setDraftFilters({
                        ...draftFilters,
                        minRenovationLevel: v === "all" ? "" : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={String(level)}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Niveau max
                  </Label>
                  <Select
                    value={draftFilters.maxRenovationLevel || "all"}
                    onValueChange={(v) =>
                      setDraftFilters({
                        ...draftFilters,
                        maxRenovationLevel: v === "all" ? "" : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={String(level)}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Travaux à prévoir
                </Label>
                <div className="space-y-2">
                  {[
                    "électricité",
                    "plomberie",
                    "isolation",
                    "cuisine",
                    "salle de bain",
                    "sols / murs",
                    "toiture / structure",
                  ].map((work) => (
                    <label
                      key={work}
                      className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={draftFilters.requiredWorks.includes(work)}
                        onCheckedChange={() => toggleRequiredWork(work)}
                      />
                      <span className="text-sm">{work}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Performance énergétique */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">
              Performance énergétique
            </Label>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Classe énergie DPE
                </Label>
                <div className="grid grid-cols-7 gap-2">
                  {["A", "B", "C", "D", "E", "F", "G"].map((dpeClass) => (
                    <label
                      key={dpeClass}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all cursor-pointer ${
                        draftFilters.dpeClasses.includes(dpeClass)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Checkbox
                        checked={draftFilters.dpeClasses.includes(dpeClass)}
                        onCheckedChange={() => toggleDpeClass(dpeClass)}
                        className="sr-only"
                      />
                      <span
                        className={`text-sm font-bold ${
                          draftFilters.dpeClasses.includes(dpeClass)
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {dpeClass}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Classe GES
                </Label>
                <div className="grid grid-cols-7 gap-2">
                  {["A", "B", "C", "D", "E", "F", "G"].map((gesClass) => (
                    <label
                      key={gesClass}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all cursor-pointer ${
                        draftFilters.gesClasses.includes(gesClass)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Checkbox
                        checked={draftFilters.gesClasses.includes(gesClass)}
                        onCheckedChange={() => toggleGesClass(gesClass)}
                        className="sr-only"
                      />
                      <span
                        className={`text-sm font-bold ${
                          draftFilters.gesClasses.includes(gesClass)
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {gesClass}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Copropriété */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">
              Copropriété
            </Label>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Bien en copropriété
                </Label>
                <Select
                  value={
                    draftFilters.coproprietySubject === undefined
                      ? "all"
                      : String(draftFilters.coproprietySubject)
                  }
                  onValueChange={(v) =>
                    setDraftFilters({
                      ...draftFilters,
                      coproprietySubject: v === "all" ? undefined : v === "true",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="true">Oui</SelectItem>
                    <SelectItem value="false">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Charges annuelles max (€)
                </Label>
                <Input
                  placeholder="0"
                  value={draftFilters.maxCoproprietyCharges}
                  onChange={(e) =>
                    handlePriceChange("maxCoproprietyCharges", e.target.value)
                  }
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Procédure en cours
                </Label>
                <Select
                  value={
                    draftFilters.coproprietyProcedure === undefined
                      ? "all"
                      : String(draftFilters.coproprietyProcedure)
                  }
                  onValueChange={(v) =>
                    setDraftFilters({
                      ...draftFilters,
                      coproprietyProcedure:
                        v === "all" ? undefined : v === "true",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="true">Oui</SelectItem>
                    <SelectItem value="false">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleClear}
            className="flex-1"
          >
            Tout Effacer
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1"
            disabled={!isValid || isValidating}
          >
            {isValidating
              ? "Recherche..."
              : displayCount !== null
              ? `Rechercher (${displayCount})`
              : "Rechercher"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
