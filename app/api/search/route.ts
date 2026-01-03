export const dynamic = "force-dynamic";
export const revalidate = 0;

import { type NextRequest, NextResponse } from "next/server";
import { getListingModel } from "@/models/Listing";
import { getAgencyModel } from "@/models/Agency";
import { PackType, getPackConfig } from "@/lib/packs";
import { ObjectId } from "mongodb";

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
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const source = searchParams.get("source");
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "20");

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

    // Filtre rénovation (niveau 1-5)
    if (minRenovationLevel || maxRenovationLevel) {
      filter["renovation.level"] = {};
      if (minRenovationLevel) {
        filter["renovation.level"].$gte = Number.parseInt(minRenovationLevel);
      }
      if (maxRenovationLevel) {
        filter["renovation.level"].$lte = Number.parseInt(maxRenovationLevel);
      }
    }

    // Filtre travaux requis (au moins un des travaux sélectionnés doit être présent)
    if (requiredWorks.length > 0) {
      filter["renovation.requiredWorks"] = { $in: requiredWorks };
    }

    // Filtre DPE (classe énergie)
    if (dpeClasses.length > 0) {
      filter["diagnostics.dpe.energyClass"] = { $in: dpeClasses };
    }

    // Filtre GES (classe GES)
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

    // Filtre copropriété
    if (coproprietySubject !== null && coproprietySubject !== undefined && coproprietySubject !== "") {
      filter["copropriety.isSubject"] = coproprietySubject === "true";
    }

    if (maxCoproprietyCharges) {
      const chargesFilter: any = { $lte: Number.parseInt(maxCoproprietyCharges) };
      filter["copropriety.annualCharges"] = chargesFilter;
    }

    if (coproprietyProcedure !== null && coproprietyProcedure !== undefined && coproprietyProcedure !== "") {
      filter["copropriety.procedureInProgress"] = coproprietyProcedure === "true";
    }

    if (source) filter.sourceName = source;

    const skip = (page - 1) * limit;

    // Construire le tri
    const sortArray: any[] = [{ isSponsored: -1 }]; // Prioriser les annonces sponsorisées
    
    if (sortBy === "price") {
      sortArray.push({ price: sortOrder === "asc" ? 1 : -1 });
    } else if (sortBy === "surface") {
      sortArray.push({ surface: sortOrder === "asc" ? 1 : -1 });
    } else if (sortBy === "renovationLevel") {
      sortArray.push({ "renovation.level": sortOrder === "asc" ? 1 : -1 });
    } else {
      // Par défaut : date de publication
      sortArray.push({ createdAt: sortOrder === "asc" ? 1 : -1 });
    }
    
    // Ajouter renovationScore et createdAt comme tri secondaire si pas déjà présent
    if (sortBy !== "date") {
      sortArray.push({ renovationScore: -1 });
      sortArray.push({ createdAt: -1 });
    } else if (sortBy === "date" && sortOrder === "desc") {
      sortArray.push({ renovationScore: -1 });
    }

    // Si filtre géographique demandé, on récupère un pool plus large et on post-filtre par distance haversine
    const baseCursor = Listing.find(filter).sort(sortArray);
    const [rawListings, total] = await Promise.all([
      centerLat != null && centerLng != null && radiusKm != null
        ? baseCursor.limit(500).toArray()
        : baseCursor.skip(skip).limit(limit).toArray(),
      Listing.countDocuments(filter),
    ]);

    let listings = rawListings as any[];

    // ✅ Enrichir les annonces avec les infos de pack pour le tri par priorité
    const Agency = await getAgencyModel();
    const agencyIds = [...new Set(listings
      .filter(l => l.agencyId)
      .map(l => l.agencyId.toString ? l.agencyId.toString() : String(l.agencyId))
    )];
    
    // Récupérer les agences en une seule requête
    const agencies = await Agency.find({
      _id: { $in: agencyIds.map(id => new ObjectId(id)) }
    }).toArray();
    
    const agencyPackMap = new Map<string, number>();
    agencies.forEach(agency => {
      const pack: PackType = agency.subscription?.pack || "FREE";
      const config = getPackConfig(pack);
      agencyPackMap.set(agency._id!.toString(), config.displayPriority);
    });

    // ✅ Fonction pour obtenir la priorité de tri d'une annonce
    const getListingPriority = (listing: any) => {
      const agencyIdStr = listing.agencyId?.toString ? listing.agencyId.toString() : String(listing.agencyId || "");
      const packPriority = agencyPackMap.get(agencyIdStr) || 0;
      const sponsoredBonus = listing.isSponsored ? 100 : 0; // Les sponsorisés sont toujours en premier
      return sponsoredBonus + packPriority;
    };

    if (centerLat != null && centerLng != null && radiusKm != null) {
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const R = 6371; // km
      listings = (rawListings as any[])
        .map((l) => {
          const lat = l?.location?.coordinates?.lat;
          const lng = l?.location?.coordinates?.lng;
          if (typeof lat !== "number" || typeof lng !== "number")
            return { l, d: Number.POSITIVE_INFINITY, priority: getListingPriority(l) };
          const dLat = toRad(lat - centerLat);
          const dLng = toRad(lng - centerLng);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(centerLat)) *
              Math.cos(toRad(lat)) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          return { l, d: distance, priority: getListingPriority(l) };
        })
        .filter((x) => x.d <= radiusKm)
        .sort((a, b) => {
          // ✅ Tri par priorité (pack + sponsorisé), puis par distance
          if (a.priority !== b.priority) {
            return b.priority - a.priority; // Plus haute priorité en premier
          }
          return a.d - b.d;
        })
        .slice(skip, skip + limit)
        .map((x) => x.l);
    } else {
      // ✅ Post-tri pour appliquer la priorité de pack (la DB ne peut pas faire ce tri)
      listings = listings
        .map(l => ({ l, priority: getListingPriority(l) }))
        .sort((a, b) => {
          // Priorité décroissante
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          return 0; // Garder l'ordre de la DB pour le reste
        })
        .map(x => x.l);
    }

    // ✅ Ajouter le badge agence et mapHighlight si disponible
    listings = listings.map(listing => {
      const agencyIdStr = listing.agencyId?.toString ? listing.agencyId.toString() : String(listing.agencyId || "");
      const agency = agencies.find(a => a._id?.toString() === agencyIdStr);
      if (agency) {
        const pack: PackType = agency.subscription?.pack || "FREE";
        const config = getPackConfig(pack);
        return {
          ...listing,
          agencyBadge: config.features.badge,
          agencyPack: pack,
          mapHighlight: config.mapHighlight, // ✅ Pour mise en avant sur la carte (PRO/PREMIUM)
        };
      }
      return listing;
    });

    return NextResponse.json({
      listings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
