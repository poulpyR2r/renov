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
  Bed,
  Bath,
  Square,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { FilterBar } from "@/components/search/filter-bar";
import { FiltersDrawer } from "@/components/search/filters-drawer";
import { Badge } from "@/components/ui/badge";

interface Listing {
  _id: string;
  title: string;
  price?: number;
  location?: {
    city?: string;
    department?: string;
    region?: string;
    postalCode?: string;
    coordinates?: {
      lat?: number;
      lng?: number;
    };
  };
  images?: string[];
  propertyType?: string;
  surface?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  renovation?: {
    level?: number;
  };
  diagnostics?: {
    dpe?: {
      energyClass?: string;
    };
  };
  // ✅ Map highlight pour PRO/PREMIUM
  mapHighlight?: boolean;
  agencyPack?: string;
  agencyBadge?: string;
  isSponsored?: boolean;
}

interface GeocodedListing extends Listing {
  coords: { lat: number; lng: number };
  isApproximate: boolean;
  mapHighlight?: boolean;
  isSponsored?: boolean;
}

interface FilterState {
  q: string;
  cities: string[];
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
  initialFilters?: Partial<FilterState>;
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
  const userLocationMarkerRef = useRef<any>(null);
  const isFirstBoundsChangeRef = useRef<boolean>(true);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showSearchAreaCTA, setShowSearchAreaCTA] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({
    done: 0,
    total: 0,
  });
  const [selectedListing, setSelectedListing] =
    useState<GeocodedListing | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [L, setL] = useState<any>(null);
  const [geocodedListings, setGeocodedListings] = useState<GeocodedListing[]>(
    []
  );
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  // Mobile : sidebar masquée par défaut, Desktop : visible
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    q: initialFilters?.q || "",
    cities: initialFilters?.cities || [],
    postalCode: initialFilters?.postalCode || "",
    propertyTypes: initialFilters?.propertyTypes || [],
    minPrice: initialFilters?.minPrice || "",
    maxPrice: initialFilters?.maxPrice || "",
    minSurface: initialFilters?.minSurface || "",
    maxSurface: initialFilters?.maxSurface || "",
    minRooms: initialFilters?.minRooms || "",
    minRenovationLevel: initialFilters?.minRenovationLevel || "",
    maxRenovationLevel: initialFilters?.maxRenovationLevel || "",
    requiredWorks: initialFilters?.requiredWorks || [],
    dpeClasses: initialFilters?.dpeClasses || [],
    gesClasses: initialFilters?.gesClasses || [],
    minEnergyCost: initialFilters?.minEnergyCost || "",
    maxEnergyCost: initialFilters?.maxEnergyCost || "",
    coproprietySubject: initialFilters?.coproprietySubject,
    maxCoproprietyCharges: initialFilters?.maxCoproprietyCharges || "",
    coproprietyProcedure: initialFilters?.coproprietyProcedure,
    sortBy: initialFilters?.sortBy || "date",
    sortOrder: initialFilters?.sortOrder || "desc",
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

      if (filters.cities.length > 0) {
        const listingCity = listing.location?.city?.toLowerCase() || "";
        const matchesCity = filters.cities.some((city) =>
          listingCity.includes(city.toLowerCase())
        );
        if (!matchesCity) return false;
      }

      if (filters.postalCode) {
        if (!listing.location?.postalCode?.includes(filters.postalCode))
          return false;
      }

      if (filters.propertyTypes.length > 0) {
        if (
          !listing.propertyType ||
          !filters.propertyTypes.includes(listing.propertyType)
        )
          return false;
      }

      if (filters.minPrice) {
        const min = parseNumber(filters.minPrice);
        if (min !== null && (listing.price || 0) < min) return false;
      }

      if (filters.maxPrice) {
        const max = parseNumber(filters.maxPrice);
        if (max !== null && (listing.price || 0) > max) return false;
      }

      if (filters.minSurface) {
        const min = parseNumber(filters.minSurface);
        if (min !== null && (listing.surface || 0) < min) return false;
      }

      if (filters.maxSurface) {
        const max = parseNumber(filters.maxSurface);
        if (max !== null && (listing.surface || 0) > max) return false;
      }

      if (filters.minRooms) {
        const min = parseNumber(filters.minRooms);
        if (min !== null) {
          const rooms = listing.rooms || listing.bedrooms || 0;
          if (rooms < min) return false;
        }
      }

      if (filters.minRenovationLevel) {
        const min = parseNumber(filters.minRenovationLevel);
        if (min !== null) {
          const level = listing.renovation?.level || 0;
          if (level < min) return false;
        }
      }

      if (filters.maxRenovationLevel) {
        const max = parseNumber(filters.maxRenovationLevel);
        if (max !== null) {
          const level = listing.renovation?.level || 0;
          if (level > max) return false;
        }
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
      /* ✅ Marqueur mis en avant PRO/PREMIUM */
      .marker-pin-highlight {
        width: 42px;
        height: 42px;
        background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.5), 0 0 20px rgba(245, 158, 11, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
        position: relative;
        animation: pulse-highlight 2s ease-in-out infinite;
      }
      .marker-pin-highlight::after {
        content: '★';
        position: absolute;
        top: -8px;
        right: -8px;
        width: 18px;
        height: 18px;
        background: #fbbf24;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: #fff;
        transform: rotate(45deg);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      }
      .marker-pin-highlight:hover {
        transform: rotate(-45deg) scale(1.15);
        box-shadow: 0 6px 25px rgba(239, 68, 68, 0.6), 0 0 30px rgba(245, 158, 11, 0.5);
      }
      .marker-pin-highlight svg {
        width: 18px;
        height: 18px;
        transform: rotate(45deg);
      }
      @keyframes pulse-highlight {
        0%, 100% {
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.5), 0 0 20px rgba(245, 158, 11, 0.4);
        }
        50% {
          box-shadow: 0 4px 25px rgba(239, 68, 68, 0.7), 0 0 35px rgba(245, 158, 11, 0.6);
        }
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

    const handleBoundsChange = () => {
      const bounds = map.getBounds();
      if (onBoundsChange) {
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
      // Afficher le CTA après le premier déplacement (pas au chargement initial)
      if (!isFirstBoundsChangeRef.current) {
        setShowSearchAreaCTA(true);
      }
      isFirstBoundsChangeRef.current = false;
    };

    map.on("moveend", handleBoundsChange);
    map.on("zoomend", handleBoundsChange);
    handleBoundsChange();

    // Récupérer la position de l'utilisateur au chargement
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserLocation(userPos);
        },
        () => {
          // Erreur de géolocalisation - ignoré silencieusement
        }
      );
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L, center.lat, center.lng, zoom, isGeocoding]);

  // Ajouter le marqueur de localisation utilisateur
  useEffect(() => {
    if (!L || !leafletMapRef.current || !userLocation) return;

    // Supprimer l'ancien marqueur s'il existe
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove();
    }

    // Créer un marqueur bleu pour la position de l'utilisateur
    const userIcon = L.divIcon({
      className: "user-location-marker",
      html: `
        <div style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 4px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const marker = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 1000, // Au-dessus des autres marqueurs
    }).addTo(leafletMapRef.current);

    userLocationMarkerRef.current = marker;

    return () => {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
    };
  }, [L, userLocation]);

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

    // ✅ Icône mise en avant PRO/PREMIUM
    const highlightIcon = L.divIcon({
      className: "custom-map-marker",
      html: `
        <div class="marker-pin-highlight">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 42],
      popupAnchor: [0, -42],
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
        // ✅ Utiliser le marqueur mis en avant pour PRO/PREMIUM ou sponsorisé
        const shouldHighlight = listing.mapHighlight || listing.isSponsored;
        const marker = L.marker([listing.coords.lat, listing.coords.lng], {
          icon: shouldHighlight ? highlightIcon : preciseIcon,
          zIndexOffset: shouldHighlight ? 1000 : 0, // Les marqueurs mis en avant au-dessus
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
        const userPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(userPos);
        leafletMapRef.current.flyTo(
          [pos.coords.latitude, pos.coords.longitude],
          12
        );
      },
      () => console.error("Geolocation error")
    );
  };

  const handleSearchInArea = () => {
    if (!leafletMapRef.current) return;
    const bounds = leafletMapRef.current.getBounds();
    if (onBoundsChange) {
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    }
    setShowSearchAreaCTA(false);
  };

  const selectListing = (listing: GeocodedListing) => {
    setSelectedListing(listing);
    setCurrentImageIndex(0); // Réinitialiser l'index d'image quand on change de listing
    leafletMapRef.current?.panTo([listing.coords.lat, listing.coords.lng]);
    leafletMapRef.current?.setZoom(listing.isApproximate ? 12 : 14);
    if (isMobile) setShowSidebar(false);
  };

  // Réinitialiser l'index d'image quand le listing sélectionné change
  useEffect(() => {
    if (selectedListing) {
      setCurrentImageIndex(0);
    }
  }, [selectedListing?._id]);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedListing?.images && selectedListing.images.length > 0) {
      setCurrentImageIndex(
        (prev) => (prev + 1) % selectedListing.images!.length
      );
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedListing?.images && selectedListing.images.length > 0) {
      setCurrentImageIndex(
        (prev) =>
          (prev - 1 + selectedListing.images!.length) %
          selectedListing.images!.length
      );
    }
  };

  const clearFilters = () => {
    setFilters({
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
    });
  };

  const hasActiveFilters =
    filters.q ||
    filters.cities.length > 0 ||
    filters.postalCode ||
    filters.propertyTypes.length > 0 ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.minSurface ||
    filters.maxSurface ||
    filters.minRooms ||
    filters.minRenovationLevel ||
    filters.maxRenovationLevel ||
    filters.requiredWorks.length > 0 ||
    filters.dpeClasses.length > 0 ||
    filters.gesClasses.length > 0 ||
    filters.minEnergyCost ||
    filters.maxEnergyCost ||
    filters.coproprietySubject !== undefined ||
    filters.maxCoproprietyCharges ||
    filters.coproprietyProcedure !== undefined;

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.cities.length > 0) count += filters.cities.length;
    if (filters.postalCode) count++;
    if (filters.propertyTypes.length > 0) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.minSurface || filters.maxSurface) count++;
    if (filters.minRooms) count++;
    if (filters.minRenovationLevel || filters.maxRenovationLevel) count++;
    if (filters.requiredWorks.length > 0) count++;
    if (filters.dpeClasses.length > 0) count++;
    if (filters.gesClasses.length > 0) count++;
    if (filters.minEnergyCost || filters.maxEnergyCost) count++;
    if (filters.coproprietySubject !== undefined) count++;
    if (filters.maxCoproprietyCharges) count++;
    if (filters.coproprietyProcedure !== undefined) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

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
                    onClick={() => setShowFiltersDrawer(true)}
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
                    className={`w-full p-4 text-left border-b hover:bg-muted/50 transition-colors ${
                      selectedListing?._id === listing._id
                        ? "bg-primary/10 border-l-4 border-l-primary"
                        : ""
                    }`}
                  >
                    <div className="flex gap-4">
                      {listing.images?.[0] ? (
                        <img
                          src={listing.images[0]}
                          alt=""
                          className="w-28 h-28 md:w-36 md:h-36 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-28 h-28 md:w-36 md:h-36 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Home className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm md:text-base line-clamp-3">
                            {listing.title}
                          </p>
                          {listing.isApproximate && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">
                              Zone
                            </span>
                          )}
                        </div>
                        <p className="text-primary font-bold text-lg md:text-xl mt-2">
                          {formatPriceDisplay(listing.price)}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          {listing.surface && (
                            <span className="flex items-center gap-1">
                              <Square className="w-3.5 h-3.5" />
                              {listing.surface} m²
                            </span>
                          )}
                          {listing.rooms && (
                            <span className="flex items-center gap-1">
                              <Home className="w-3.5 h-3.5" />
                              {listing.rooms} pièces
                            </span>
                          )}
                          {listing.bedrooms && (
                            <span className="flex items-center gap-1">
                              <Bed className="w-3.5 h-3.5" />
                              {listing.bedrooms}
                            </span>
                          )}
                          {listing.bathrooms && (
                            <span className="flex items-center gap-1">
                              <Bath className="w-3.5 h-3.5" />
                              {listing.bathrooms}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                          <MapPin className="w-3.5 h-3.5" />
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
          <button
            onClick={handleZoomIn}
            className="h-10 w-10 rounded-lg shadow-lg bg-white hover:bg-gray-100 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-stone-600"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="h-10 w-10 rounded-lg shadow-lg bg-white hover:bg-gray-100 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-stone-600"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleLocate}
            className="h-10 w-10 rounded-lg shadow-lg bg-white hover:bg-gray-100 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-stone-600"
          >
            <Locate className="w-5 h-5" />
          </button>
        </div>

        {/* CTA Rechercher dans cette zone */}
        {showSearchAreaCTA && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[2500] animate-fade-in-down">
            <Button
              onClick={handleSearchInArea}
              className="shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-full"
            >
              <Search className="w-4 h-4 mr-2" />
              Rechercher dans cette zone
            </Button>
          </div>
        )}

        {/* Carte de détail de l'annonce sélectionnée */}
        {selectedListing && (
          <div
            className={`absolute z-[1000] animate-fade-in-up ${
              isMobile
                ? showSidebar
                  ? "hidden"
                  : "bottom-3 left-3 right-3"
                : showSidebar
                ? "bottom-4 left-[calc(20rem+1rem)] lg:left-[calc(24rem+1rem)] right-4 max-w-[480px]"
                : "bottom-4 right-4 w-[480px]"
            }`}
          >
            <Card className="overflow-hidden shadow-2xl border-0">
              {/* Carrousel d'images */}
              {selectedListing.images && selectedListing.images.length > 0 ? (
                <div className="relative h-64 group">
                  <img
                    src={
                      selectedListing.images[currentImageIndex] ||
                      selectedListing.images[0]
                    }
                    alt={selectedListing.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Badge Zone */}
                  {selectedListing.isApproximate && (
                    <div className="absolute top-2 left-2 px-2 py-1 rounded bg-cyan-500/90 text-white text-xs font-medium flex items-center gap-1 z-10">
                      <MapPin className="w-3 h-3" />
                      Zone
                    </div>
                  )}

                  {/* Boutons navigation */}
                  {selectedListing.images.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10 md:h-8 md:w-8 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation"
                        aria-label="Image précédente"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10 md:h-8 md:w-8 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation"
                        aria-label="Image suivante"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>

                      {/* Indicateurs de position */}
                      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm z-10">
                        {selectedListing.images.slice(0, 5).map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              idx === currentImageIndex
                                ? "bg-white w-3"
                                : "bg-white/50"
                            }`}
                          />
                        ))}
                        {selectedListing.images.length > 5 && (
                          <span className="text-white text-[10px] ml-1">
                            +{selectedListing.images.length - 5}
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  {/* Prix en overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-white text-2xl font-bold">
                      {formatPriceDisplay(selectedListing.price)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-muted flex items-center justify-center">
                  <Home className="w-16 h-16 text-muted-foreground" />
                </div>
              )}

              {/* Contenu détaillé */}
              <div className="p-4">
                <h3 className="font-bold text-xl mb-2 line-clamp-2">
                  {selectedListing.title}
                </h3>

                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{getCityName(selectedListing)}</span>
                  {selectedListing.location?.postalCode && (
                    <span> ({selectedListing.location.postalCode})</span>
                  )}
                </p>

                {/* Caractéristiques */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {selectedListing.surface && (
                    <div className="flex items-center gap-2 text-sm">
                      <Square className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {selectedListing.surface} m²
                      </span>
                    </div>
                  )}
                  {selectedListing.rooms && (
                    <div className="flex items-center gap-2 text-sm">
                      <Home className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {selectedListing.rooms} pièces
                      </span>
                    </div>
                  )}
                  {selectedListing.bedrooms && (
                    <div className="flex items-center gap-2 text-sm">
                      <Bed className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {selectedListing.bedrooms} ch.
                      </span>
                    </div>
                  )}
                  {selectedListing.bathrooms && (
                    <div className="flex items-center gap-2 text-sm">
                      <Bath className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {selectedListing.bathrooms} sdb
                      </span>
                    </div>
                  )}
                </div>

                {/* Niveau de rénovation */}
                {selectedListing.renovation?.level && (
                  <div className="mb-4 p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-2">
                      Niveau de rénovation
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">
                        {getRenovationLevelLabel(
                          selectedListing.renovation.level
                        )}
                      </p>
                      <Badge
                        className={getRenovationLevelColor(
                          selectedListing.renovation.level
                        )}
                      >
                        Niveau {selectedListing.renovation.level}/5
                      </Badge>
                    </div>
                  </div>
                )}

                {/* DPE */}
                {selectedListing.diagnostics?.dpe?.energyClass && (
                  <div className="mb-4">
                    <span className="text-xs text-muted-foreground">
                      Classe énergétique
                    </span>
                    <div className="mt-1">
                      <span className="px-2 py-1 rounded text-sm font-medium bg-primary/10 text-primary">
                        DPE {selectedListing.diagnostics.dpe.energyClass}
                      </span>
                    </div>
                  </div>
                )}

                {/* Bouton voir l'annonce */}
                <Button
                  asChild
                  className="w-full rounded-xl h-11 mt-2"
                  size="lg"
                >
                  <Link
                    href={`/l/${selectedListing._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    Voir l'annonce complète
                  </Link>
                </Button>
              </div>

              {/* Bouton fermer */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedListing(null)}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
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

      {/* Drawer Filtres */}
      <FiltersDrawer
        open={showFiltersDrawer}
        onOpenChange={setShowFiltersDrawer}
        filters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          setShowFiltersDrawer(false);
        }}
        onClearFilters={clearFilters}
        resultsCount={filteredListings.length}
        formatPrice={formatPrice}
        unformatPrice={unformatPrice}
      />

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
