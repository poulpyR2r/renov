export const dynamic = "force-dynamic";
export const revalidate = 0;

import { type NextRequest, NextResponse } from "next/server";
import { getListingModel } from "@/models/Listing";

/**
 * Endpoint dédié pour le comptage rapide (pour afficher "Rechercher (N)")
 * GET /api/search/count?...
 * 
 * Retourne uniquement le nombre total de résultats correspondant aux filtres
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const query = searchParams.get("q") || "";
    const cities = searchParams.get("cities")?.split(",").filter(Boolean).map(c => c.trim()) || [];
    const postalCode = (searchParams.get("postalCode") || "").trim();
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

    // Filtres géographiques facultatifs
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const radiusKmParam = searchParams.get("radiusKm");
    const centerLat = latParam ? Number.parseFloat(latParam) : undefined;
    const centerLng = lngParam ? Number.parseFloat(lngParam) : undefined;
    const radiusKm = radiusKmParam
      ? Number.parseFloat(radiusKmParam)
      : undefined;

    const Listing = await getListingModel();

    const filter: any = { status: "active" };

    // Appliquer les mêmes filtres que /api/search
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    if (cities.length > 0) {
      const cityConditions = cities.flatMap((city) => {
        const soft = city.slice(0, Math.min(5, city.length));
        return [
          { "location.city": { $regex: city, $options: "i" } },
          ...(soft.length >= 3
            ? [{ "location.city": { $regex: soft, $options: "i" } }]
            : []),
        ];
      });
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: cityConditions,
        },
      ];
    }
    
    if (postalCode) {
      filter.$and = [
        ...(filter.$and || []),
        { "location.postalCode": { $regex: postalCode, $options: "i" } },
      ];
    }

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

    // Si filtre géographique demandé, utiliser $geoWithin ou calcul Haversine post-requête
    // Pour le count, on peut simplifier en comptant d'abord sans distance
    // (le calcul exact de distance serait coûteux pour un simple count)
    let total = await Listing.countDocuments(filter);

    // Si filtre par distance, on doit faire un calcul approximatif
    // Pour un count rapide, on utilise une approximation simple
    if (centerLat != null && centerLng != null && radiusKm != null) {
      // Approximation: compter tous les résultats dans un bbox approximatif
      // Plus précis serait de faire un find + filter, mais c'est coûteux pour un count
      // Pour l'instant, on retourne le count avec filtre géographique approximatif
      const Listing = await getListingModel();
      const approximateBbox = {
        "location.geo": {
          $geoWithin: {
            $centerSphere: [[centerLng, centerLat], radiusKm / 6378.1], // radiusKm en radians
          },
        },
      };
      const geoFilter = { ...filter, ...approximateBbox };
      total = await Listing.countDocuments(geoFilter);
    }

    return NextResponse.json({
      total,
    });
  } catch (error: any) {
    console.error("Count search error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du comptage" },
      { status: 500 }
    );
  }
}

