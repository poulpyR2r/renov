"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FilterBar } from "@/components/search/filter-bar";
import { FiltersDrawer } from "@/components/search/filters-drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Search,
  MapPin,
  Home,
  Building2,
  Map,
  SlidersHorizontal,
  X,
  Sparkles,
  Grid3X3,
  LayoutList,
  CircleDollarSign,
  Compass,
  SearchX,
  LocateFixed,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
  Wrench,
  Leaf,
  Building,
} from "lucide-react";

// Import dynamique de la carte pour éviter les erreurs SSR
const ListingsMap = dynamic(
  () => import("@/components/listings-map").then((mod) => mod.ListingsMap),
  { ssr: false }
);

// Formater un nombre avec des espaces (ex: 10000 -> 10 000)
const formatPrice = (value: string): string => {
  const numbers = value.replace(/\s/g, "").replace(/[^0-9]/g, "");
  if (!numbers) return "";
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

// Extraire le nombre brut sans espaces
const unformatPrice = (value: string): string => {
  return value.replace(/\s/g, "");
};

// Convertir string en number de manière sûre
const parseNumber = (value: string): number | null => {
  const cleaned = unformatPrice(value);
  if (!cleaned) return null;
  const num = Number.parseInt(cleaned, 10);
  return Number.isNaN(num) ? null : num;
};

// Valeurs du slider pour le rayon
const radiusValues = [0, 5, 10, 20, 30, 50, 75, 100];

// Type pour les filtres
interface FilterState {
  q: string;
  city: string;
  postalCode: string;
  propertyTypes: string[];
  minPrice: string;
  maxPrice: string;
  minSurface: string;
  maxSurface: string;
  minRooms: string;
  minRenovationLevel: string;
  maxRenovationLevel: string;
  requiredWorks: string[];
  dpeClasses: string[];
  gesClasses: string[];
  minEnergyCost: string;
  maxEnergyCost: string;
  coproprietySubject: boolean | undefined;
  maxCoproprietyCharges: string;
  coproprietyProcedure: boolean | undefined;
  sortBy: string;
  sortOrder: string;
}

// Filtres par défaut
const DEFAULT_FILTERS: FilterState = {
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

// Construire les params URL depuis les filtres
const buildSearchParams = (
  filters: FilterState,
  radiusIndex: number,
  center: { lat?: number; lng?: number }
): URLSearchParams => {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.city?.trim()) params.set("city", filters.city.trim());
  if (filters.postalCode?.trim())
    params.set("postalCode", filters.postalCode.trim());
  if (filters.propertyTypes.length > 0) {
    params.set("propertyTypes", filters.propertyTypes.join(","));
  }
  if (filters.minPrice?.trim())
    params.set("minPrice", unformatPrice(filters.minPrice));
  if (filters.maxPrice?.trim())
    params.set("maxPrice", unformatPrice(filters.maxPrice));
  if (filters.minSurface?.trim())
    params.set("minSurface", unformatPrice(filters.minSurface));
  if (filters.maxSurface?.trim())
    params.set("maxSurface", unformatPrice(filters.maxSurface));
  if (filters.minRooms?.trim()) params.set("minRooms", filters.minRooms.trim());
  if (filters.minRenovationLevel?.trim())
    params.set("minRenovationLevel", filters.minRenovationLevel);
  if (filters.maxRenovationLevel?.trim())
    params.set("maxRenovationLevel", filters.maxRenovationLevel);
  if (filters.requiredWorks.length > 0) {
    params.set("requiredWorks", filters.requiredWorks.join(","));
  }
  if (filters.dpeClasses.length > 0) {
    params.set("dpeClasses", filters.dpeClasses.join(","));
  }
  if (filters.gesClasses.length > 0) {
    params.set("gesClasses", filters.gesClasses.join(","));
  }
  if (filters.minEnergyCost?.trim())
    params.set("minEnergyCost", unformatPrice(filters.minEnergyCost));
  if (filters.maxEnergyCost?.trim())
    params.set("maxEnergyCost", unformatPrice(filters.maxEnergyCost));
  if (filters.coproprietySubject !== undefined) {
    params.set("coproprietySubject", String(filters.coproprietySubject));
  }
  if (filters.maxCoproprietyCharges?.trim()) {
    params.set(
      "maxCoproprietyCharges",
      unformatPrice(filters.maxCoproprietyCharges)
    );
  }
  if (filters.coproprietyProcedure !== undefined) {
    params.set("coproprietyProcedure", String(filters.coproprietyProcedure));
  }
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

  const radiusKm = radiusValues[radiusIndex];
  if (center.lat != null && center.lng != null && radiusKm > 0) {
    params.set("lat", String(center.lat));
    params.set("lng", String(center.lng));
    params.set("radiusKm", String(radiusKm));
  }

  // Ajouter limit pour plus de résultats (50 au lieu de 20 par défaut)
  params.set("limit", "50");

  return params;
};

// Parser les filtres depuis les query params
const parseFiltersFromURL = (searchParams: URLSearchParams): FilterState => {
  return {
    q: searchParams.get("q") || "",
    city: searchParams.get("city") || "",
    postalCode: searchParams.get("postalCode") || "",
    propertyTypes:
      searchParams.get("propertyTypes")?.split(",").filter(Boolean) || [],
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    minSurface: searchParams.get("minSurface") || "",
    maxSurface: searchParams.get("maxSurface") || "",
    minRooms: searchParams.get("minRooms") || "",
    minRenovationLevel: searchParams.get("minRenovationLevel") || "",
    maxRenovationLevel: searchParams.get("maxRenovationLevel") || "",
    requiredWorks:
      searchParams.get("requiredWorks")?.split(",").filter(Boolean) || [],
    dpeClasses:
      searchParams.get("dpeClasses")?.split(",").filter(Boolean) || [],
    gesClasses:
      searchParams.get("gesClasses")?.split(",").filter(Boolean) || [],
    minEnergyCost: searchParams.get("minEnergyCost") || "",
    maxEnergyCost: searchParams.get("maxEnergyCost") || "",
    coproprietySubject:
      searchParams.get("coproprietySubject") === "true"
        ? true
        : searchParams.get("coproprietySubject") === "false"
        ? false
        : undefined,
    maxCoproprietyCharges: searchParams.get("maxCoproprietyCharges") || "",
    coproprietyProcedure:
      searchParams.get("coproprietyProcedure") === "true" ? true : undefined,
    sortBy: searchParams.get("sortBy") || "date",
    sortOrder: searchParams.get("sortOrder") || "desc",
  };
};

// Valider les filtres numériques (min <= max)
const validateFilters = (
  filters: FilterState
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const minPrice = parseNumber(filters.minPrice);
  const maxPrice = parseNumber(filters.maxPrice);
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    errors.push("Le prix minimum doit être inférieur ou égal au prix maximum");
  }
  const minSurface = parseNumber(filters.minSurface);
  const maxSurface = parseNumber(filters.maxSurface);
  if (minSurface !== null && maxSurface !== null && minSurface > maxSurface) {
    errors.push(
      "La surface minimum doit être inférieure ou égale à la surface maximum"
    );
  }
  const minEnergyCost = parseNumber(filters.minEnergyCost);
  const maxEnergyCost = parseNumber(filters.maxEnergyCost);
  if (
    minEnergyCost !== null &&
    maxEnergyCost !== null &&
    minEnergyCost > maxEnergyCost
  ) {
    errors.push(
      "Le coût énergétique minimum doit être inférieur ou égal au coût énergétique maximum"
    );
  }
  return { valid: errors.length === 0, errors };
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHits, setTotalHits] = useState<number | null>(null);

  // appliedFilters = source de vérité (reflète l'URL)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(() =>
    parseFiltersFromURL(searchParams)
  );

  const [showMap, setShowMap] = useState(false);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [scrollToSection, setScrollToSection] = useState<string | null>(null);
  const [radiusIndex, setRadiusIndex] = useState(0);
  const [center, setCenter] = useState<{ lat?: number; lng?: number }>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // AbortController pour annuler les requêtes en cours
  const abortControllerRef = useRef<AbortController | null>(null);
  const countDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch listings avec les filtres appliqués
  const fetchListings = useCallback(
    async (filtersToUse: FilterState, signal?: AbortSignal) => {
      try {
        const params = buildSearchParams(filtersToUse, radiusIndex, center);
        const response = await fetch(`/api/search?${params.toString()}`, {
          signal,
        });
        if (signal?.aborted) return;
        const data = await response.json();
        setListings(data.listings || []);
        setTotalHits(data.pagination?.total ?? null);
        setLoading(false);
      } catch (error: any) {
        if (error.name === "AbortError") return;
        console.error("Error fetching listings:", error);
        setLoading(false);
      }
    },
    [radiusIndex, center]
  );

  // Fetch count seulement (pour le bouton Rechercher avec N)
  const fetchCount = useCallback(
    async (filtersToUse: FilterState, signal?: AbortSignal) => {
      try {
        const params = buildSearchParams(filtersToUse, radiusIndex, center);
        params.set("limit", "1"); // Demander seulement 1 item pour optimiser
        params.set("page", "1");
        const response = await fetch(`/api/search?${params.toString()}`, {
          signal,
        });
        if (signal?.aborted) return null;
        const data = await response.json();
        return data.pagination?.total ?? null;
      } catch (error: any) {
        if (error.name === "AbortError") return null;
        console.error("Error fetching count:", error);
        return null;
      }
    },
    [radiusIndex, center]
  );

  // Initial load depuis URL
  useEffect(() => {
    const initialFilters = parseFiltersFromURL(searchParams);
    setAppliedFilters(initialFilters);
    const controller = new AbortController();
    fetchListings(initialFilters, controller.signal);
    return () => controller.abort();
  }, []); // Seulement au mount

  // Mettre à jour les filtres appliqués quand l'URL change (back/forward)
  useEffect(() => {
    const urlFilters = parseFiltersFromURL(searchParams);
    const urlString = buildSearchParams(
      urlFilters,
      radiusIndex,
      center
    ).toString();
    const currentString = buildSearchParams(
      appliedFilters,
      radiusIndex,
      center
    ).toString();
    if (urlString !== currentString) {
      setAppliedFilters(urlFilters);
      const controller = new AbortController();
      fetchListings(urlFilters, controller.signal);
      return () => controller.abort();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, radiusIndex, center]);

  const handleSearch = useCallback(() => {
    const validation = validateFilters(appliedFilters);
    if (!validation.valid) {
      // Afficher les erreurs si nécessaire
      return;
    }
    const params = buildSearchParams(appliedFilters, radiusIndex, center);
    router.push(`/search?${params.toString()}`);
    // Déclencher immédiatement le fetch après la mise à jour de l'URL
    setLoading(true);
    const controller = new AbortController();
    fetchListings(appliedFilters, controller.signal);
  }, [appliedFilters, radiusIndex, center, router, fetchListings]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePriceChange = (
    field:
      | "minPrice"
      | "maxPrice"
      | "minSurface"
      | "maxSurface"
      | "minEnergyCost"
      | "maxEnergyCost"
      | "maxCoproprietyCharges",
    value: string
  ) => {
    const formatted = formatPrice(value);
    setAppliedFilters({ ...appliedFilters, [field]: formatted });
  };

  const togglePropertyType = (type: string) => {
    setAppliedFilters({
      ...appliedFilters,
      propertyTypes: appliedFilters.propertyTypes.includes(type)
        ? appliedFilters.propertyTypes.filter((t) => t !== type)
        : [...appliedFilters.propertyTypes, type],
    });
  };

  const toggleRequiredWork = (work: string) => {
    setAppliedFilters({
      ...appliedFilters,
      requiredWorks: appliedFilters.requiredWorks.includes(work)
        ? appliedFilters.requiredWorks.filter((w) => w !== work)
        : [...appliedFilters.requiredWorks, work],
    });
  };

  const toggleDpeClass = (dpeClass: string) => {
    setAppliedFilters({
      ...appliedFilters,
      dpeClasses: appliedFilters.dpeClasses.includes(dpeClass)
        ? appliedFilters.dpeClasses.filter((c) => c !== dpeClass)
        : [...appliedFilters.dpeClasses, dpeClass],
    });
  };

  const toggleGesClass = (gesClass: string) => {
    setAppliedFilters({
      ...appliedFilters,
      gesClasses: appliedFilters.gesClasses.includes(gesClass)
        ? appliedFilters.gesClasses.filter((c) => c !== gesClass)
        : [...appliedFilters.gesClasses, gesClass],
    });
  };

  const handleListingClick = (listing: any) => {
    router.push(`/listing/${listing._id}`);
  };

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }

    setLocationStatus("loading");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCenter({ lat: latitude, lng: longitude });

        // Reverse geocoding pour obtenir le nom de la ville
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          const data = await response.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.municipality ||
            "Position actuelle";
          setAppliedFilters((prev) => ({ ...prev, city: city }));
        } catch {
          // Ignore error
        }

        setLocationStatus("success");
      },
      () => {
        setLocationStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const resetFilters = useCallback(() => {
    // Annuler les requêtes en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (countDebounceRef.current) {
      clearTimeout(countDebounceRef.current);
    }

    // Réinitialiser les filtres
    setAppliedFilters(DEFAULT_FILTERS);
    setRadiusIndex(0);
    setCenter({});
    setLocationStatus("idle");

    // Nettoyer l'URL
    router.push("/search");

    // Relancer la recherche avec les filtres par défaut
    const controller = new AbortController();
    fetchListings(DEFAULT_FILTERS, controller.signal);
  }, [router, fetchListings]);

  const hasActiveFilters =
    appliedFilters.q ||
    appliedFilters.city ||
    appliedFilters.postalCode ||
    appliedFilters.propertyTypes.length > 0 ||
    appliedFilters.minPrice ||
    appliedFilters.maxPrice ||
    appliedFilters.minSurface ||
    appliedFilters.maxSurface ||
    appliedFilters.minRooms ||
    appliedFilters.minRenovationLevel ||
    appliedFilters.maxRenovationLevel ||
    appliedFilters.requiredWorks.length > 0 ||
    appliedFilters.dpeClasses.length > 0 ||
    appliedFilters.gesClasses.length > 0 ||
    appliedFilters.minEnergyCost ||
    appliedFilters.maxEnergyCost ||
    appliedFilters.coproprietySubject !== undefined ||
    appliedFilters.maxCoproprietyCharges ||
    appliedFilters.coproprietyProcedure !== undefined ||
    radiusIndex > 0;

  const getActiveFiltersCount = () => {
    let count = 0;
    if (appliedFilters.city) count++;
    if (appliedFilters.postalCode) count++;
    if (appliedFilters.propertyTypes.length > 0) count++;
    if (appliedFilters.minPrice || appliedFilters.maxPrice) count++;
    if (appliedFilters.minSurface || appliedFilters.maxSurface) count++;
    if (appliedFilters.minRooms) count++;
    if (appliedFilters.minRenovationLevel || appliedFilters.maxRenovationLevel)
      count++;
    if (appliedFilters.requiredWorks.length > 0) count++;
    if (appliedFilters.dpeClasses.length > 0) count++;
    if (appliedFilters.gesClasses.length > 0) count++;
    if (appliedFilters.minEnergyCost || appliedFilters.maxEnergyCost) count++;
    if (appliedFilters.coproprietySubject !== undefined) count++;
    if (appliedFilters.maxCoproprietyCharges) count++;
    if (appliedFilters.coproprietyProcedure !== undefined) count++;
    return count;
  };

  const handleRemoveFilter = (filterKey: string) => {
    const newFilters = { ...appliedFilters };
    if (filterKey === "city") {
      newFilters.city = "";
    } else if (filterKey === "minPrice") {
      newFilters.minPrice = "";
    } else if (filterKey === "maxPrice") {
      newFilters.maxPrice = "";
    } else if (filterKey === "propertyTypes") {
      newFilters.propertyTypes = [];
    }
    setAppliedFilters(newFilters);
    const params = buildSearchParams(newFilters, radiusIndex, center);
    router.push(`/search?${params.toString()}`);
    // Déclencher immédiatement le fetch après la mise à jour de l'URL
    setLoading(true);
    const controller = new AbortController();
    fetchListings(newFilters, controller.signal);
  };

  const handleApplyFilters = useCallback(
    (newFilters: FilterState) => {
      const validation = validateFilters(newFilters);
      if (!validation.valid) {
        // Afficher les erreurs si nécessaire
        return;
      }
      setAppliedFilters(newFilters);
      const params = buildSearchParams(newFilters, radiusIndex, center);
      router.push(`/search?${params.toString()}`);
      // Déclencher immédiatement le fetch après la mise à jour de l'URL
      setLoading(true);
      const controller = new AbortController();
      fetchListings(newFilters, controller.signal);
    },
    [radiusIndex, center, router, fetchListings]
  );

  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    const newFilters = {
      ...appliedFilters,
      sortBy: newSortBy,
      sortOrder: newSortOrder,
    };
    setAppliedFilters(newFilters);
    const params = buildSearchParams(newFilters, radiusIndex, center);
    router.push(`/search?${params.toString()}`);
    // Déclencher immédiatement le fetch après la mise à jour de l'URL
    setLoading(true);
    const controller = new AbortController();
    fetchListings(newFilters, controller.signal);
  };

  // Gérer l'ouverture du drawer avec scroll vers section
  const handleOpenFilters = useCallback((sectionId?: string) => {
    setShowFiltersDrawer(true);
    if (sectionId) {
      setScrollToSection(sectionId);
    }
  }, []);

  // Compter les annonces géolocalisables (avec coordonnées ou ville)
  const listingsWithLocation = listings.filter(
    (l) =>
      (l.location?.coordinates?.lat && l.location?.coordinates?.lng) ||
      l.location?.city
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50/50 to-teal-50/30 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800" />
          <div className="absolute inset-0 pattern-dots opacity-40" />

          {/* Decorative elements */}
          <div className="absolute top-10 right-[10%] w-16 h-16 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl rotate-12 animate-float" />
          <div className="absolute bottom-10 left-[5%] w-12 h-12 bg-gradient-to-br from-accent/20 to-transparent rounded-full animate-float-reverse" />

          <div className="container mx-auto max-w-6xl relative">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 animate-fade-in-down">
                <Search className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Recherche avancée</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in-up">
                Trouvez votre <span className="gradient-text">perle rare</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animation-delay-100">
                Utilisez nos filtres pour affiner votre recherche et découvrir
                les meilleures opportunités de rénovation
              </p>
            </div>
          </div>
        </section>

        {/* Filter Bar */}
        <FilterBar
          filters={appliedFilters}
          onShowMap={() => setShowMap(true)}
          onOpenLocation={() => handleOpenFilters("location-section")}
          onOpenPropertyType={() => handleOpenFilters("property-type-section")}
          onOpenPrice={() => handleOpenFilters("price-section")}
          onOpenFilters={() => handleOpenFilters()}
          onRemoveFilter={handleRemoveFilter}
          activeFiltersCount={getActiveFiltersCount()}
          sortBy={appliedFilters.sortBy}
          sortOrder={appliedFilters.sortOrder}
          onSortChange={handleSortChange}
        />

        {/* Filters & Results Section */}
        <section className="py-8 px-4 relative z-10">
          <div className="container mx-auto max-w-6xl">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Recherche en cours...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-lg">
                      {totalHits !== null ? totalHits : listings.length}
                    </span>
                    <span className="text-muted-foreground">
                      {(totalHits !== null ? totalHits : listings.length) === 1
                        ? "bien trouvé"
                        : "biens trouvés"}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-lg"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-lg"
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Results Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Home className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <p className="mt-4 text-muted-foreground">
                  Recherche des meilleures opportunités...
                </p>
              </div>
            ) : listings.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "flex flex-col gap-4"
                }
              >
                {listings.map((listing, index) => (
                  <div
                    key={listing._id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ListingCard listing={listing} />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="py-20 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                    <SearchX className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Aucun résultat trouvé
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Essayez d'élargir vos critères de recherche ou de modifier
                    la localisation pour découvrir plus d'opportunités.
                  </p>
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="rounded-xl"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Réinitialiser les filtres
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {/* Filters Drawer */}
      <FiltersDrawer
        open={showFiltersDrawer}
        onOpenChange={setShowFiltersDrawer}
        filters={appliedFilters}
        onApplyFilters={handleApplyFilters}
        onClearFilters={resetFilters}
        resultsCount={totalHits ?? undefined}
        formatPrice={formatPrice}
        unformatPrice={unformatPrice}
        scrollToSection={scrollToSection}
        onScrollToSection={() => setScrollToSection(null)}
        fetchCount={fetchCount}
      />

      {/* Carte en fullscreen */}
      {showMap && (
        <ListingsMap
          listings={listings}
          onClose={() => setShowMap(false)}
          onListingClick={handleListingClick}
          center={
            center.lat && center.lng
              ? { lat: center.lat, lng: center.lng }
              : undefined
          }
          initialFilters={{
            q: appliedFilters.q,
            propertyType: appliedFilters.propertyTypes[0] || "all",
            minPrice: appliedFilters.minPrice,
            maxPrice: appliedFilters.maxPrice,
          }}
        />
      )}
    </div>
  );
}
