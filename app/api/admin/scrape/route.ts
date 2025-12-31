import { type NextRequest, NextResponse } from "next/server";
import { getListingModel } from "@/models/Listing";
import { scrapeLeboncoin } from "@/lib/scrapers/leboncoin-scraper";
import { requireAdmin } from "@/lib/admin";

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const body = await request.json();
    const { sources, searchParams } = body;

    console.log("admin/scrape: sources", sources, "searchParams", {
      url: searchParams?.url,
      location: searchParams?.location,
      propertyType: searchParams?.propertyType,
      maxPrice: searchParams?.maxPrice,
      lat: searchParams?.lat,
      lng: searchParams?.lng,
      radius: searchParams?.radius,
      immoSellType: searchParams?.immoSellType,
      globalCondition: searchParams?.globalCondition,
      countryWide: searchParams?.countryWide,
    });

    const allListings: any[] = [];
    const stats = {
      total: 0,
      added: 0,
      skipped: 0,
      errors: 0,
    };

    if (
      sources.includes("leboncoin") ||
      sources.includes("seloger") ||
      sources.includes("pap")
    ) {
      let listings: any[] = [];

      if (searchParams?.countryWide) {
        // Centres approximatifs pour couvrir la France métropolitaine
        const centers = [
          { lat: 48.8566, lng: 2.3522 }, // Paris
          { lat: 45.764, lng: 4.8357 }, // Lyon
          { lat: 43.2965, lng: 5.3698 }, // Marseille
          { lat: 43.6047, lng: 1.4442 }, // Toulouse
          { lat: 43.7102, lng: 7.262 }, // Nice
          { lat: 47.2184, lng: -1.5536 }, // Nantes
          { lat: 44.8378, lng: -0.5792 }, // Bordeaux
          { lat: 50.6292, lng: 3.0573 }, // Lille
          { lat: 48.1173, lng: -1.6778 }, // Rennes
          { lat: 48.5734, lng: 7.7521 }, // Strasbourg
          { lat: 43.6108, lng: 3.8767 }, // Montpellier
          { lat: 49.2583, lng: 4.0317 }, // Reims
          { lat: 45.1885, lng: 5.7245 }, // Grenoble
          { lat: 43.1242, lng: 5.928 }, // Toulon
          { lat: 45.4397, lng: 4.3872 }, // Saint-Étienne
          { lat: 47.322, lng: 5.0415 }, // Dijon
          { lat: 47.9025, lng: 1.909 }, // Orléans
          { lat: 45.7772, lng: 3.087 }, // Clermont-Ferrand
          { lat: 46.5802, lng: 0.3404 }, // Poitiers
          { lat: 49.8941, lng: 2.2958 }, // Amiens
          { lat: 47.466, lng: -0.552 }, // Angers
          { lat: 47.2378, lng: 6.0241 }, // Besançon
          { lat: 47.7486, lng: 7.3359 }, // Mulhouse
          { lat: 50.9513, lng: 1.8587 }, // Calais
        ];
        const radius = searchParams?.radius ?? 50000; // 50 km par centre

        // Valeurs par défaut utiles pour la détection rénovation
        const baseParams = {
          ...searchParams,
          url: undefined,
          immoSellType: searchParams?.immoSellType ?? "old",
          globalCondition: searchParams?.globalCondition ?? "4,5,3",
        };

        const dedup = new Set<string>();
        for (const c of centers) {
          const chunk = await scrapeLeboncoin({
            ...baseParams,
            lat: c.lat,
            lng: c.lng,
            radius,
          });
          // Déduplication mémoire par fingerprint
          for (const l of chunk) {
            if (!dedup.has(l.fingerprint)) {
              listings.push(l);
              dedup.add(l.fingerprint);
            }
          }
        }
        console.log(
          "admin/scrape: leboncoin countryWide aggregated",
          listings.length
        );
      } else {
        listings = await scrapeLeboncoin(searchParams || {});
        console.log(
          "admin/scrape: leboncoin returned",
          listings.length,
          "listings"
        );
      }

      const Listing = await getListingModel();

      for (const listing of listings) {
        try {
          const existing = await Listing.findOne({
            fingerprint: listing.fingerprint,
          });

          if (!existing) {
            await Listing.insertOne(listing as any);
            stats.added++;
            allListings.push(listing);
          } else {
            stats.skipped++;
          }

          stats.total++;
        } catch (error: any) {
          console.error("Error inserting listing:", error);
          stats.errors++;
        }
      }
    }

    console.log("admin/scrape: stats", stats);

    return NextResponse.json({
      success: true,
      stats,
      listings: allListings.slice(0, 10),
    });
  } catch (error: any) {
    console.error("Scrape error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
