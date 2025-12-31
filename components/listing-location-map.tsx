"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { ContactAgencyButton } from "@/components/contact-agency-button";

interface ListingLocationMapProps {
  listingId: string;
  agencyId?: string;
  city?: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  geo?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  locationPrecision?: "exact" | "approx";
}

export function ListingLocationMap({
  listingId,
  agencyId,
  city,
  postalCode,
  coordinates,
  geo,
  locationPrecision,
}: ListingLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayPosition, setDisplayPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Charger Leaflet CSS et JS
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return;

      // Charger le CSS Leaflet
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Charger Leaflet JS
      const leaflet = await import("leaflet");
      setL(leaflet.default);
      await new Promise((resolve) => setTimeout(resolve, 100));
      setIsLoading(false);
    };

    loadLeaflet();
  }, []);

  // Calculer la position d'affichage (avec offset si approximatif)
  useEffect(() => {
    if (!coordinates && !geo) return;

    // Déterminer les coordonnées à utiliser (priorité: coordinates > geo)
    let lat: number | undefined;
    let lng: number | undefined;

    if (coordinates?.lat && coordinates?.lng) {
      lat = coordinates.lat;
      lng = coordinates.lng;
    } else if (geo?.coordinates && geo.coordinates.length === 2) {
      // GeoJSON format: [lng, lat]
      lng = geo.coordinates[0];
      lat = geo.coordinates[1];
    }

    if (!lat || !lng) {
      return;
    }

    // Appliquer un offset aléatoire si locationPrecision === "approx"
    // Offset entre 200m et 400m pour préserver la confidentialité
    let finalLat = lat;
    let finalLng = lng;

    if (locationPrecision === "approx") {
      // Générer un offset pseudo-aléatoire basé sur l'ID du listing pour rester stable
      const seed = listingId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const angle = (seed % 360) * (Math.PI / 180); // Angle en radians
      const distance = 200 + (seed % 200); // Distance entre 200m et 400m

      // Convertir la distance en degrés (approximation: 1 degré ≈ 111 km)
      const offsetDegrees = distance / 111000;
      finalLat = lat + offsetDegrees * Math.cos(angle);
      finalLng = lng + offsetDegrees * Math.sin(angle);
    }

    setDisplayPosition({ lat: finalLat, lng: finalLng });
  }, [coordinates, geo, locationPrecision, listingId]);

  // Initialiser la carte
  useEffect(() => {
    if (!L || !mapRef.current || leafletMapRef.current || !displayPosition || isLoading) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: false, // Carte non interactive agressive
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
    }).setView([displayPosition.lat, displayPosition.lng], locationPrecision === "approx" ? 14 : 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    leafletMapRef.current = map;

    // Créer un marqueur personnalisé
    const customIcon = L.divIcon({
      className: "custom-listing-marker",
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    // Ajouter le marqueur
    const marker = L.marker([displayPosition.lat, displayPosition.lng], {
      icon: customIcon,
    }).addTo(map);

    marker.bindPopup(`
      <div style="text-align: center; padding: 4px;">
        <p style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">Localisation du bien</p>
        <p style="font-size: 12px; color: #666;">
          ${postalCode ? `${postalCode} ` : ""}${city || "Ville non renseignée"}
        </p>
        ${locationPrecision === "approx" ? '<p style="font-size: 11px; color: #999; margin-top: 4px;">Zone approximative</p>' : ""}
      </div>
    `);

    markerRef.current = marker;

    // Ajouter un cercle si localisation approximative
    if (locationPrecision === "approx") {
      const circle = L.circle([displayPosition.lat, displayPosition.lng], {
        radius: 300, // 300 mètres
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        weight: 2,
      }).addTo(map);
      circleRef.current = circle;
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (circleRef.current) {
        circleRef.current.remove();
        circleRef.current = null;
      }
    };
  }, [L, displayPosition, isLoading, locationPrecision, city, postalCode]);

  if (isLoading || !displayPosition) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-muted/50 rounded-lg border">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Informations de localisation (sans adresse exacte) */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="w-4 h-4" />
        <span>
          {postalCode && `${postalCode} `}
          {city || "Localisation non renseignée"}
        </span>
        {locationPrecision === "approx" && (
          <span className="text-xs text-muted-foreground/70">
            (zone approximative)
          </span>
        )}
      </div>

      {/* Carte */}
      <div ref={mapRef} className="w-full h-[400px] rounded-lg overflow-hidden border" />

      {/* Bouton CTA pour demander l'adresse précise */}
      {agencyId ? (
        <div className="pt-2">
          <ContactAgencyButton
            listingId={listingId}
            agencyId={agencyId}
            className="w-full"
          />
          <p className="text-xs text-center text-muted-foreground mt-2">
            Contactez l'agence pour obtenir l'adresse précise du bien
          </p>
        </div>
      ) : (
        <p className="text-xs text-center text-muted-foreground">
          Contactez le vendeur pour obtenir l'adresse précise du bien
        </p>
      )}

      {/* Note de confidentialité */}
      <p className="text-xs text-muted-foreground text-center">
        La localisation affichée est indicative et peut être approximative pour préserver la confidentialité.
      </p>
    </div>
  );
}
