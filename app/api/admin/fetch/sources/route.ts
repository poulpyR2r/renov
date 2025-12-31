import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getListingModel } from "@/models/Listing";
import { dbConnect } from "@/lib/mongodb";

// Define your scraping sources here
const SOURCES = [
  {
    id: "leboncoin",
    name: "Le Bon Coin",
    url: "https://www.leboncoin.fr",
    enabled: true,
  },
  {
    id: "seloger",
    name: "SeLoger",
    url: "https://www.seloger.com",
    enabled: true,
  },
  {
    id: "pap",
    name: "PAP",
    url: "https://www.pap.fr",
    enabled: true,
  },
  {
    id: "bienici",
    name: "Bien'ici",
    url: "https://www.bienici.com",
    enabled: true,
  },
];

export async function GET() {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const Listing = await getListingModel();
    const db = await dbConnect();

    // Get stats for each source
    const sourcesWithStats = await Promise.all(
      SOURCES.map(async (source) => {
        const totalListings = await Listing.countDocuments({
          sourceId: source.id,
        });

        // Get last fetch job for this source
        const lastJob = await db
          .collection("fetchJobs")
          .findOne(
            { sourceId: source.id, status: "completed" },
            { sort: { completedAt: -1 } }
          );

        return {
          ...source,
          totalListings,
          lastFetch: lastJob?.completedAt,
        };
      })
    );

    return NextResponse.json({ success: true, sources: sourcesWithStats });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

