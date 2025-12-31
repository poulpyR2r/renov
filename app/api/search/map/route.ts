export const dynamic = "force-dynamic";
export const revalidate = 0;

import { type NextRequest, NextResponse } from "next/server";
import { getListingModel } from "@/models/Listing";
import { ObjectId } from "mongodb";

/**
 * Endpoint dédié pour la carte avec clustering et filtres
 * GET /api/search/map?bbox=west,south,east,north&zoom=12&...
 * 
 * Retourne clusters et points selon le zoom
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Bbox obligatoire: west,south,east,north
    const bboxParam = searchParams.get("bbox");
    if (!bboxParam) {
      return NextResponse.json(
        { error: "bbox parameter is required (west,south,east,north)" },
        { status: 400 }
      );
    }

    const [west, south, east, north] = bboxParam.split(",").map(Number.parseFloat);
    if (
      isNaN(west) ||
      isNaN(south) ||
      isNaN(east) ||
      isNaN(north) ||
      west >= east ||
      south >= north
    ) {
      return NextResponse.json(
        { error: "Invalid bbox format. Expected: west,south,east,north" },
        { status: 400 }
      );
    }

    const zoom = Number.parseInt(searchParams.get("zoom") || "10");
    
    // Filtres (similaires à /api/search)
    const propertyTypes = searchParams.get("propertyTypes")?.split(",").filter(Boolean) || [];
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minSurface = searchParams.get("minSurface");
    const maxSurface = searchParams.get("maxSurface");
    const minRooms = searchParams.get("minRooms");
    const minRenovationLevel = searchParams.get("minRenovationLevel");
    const maxRenovationLevel = searchParams.get("maxRenovationLevel");
    const requiredWorks = searchParams.get("requiredWorks")?.split(",").filter(Boolean) || [];
    const dpeClasses = searchParams.get("dpeClasses")?.split(",").filter(Boolean) || [];
    const gesClasses = searchParams.get("gesClasses")?.split(",").filter(Boolean) || [];
    const minEnergyCost = searchParams.get("minEnergyCost");
    const maxEnergyCost = searchParams.get("maxEnergyCost");
    const coproprietySubject = searchParams.get("coproprietySubject");
    const maxCoproprietyCharges = searchParams.get("maxCoproprietyCharges");
    const coproprietyProcedure = searchParams.get("coproprietyProcedure");

    const Listing = await getListingModel();

    // Construire le filtre MongoDB
    const filter: any = {
      status: "active",
      "location.geo": {
        $geoWithin: {
          $box: [
            [west, south], // Southwest corner
            [east, north], // Northeast corner
          ],
        },
      },
    };

    // Appliquer les filtres (similaires à /api/search)
    if (propertyTypes.length > 0) {
      filter.propertyType = { $in: propertyTypes };
    }

    if (minPrice || maxPrice) {
      filter.price = { ...filter.price };
      if (minPrice) filter.price.$gte = Number.parseInt(minPrice);
      if (maxPrice) filter.price.$lte = Number.parseInt(maxPrice);
    }

    if (minSurface || maxSurface) {
      filter.surface = { ...filter.surface };
      if (minSurface) filter.surface.$gte = Number.parseInt(minSurface);
      if (maxSurface) filter.surface.$lte = Number.parseInt(maxSurface);
    }

    if (minRooms) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { rooms: { $gte: Number.parseInt(minRooms) } },
            { bedrooms: { $gte: Number.parseInt(minRooms) } },
          ],
        },
      ];
    }

    if (minRenovationLevel || maxRenovationLevel) {
      filter["renovation.level"] = { ...filter["renovation.level"] };
      if (minRenovationLevel)
        filter["renovation.level"].$gte = Number.parseInt(minRenovationLevel);
      if (maxRenovationLevel)
        filter["renovation.level"].$lte = Number.parseInt(maxRenovationLevel);
    }

    if (requiredWorks.length > 0) {
      filter["renovation.requiredWorks"] = { $in: requiredWorks };
    }

    if (dpeClasses.length > 0) {
      filter["diagnostics.dpe.energyClass"] = { $in: dpeClasses };
    }

    if (gesClasses.length > 0) {
      filter["diagnostics.dpe.gesClass"] = { $in: gesClasses };
    }

    // Filtre dépenses énergétiques (cherche dans min ou max)
    if (minEnergyCost || maxEnergyCost) {
      const energyCostFilter: any = {};
      if (minEnergyCost) energyCostFilter.$gte = Number.parseInt(minEnergyCost);
      if (maxEnergyCost) energyCostFilter.$lte = Number.parseInt(maxEnergyCost);
      
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { "diagnostics.dpe.energyCost.min": energyCostFilter },
            { "diagnostics.dpe.energyCost.max": energyCostFilter },
          ],
        },
      ];
    }

    if (coproprietySubject !== null && coproprietySubject !== undefined && coproprietySubject !== "") {
      filter["copropriety.isSubject"] = coproprietySubject === "true";
    }

    if (maxCoproprietyCharges) {
      filter["copropriety.annualCharges"] = { $lte: Number.parseInt(maxCoproprietyCharges) };
    }

    if (coproprietyProcedure !== null && coproprietyProcedure !== undefined && coproprietyProcedure !== "") {
      filter["copropriety.procedureInProgress"] = coproprietyProcedure === "true";
    }

    // Limiter le nombre de résultats pour éviter l'overfetch
    // Au zoom faible, on veut surtout des clusters
    // Au zoom élevé, on veut des points individuels
    const maxResults = zoom >= 14 ? 500 : zoom >= 12 ? 200 : 100;

    // Récupérer les listings avec tri par sponsoring en priorité
    const listings = await Listing.find(filter)
      .sort({ isSponsored: -1, createdAt: -1 })
      .limit(maxResults)
      .project({
        _id: 1,
        price: 1,
        "location.geo": 1,
        "location.coordinates": 1,
        locationPrecision: 1,
        isSponsored: 1,
        "renovation.level": 1,
        "diagnostics.dpe.energyClass": 1,
        images: { $slice: 1 }, // Première image seulement
      })
      .toArray();

    // Appliquer le décalage aléatoire pour locationPrecision === "approx"
    // (sans modifier les données en base)
    const processedListings: Array<{
      listingId: string;
      center: [number, number];
      price: number;
      isSponsored: boolean;
      renovationLevel?: number;
      dpeEnergyClass?: string;
      image?: string;
    }> = [];

    for (const listing of listings) {
      const geo = listing.location?.geo || listing.location?.coordinates;
      if (!geo) continue;

      let finalCoords: [number, number];
      if (listing.location?.geo?.coordinates && Array.isArray(listing.location.geo.coordinates)) {
        finalCoords = [...listing.location.geo.coordinates] as [number, number];
      } else if (listing.location?.coordinates?.lat && listing.location?.coordinates?.lng) {
        // Convertir coordinates {lat, lng} en [lng, lat]
        finalCoords = [listing.location.coordinates.lng, listing.location.coordinates.lat];
      } else {
        continue;
      }

      // Si locationPrecision === "approx", décaler aléatoirement dans un rayon de 150-400m
      if (listing.locationPrecision === "approx") {
        const radiusMeters = 150 + Math.random() * 250; // 150-400m
        const radiusDegrees = radiusMeters / 111000; // Approximation: 1 degré ≈ 111km
        const angle = Math.random() * 2 * Math.PI;
        
        const latOffset = radiusDegrees * Math.cos(angle);
        const lngOffset = radiusDegrees * Math.sin(angle) / Math.cos(finalCoords[1] * Math.PI / 180);
        
        finalCoords[0] += lngOffset; // lng
        finalCoords[1] += latOffset; // lat
      }

      processedListings.push({
        listingId: listing._id!.toString(),
        center: finalCoords, // [lng, lat]
        price: listing.price,
        isSponsored: listing.isSponsored === true,
        renovationLevel: listing.renovation?.level,
        dpeEnergyClass: listing.diagnostics?.dpe?.energyClass,
        image: listing.images?.[0],
      });
    }

    // Clustering basique côté serveur selon le zoom
    // Zoom faible (< 12): clustering agressif
    // Zoom moyen (12-14): clustering modéré
    // Zoom élevé (>= 14): peu ou pas de clustering
    const clusterGridSize = zoom < 12 ? 0.05 : zoom < 14 ? 0.02 : 0.01; // En degrés

    const clusters: Array<{
      id: string;
      count: number;
      center: [number, number];
      bbox?: [number, number, number, number];
    }> = [];

    const points: Array<{
      listingId: string;
      center: [number, number];
      price: number;
      isSponsored: boolean;
      renovationLevel?: number;
      dpeEnergyClass?: string;
      image?: string;
    }> = [];

    // Grouper par grille pour le clustering
    const grid: Map<string, typeof processedListings> = new Map();

    for (const point of processedListings) {
      if (!point) continue;

      const [lng, lat] = point.center;
      const gridX = Math.floor(lng / clusterGridSize);
      const gridY = Math.floor(lat / clusterGridSize);
      const gridKey = `${gridX},${gridY}`;

      if (!grid.has(gridKey)) {
        grid.set(gridKey, []);
      }
      grid.get(gridKey)!.push(point);
    }

    // Traiter chaque cellule de la grille
    for (const [gridKey, cellPoints] of grid.entries()) {
      if (cellPoints.length === 0) continue;

      if (cellPoints.length === 1 && zoom >= 14) {
        // Point individuel au zoom élevé
        points.push(cellPoints[0]!);
      } else if (cellPoints.length > 1) {
        // Cluster: calculer le centre et compter
        const centerLng =
          cellPoints.reduce((sum, p) => sum + p.center[0], 0) / cellPoints.length;
        const centerLat =
          cellPoints.reduce((sum, p) => sum + p.center[1], 0) / cellPoints.length;

        // Bbox du cluster (optionnel, peut être calculé côté client)
        const lngs = cellPoints.map((p) => p.center[0]);
        const lats = cellPoints.map((p) => p.center[1]);
        const bbox: [number, number, number, number] = [
          Math.min(...lngs),
          Math.min(...lats),
          Math.max(...lngs),
          Math.max(...lats),
        ];

        clusters.push({
          id: `cluster-${gridKey}`,
          count: cellPoints.length,
          center: [centerLng, centerLat],
          bbox,
        });

        // Au zoom très élevé, on peut aussi ajouter les points individuels
        if (zoom >= 15) {
          points.push(...cellPoints);
        }
      } else if (cellPoints.length === 1) {
        // Point individuel
        points.push(cellPoints[0]!);
      }
    }

    return NextResponse.json({
      clusters,
      points,
      bbox: [west, south, east, north],
      zoom,
    });
  } catch (error: any) {
    console.error("Map search error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la recherche sur la carte" },
      { status: 500 }
    );
  }
}

