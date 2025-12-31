"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ZoomIn,
  ZoomOut,
  Locate,
  X,
  Home,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Eye,
  List,
  Map,
} from "lucide-react";
import Link from "next/link";

interface Listing {
  _id: string;
  title: string;
  price?: number;
  location?: {
    city?: string;
    department?: string;
    region?: string;
    coordinates?: {
      lat?: number;
      lng?: number;
    };
  };
  images?: string[];
  propertyType?: string;
  surface?: number;
}

interface GeocodedListing extends Listing {
  coords: { lat: number; lng: number };
  isApproximate: boolean;
}

interface MapFilters {
  q: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
}

interface ListingsMapProps {
  listings: Listing[];
  onBoundsChange?: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  onListingClick?: (listing: Listing) => void;
  onClose?: () => void;
  initialFilters?: MapFilters;
}

const geocodeCache: Record<string, { lat: number; lng: number } | null> = {};

async function geocodeCity(
  city: string,
  department?: string
): Promise<{ lat: number; lng: number } | null> {
  const searchQuery = department
    ? `${city}, ${department}, France`
    : `${city}, France`;
  const cacheKey = searchQuery.toLowerCase();

  if (cacheKey in geocodeCache) {
    return geocodeCache[cacheKey];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery
      )}&limit=1&countrycodes=fr`
    );
    const data = await response.json();

    if (data && data[0]) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
      geocodeCache[cacheKey] = result;
      return result;
    }

    geocodeCache[cacheKey] = null;
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    geocodeCache[cacheKey] = null;
    return null;
  }
}

function formatPriceDisplay(price?: number): string {
  if (!price) return "Prix NC";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatPriceInput(value: string): string {
  const numbers = value.replace(/\s/g, "").replace(/[^0-9]/g, "");
  if (!numbers) return "";
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function getCityName(listing: Listing): string {
  return listing.location?.city || "Ville inconnue";
}

function hasValidCoords(listing: Listing): boolean {
  const coords = listing.location?.coordinates;
  return !!(
    coords?.lat &&
    coords?.lng &&
    !isNaN(coords.lat) &&
    !isNaN(coords.lng)
  );
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
      return "Bien immobilier";
  }
}

export function ListingsMap({
  listings,
  onBoundsChange,
  center = { lat: 46.603354, lng: 1.888334 },
  zoom = 6,
  onListingClick,
  onClose,
  initialFilters,
}: ListingsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({
    done: 0,
    total: 0,
  });
  const [selectedListing, setSelectedListing] =
    useState<GeocodedListing | null>(null);
  const [L, setL] = useState<any>(null);
  const [geocodedListings, setGeocodedListings] = useState<GeocodedListing[]>(
    []
  );
  const [showFiltersPopup, setShowFiltersPopup] = useState(false);
  // Mobile : sidebar masquée par défaut, Desktop : visible
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [filters, setFilters] = useState<MapFilters>({
    q: initialFilters?.q || "",
    propertyType: initialFilters?.propertyType || "all",
    minPrice: initialFilters?.minPrice || "",
    maxPrice: initialFilters?.maxPrice || "",
  });

  // Détecter mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Sur desktop, ouvrir la sidebar par défaut
      if (!mobile) {
        setShowSidebar(true);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Filtrer les annonces
  const filteredListings = useMemo(() => {
    return geocodedListings.filter((listing) => {
      if (filters.q) {
        const query = filters.q.toLowerCase();
        const matchTitle = listing.title?.toLowerCase().includes(query);
        const matchCity = listing.location?.city?.toLowerCase().includes(query);
        const matchDept = listing.location?.department
          ?.toLowerCase()
          .includes(query);
        if (!matchTitle && !matchCity && !matchDept) return false;
      }

      if (filters.propertyType && filters.propertyType !== "all") {
        if (listing.propertyType !== filters.propertyType) return false;
      }

      if (filters.minPrice) {
        const min = parseInt(filters.minPrice.replace(/\s/g, ""));
        if (!isNaN(min) && (listing.price || 0) < min) return false;
      }

      if (filters.maxPrice) {
        const max = parseInt(filters.maxPrice.replace(/\s/g, ""));
        if (!isNaN(max) && (listing.price || 0) > max) return false;
      }

      return true;
    });
  }, [geocodedListings, filters]);

  // Géocoder les annonces
  const geocodeAllListings = useCallback(async () => {
    setIsGeocoding(true);
    const results: GeocodedListing[] = [];
    const toGeocode: Listing[] = [];

    for (const listing of listings) {
      if (hasValidCoords(listing)) {
        results.push({
          ...listing,
          coords: {
            lat: listing.location!.coordinates!.lat!,
            lng: listing.location!.coordinates!.lng!,
          },
          isApproximate: false,
        });
      } else if (listing.location?.city) {
        toGeocode.push(listing);
      }
    }

    setGeocodingProgress({ done: results.length, total: listings.length });

    for (let i = 0; i < toGeocode.length; i++) {
      const listing = toGeocode[i];
      const coords = await geocodeCity(
        listing.location!.city!,
        listing.location?.department
      );

      if (coords) {
        results.push({
          ...listing,
          coords,
          isApproximate: true,
        });
      }

      setGeocodingProgress({
        done: results.length,
        total: listings.length,
      });

      if (i < toGeocode.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    setGeocodedListings(results);
    setIsGeocoding(false);
  }, [listings]);

  // Styles
  useEffect(() => {
    const styleId = "listings-map-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .custom-map-marker {
        background: transparent !important;
        border: none !important;
      }
      .marker-pin {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #d97706 0%, #ea580c 100%);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .marker-pin:hover {
        transform: rotate(-45deg) scale(1.1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
      }
      .marker-pin svg {
        width: 16px;
        height: 16px;
        transform: rotate(45deg);
      }
      .marker-zone {
        width: 28px;
        height: 28px;
        background: rgba(14, 116, 144, 0.9);
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .marker-zone:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
      }
      .marker-zone svg {
        width: 12px;
        height: 12px;
      }
      .leaflet-container {
        font-family: inherit;
        background: #f5f5f5;
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Charger Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return;

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const leaflet = await import("leaflet");
      setL(leaflet.default);
      await new Promise((resolve) => setTimeout(resolve, 100));
      setIsLoading(false);
    };

    loadLeaflet();
    geocodeAllListings();
  }, [geocodeAllListings]);

  // Initialiser la carte
  useEffect(() => {
    if (!L || !mapRef.current || leafletMapRef.current || isGeocoding) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView([center.lat, center.lng], zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    leafletMapRef.current = map;

    if (onBoundsChange) {
      const handleBoundsChange = () => {
        const bounds = map.getBounds();
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      };
      map.on("moveend", handleBoundsChange);
      map.on("zoomend", handleBoundsChange);
      handleBoundsChange();
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [L, center.lat, center.lng, zoom, onBoundsChange, isGeocoding]);

  // Mettre à jour les marqueurs
  useEffect(() => {
    if (!L || !leafletMapRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    circlesRef.current.forEach((circle) => circle.remove());
    circlesRef.current = [];

    if (filteredListings.length === 0) return;

    const preciseIcon = L.divIcon({
      className: "custom-map-marker",
      html: `
        <div class="marker-pin">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });

    const zoneIcon = L.divIcon({
      className: "custom-map-marker",
      html: `
        <div class="marker-zone">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v8M8 12h8"/>
          </svg>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });

    filteredListings.forEach((listing) => {
      if (listing.isApproximate) {
        const circle = L.circle([listing.coords.lat, listing.coords.lng], {
          radius: 3000,
          color: "#0e7490",
          fillColor: "#0e7490",
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(leafletMapRef.current);

        circle.on("click", () => {
          setSelectedListing(listing);
          leafletMapRef.current.panTo([listing.coords.lat, listing.coords.lng]);
          if (isMobile) setShowSidebar(false);
        });

        circlesRef.current.push(circle);

        const marker = L.marker([listing.coords.lat, listing.coords.lng], {
          icon: zoneIcon,
        }).addTo(leafletMapRef.current);

        marker.on("click", () => {
          setSelectedListing(listing);
          leafletMapRef.current.panTo([listing.coords.lat, listing.coords.lng]);
          if (isMobile) setShowSidebar(false);
        });

        markersRef.current.push(marker);
      } else {
        const marker = L.marker([listing.coords.lat, listing.coords.lng], {
          icon: preciseIcon,
        }).addTo(leafletMapRef.current);

        marker.on("click", () => {
          setSelectedListing(listing);
          leafletMapRef.current.panTo([listing.coords.lat, listing.coords.lng]);
          if (isMobile) setShowSidebar(false);
        });

        markersRef.current.push(marker);
      }
    });

    if (filteredListings.length > 0) {
      const bounds = L.latLngBounds(
        filteredListings.map((l) => [l.coords.lat, l.coords.lng])
      );
      leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [L, filteredListings, isMobile]);

  const handleZoomIn = () => leafletMapRef.current?.zoomIn();
  const handleZoomOut = () => leafletMapRef.current?.zoomOut();
  const handleLocate = () => {
    if (!navigator.geolocation || !leafletMapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        leafletMapRef.current.flyTo(
          [pos.coords.latitude, pos.coords.longitude],
          12
        );
      },
      () => console.error("Geolocation error")
    );
  };

  const selectListing = (listing: GeocodedListing) => {
    setSelectedListing(listing);
    leafletMapRef.current?.panTo([listing.coords.lat, listing.coords.lng]);
    leafletMapRef.current?.setZoom(listing.isApproximate ? 12 : 14);
    if (isMobile) setShowSidebar(false);
  };

  const clearFilters = () => {
    setFilters({
      q: "",
      propertyType: "all",
      minPrice: "",
      maxPrice: "",
    });
  };

  const hasActiveFilters =
    filters.q ||
    filters.propertyType !== "all" ||
    filters.minPrice ||
    filters.maxPrice;

  const activeFiltersCount = [
    filters.q,
    filters.propertyType !== "all" ? filters.propertyType : "",
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header - Responsive */}
      <div className="absolute top-0 left-0 right-0 z-[1001] glass border-b h-12 md:h-14">
        <div className="h-full px-3 md:px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Carte</h2>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {isGeocoding
                  ? `${geocodingProgress.done}/${geocodingProgress.total}`
                  : `${filteredListings.length} bien${
                      filteredListings.length !== 1 ? "s" : ""
                    }`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton liste sur mobile */}
            <Button
              variant={showSidebar ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden h-8 rounded-lg"
            >
              <List className="w-4 h-4 mr-1" />
              {filteredListings.length}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full h-8 w-8 md:h-9 md:w-9"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Layout principal */}
      <div className="absolute inset-0 pt-12 md:pt-14">
        {/* Carte en fond (toujours visible) */}
        <div ref={mapRef} className="absolute inset-0" />

        {/* Sidebar - Responsive */}
        {showSidebar && (
          <>
            {/* Overlay mobile */}
            {isMobile && (
              <div
                className="absolute inset-0 bg-black/30 z-[1000]"
                onClick={() => setShowSidebar(false)}
              />
            )}

            {/* Panel */}
            <div
              className={`absolute z-[1001] bg-background shadow-2xl flex flex-col ${
                isMobile
                  ? "inset-x-0 bottom-0 top-auto h-[70vh] rounded-t-2xl"
                  : "top-0 left-0 bottom-0 w-80 lg:w-96 border-r"
              }`}
            >
              {/* Handle mobile */}
              {isMobile && (
                <div className="flex justify-center py-2">
                  <div className="w-12 h-1 rounded-full bg-muted-foreground/30" />
                </div>
              )}

              {/* Header sidebar */}
              <div className="p-3 border-b bg-muted/30 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Home className="w-4 h-4 text-primary" />
                  {filteredListings.length} annonce
                  {filteredListings.length !== 1 ? "s" : ""}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant={hasActiveFilters ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowFiltersPopup(true)}
                    className="h-8 rounded-lg"
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    Filtrer
                    {activeFiltersCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSidebar(false)}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Liste scrollable */}
              <div className="flex-1 overflow-y-auto">
                {filteredListings.map((listing) => (
                  <button
                    key={listing._id}
                    onClick={() => selectListing(listing)}
                    className={`w-full p-3 text-left border-b hover:bg-muted/50 transition-colors ${
                      selectedListing?._id === listing._id
                        ? "bg-primary/10 border-l-4 border-l-primary"
                        : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      {listing.images?.[0] ? (
                        <img
                          src={listing.images[0]}
                          alt=""
                          className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Home className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm line-clamp-2">
                            {listing.title}
                          </p>
                          {listing.isApproximate && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">
                              Zone
                            </span>
                          )}
                        </div>
                        <p className="text-primary font-bold mt-1">
                          {formatPriceDisplay(listing.price)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {getCityName(listing)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredListings.length === 0 && !isGeocoding && (
                  <div className="p-8 text-center text-muted-foreground">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium mb-1">Aucune annonce</p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="mt-3"
                      >
                        Effacer les filtres
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Bouton toggle sidebar desktop */}
        {!isMobile && (
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`absolute top-1/2 -translate-y-1/2 z-[1002] w-6 h-14 bg-background border rounded-r-lg shadow-lg flex items-center justify-center hover:bg-muted transition-all ${
              showSidebar ? "left-80 lg:left-96" : "left-0"
            }`}
          >
            {showSidebar ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Contrôles carte */}
        <div
          className={`absolute top-4 z-[1000] flex flex-col gap-2 ${
            showSidebar && !isMobile ? "right-4" : "right-3"
          }`}
        >
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomIn}
            className="shadow-lg bg-white/90 backdrop-blur hover:bg-white dark:bg-stone-800/90 h-8 w-8 md:h-9 md:w-9"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomOut}
            className="shadow-lg bg-white/90 backdrop-blur hover:bg-white dark:bg-stone-800/90 h-8 w-8 md:h-9 md:w-9"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleLocate}
            className="shadow-lg bg-white/90 backdrop-blur hover:bg-white dark:bg-stone-800/90 h-8 w-8 md:h-9 md:w-9"
          >
            <Locate className="w-4 h-4" />
          </Button>
        </div>

        {/* Carte de détail de l'annonce sélectionnée */}
        {selectedListing && (
          <div
            className={`absolute z-[1000] animate-fade-in-up ${
              isMobile
                ? showSidebar
                  ? "hidden"
                  : "bottom-3 left-3 right-3"
                : showSidebar
                ? "bottom-4 left-[calc(20rem+1rem)] lg:left-[calc(24rem+1rem)] right-4 max-w-[380px]"
                : "bottom-4 right-4 w-[380px]"
            }`}
          >
            <Card className="overflow-hidden shadow-2xl border-0">
              {/* Contenu compact pour mobile */}
              <div className={isMobile ? "flex" : ""}>
                {selectedListing.images?.[0] ? (
                  <div
                    className={`relative ${
                      isMobile ? "w-28 shrink-0" : "h-40"
                    }`}
                  >
                    <img
                      src={selectedListing.images[0]}
                      alt={selectedListing.title}
                      className="w-full h-full object-cover"
                    />
                    {selectedListing.isApproximate && (
                      <div
                        className={`absolute top-1 left-1 px-1.5 py-0.5 rounded bg-cyan-500/90 text-white text-[10px] font-medium ${
                          isMobile ? "" : "flex items-center gap-1"
                        }`}
                      >
                        {!isMobile && <MapPin className="w-3 h-3" />}
                        Zone
                      </div>
                    )}
                    {!isMobile && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-white text-xl font-bold">
                          {formatPriceDisplay(selectedListing.price)}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`bg-muted flex items-center justify-center ${
                      isMobile ? "w-28 shrink-0" : "h-28"
                    }`}
                  >
                    <Home className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}

                <div className={`p-3 flex-1 ${isMobile ? "min-w-0" : ""}`}>
                  {isMobile && (
                    <p className="text-primary font-bold text-lg">
                      {formatPriceDisplay(selectedListing.price)}
                    </p>
                  )}
                  <p
                    className={`font-medium ${
                      isMobile
                        ? "text-sm truncate"
                        : "text-base line-clamp-2 mb-2"
                    }`}
                  >
                    {selectedListing.title}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {getCityName(selectedListing)}
                    </span>
                  </p>

                  {!isMobile && (
                    <Button
                      asChild
                      className="w-full rounded-xl h-10 mt-3"
                      size="sm"
                    >
                      <Link
                        href={`/l/${selectedListing._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir l'annonce
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Actions mobile */}
                {isMobile && (
                  <div className="p-2 flex flex-col justify-center gap-1 border-l">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedListing(null)}
                      className="h-7 w-7"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button asChild size="icon" className="h-7 w-7">
                      <Link
                        href={`/l/${selectedListing._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Bouton fermer desktop */}
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedListing(null)}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-7 w-7"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </Card>
          </div>
        )}

        {/* Légende desktop */}
        {!isMobile && !showSidebar && (
          <div className="absolute bottom-4 left-4 z-[999] flex gap-4 bg-white/90 dark:bg-stone-900/90 backdrop-blur rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 border-2 border-white shadow" />
              <span>Exacte</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-cyan-500 border-2 border-white shadow" />
              <span>Zone</span>
            </div>
          </div>
        )}
      </div>

      {/* Popup Filtres */}
      {showFiltersPopup && (
        <div
          className="fixed inset-0 z-[1003] bg-black/50 flex items-end md:items-start justify-center md:pt-20 px-0 md:px-4"
          onClick={() => setShowFiltersPopup(false)}
        >
          <Card
            className={`w-full shadow-2xl border-0 animate-fade-in-up md:animate-fade-in-down ${
              isMobile
                ? "rounded-t-2xl rounded-b-none max-h-[80vh]"
                : "max-w-md"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle mobile */}
            {isMobile && (
              <div className="flex justify-center py-2">
                <div className="w-12 h-1 rounded-full bg-muted-foreground/30" />
              </div>
            )}

            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Filtres</h3>
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground"
                  >
                    Effacer
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFiltersPopup(false)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <CardContent className="p-4 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  Recherche
                </label>
                <Input
                  placeholder="Ville, mot-clé..."
                  value={filters.q}
                  onChange={(e) =>
                    setFilters({ ...filters, q: e.target.value })
                  }
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Home className="w-4 h-4 text-muted-foreground" />
                  Type de bien
                </label>
                <Select
                  value={filters.propertyType}
                  onValueChange={(v) =>
                    setFilters({ ...filters, propertyType: v })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="house">Maison</SelectItem>
                    <SelectItem value="apartment">Appartement</SelectItem>
                    <SelectItem value="building">Immeuble</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prix min</label>
                  <div className="relative">
                    <Input
                      placeholder="50 000"
                      value={filters.minPrice}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          minPrice: formatPriceInput(e.target.value),
                        })
                      }
                      className="h-11 rounded-xl pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      €
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prix max</label>
                  <div className="relative">
                    <Input
                      placeholder="200 000"
                      value={filters.maxPrice}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          maxPrice: formatPriceInput(e.target.value),
                        })
                      }
                      className="h-11 rounded-xl pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      €
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowFiltersPopup(false)}
                className="w-full h-11 rounded-xl"
              >
                Voir {filteredListings.length} résultat
                {filteredListings.length !== 1 ? "s" : ""}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading */}
      {(isLoading || isGeocoding) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-[1004]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {isGeocoding
                ? `Géolocalisation... (${geocodingProgress.done}/${geocodingProgress.total})`
                : "Chargement..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
