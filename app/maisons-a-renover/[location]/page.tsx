export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalider toutes les heures

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ListingCard } from "@/components/listing-card";
import { Card, CardContent } from "@/components/ui/card";
import { getListingModel } from "@/models/Listing";
import { getLocalPageMetadata } from "@/lib/seo";
import Link from "next/link";
import { MapPin, Home, ArrowRight } from "lucide-react";

// Mapping des départements français (code -> nom)
const DEPARTMENTS: Record<string, string> = {
  "01": "Ain",
  "02": "Aisne",
  "03": "Allier",
  "04": "Alpes-de-Haute-Provence",
  "05": "Hautes-Alpes",
  "06": "Alpes-Maritimes",
  "07": "Ardèche",
  "08": "Ardennes",
  "09": "Ariège",
  "10": "Aube",
  "11": "Aude",
  "12": "Aveyron",
  "13": "Bouches-du-Rhône",
  "14": "Calvados",
  "15": "Cantal",
  "16": "Charente",
  "17": "Charente-Maritime",
  "18": "Cher",
  "19": "Corrèze",
  "21": "Côte-d'Or",
  "22": "Côtes-d'Armor",
  "23": "Creuse",
  "24": "Dordogne",
  "25": "Doubs",
  "26": "Drôme",
  "27": "Eure",
  "28": "Eure-et-Loir",
  "29": "Finistère",
  "2A": "Corse-du-Sud",
  "2B": "Haute-Corse",
  "30": "Gard",
  "31": "Haute-Garonne",
  "32": "Gers",
  "33": "Gironde",
  "34": "Hérault",
  "35": "Ille-et-Vilaine",
  "36": "Indre",
  "37": "Indre-et-Loire",
  "38": "Isère",
  "39": "Jura",
  "40": "Landes",
  "41": "Loir-et-Cher",
  "42": "Loire",
  "43": "Haute-Loire",
  "44": "Loire-Atlantique",
  "45": "Loiret",
  "46": "Lot",
  "47": "Lot-et-Garonne",
  "48": "Lozère",
  "49": "Maine-et-Loire",
  "50": "Manche",
  "51": "Marne",
  "52": "Haute-Marne",
  "53": "Mayenne",
  "54": "Meurthe-et-Moselle",
  "55": "Meuse",
  "56": "Morbihan",
  "57": "Moselle",
  "58": "Nièvre",
  "59": "Nord",
  "60": "Oise",
  "61": "Orne",
  "62": "Pas-de-Calais",
  "63": "Puy-de-Dôme",
  "64": "Pyrénées-Atlantiques",
  "65": "Hautes-Pyrénées",
  "66": "Pyrénées-Orientales",
  "67": "Bas-Rhin",
  "68": "Haut-Rhin",
  "69": "Rhône",
  "70": "Haute-Saône",
  "71": "Saône-et-Loire",
  "72": "Sarthe",
  "73": "Savoie",
  "74": "Haute-Savoie",
  "75": "Paris",
  "76": "Seine-Maritime",
  "77": "Seine-et-Marne",
  "78": "Yvelines",
  "79": "Deux-Sèvres",
  "80": "Somme",
  "81": "Tarn",
  "82": "Tarn-et-Garonne",
  "83": "Var",
  "84": "Vaucluse",
  "85": "Vendée",
  "86": "Vienne",
  "87": "Haute-Vienne",
  "88": "Vosges",
  "89": "Yonne",
  "90": "Territoire de Belfort",
  "91": "Essonne",
  "92": "Hauts-de-Seine",
  "93": "Seine-Saint-Denis",
  "94": "Val-de-Marne",
  "95": "Val-d'Oise",
};

// Fonction pour normaliser un slug (retirer les accents, convertir en minuscules, remplacer espaces par tirets)
function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// Fonction pour trouver une ville ou un département par son slug
async function findLocationBySlug(slug: string): Promise<{
  type: "city" | "department";
  name: string;
  originalName: string;
} | null> {
  const Listing = await getListingModel();

  // Chercher d'abord dans les villes
  const cities = await Listing.distinct("location.city", {
    status: "active",
    "location.city": { $exists: true, $ne: "" },
  });

  for (const city of cities) {
    if (city && typeof city === "string") {
      const citySlug = normalizeSlug(city);
      if (citySlug === slug) {
        return { type: "city", name: city, originalName: city };
      }
    }
  }

  // Chercher dans les départements
  const departments = await Listing.distinct("location.department", {
    status: "active",
    "location.department": { $exists: true, $ne: "" },
  });

  for (const dept of departments) {
    if (dept && typeof dept === "string") {
      const deptSlug = normalizeSlug(dept);
      if (deptSlug === slug) {
        // Vérifier si c'est un code département (ex: "75", "13")
        const deptName = DEPARTMENTS[dept] || dept;
        return { type: "department", name: deptName, originalName: dept };
      }
    }
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>;
}): Promise<Metadata> {
  const { location } = await params;
  const locationData = await findLocationBySlug(location);

  if (!locationData) {
    return {
      title: "Page non trouvée",
      robots: { index: false, follow: false },
    };
  }

  const Listing = await getListingModel();
  let count = 0;

  try {
    if (locationData.type === "city") {
      count = await Listing.countDocuments({
        status: "active",
        "location.city": locationData.originalName,
      });
    } else {
      count = await Listing.countDocuments({
        status: "active",
        "location.department": locationData.originalName,
      });
    }
  } catch (error) {
    console.error("Error counting listings:", error);
  }

  return getLocalPageMetadata({
    type: locationData.type,
    name: locationData.name,
    count,
  });
}

export default async function LocalPage({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  const { location } = await params;
  const locationData = await findLocationBySlug(location);

  if (!locationData) {
    notFound();
  }

  const Listing = await getListingModel();
  let listings: any[] = [];

  try {
    const query: any = { status: "active" };

    if (locationData.type === "city") {
      query["location.city"] = locationData.originalName;
    } else {
      query["location.department"] = locationData.originalName;
    }

    listings = await Listing.find(query)
      .sort({ createdAt: -1 })
      .limit(24)
      .toArray();

    // Sérialiser les objets MongoDB
    listings = listings.map((listing: any) => ({
      ...listing,
      _id: listing._id.toString(),
      createdAt: listing.createdAt?.toISOString?.() || listing.createdAt,
      updatedAt: listing.updatedAt?.toISOString?.() || listing.updatedAt,
      publishedAt: listing.publishedAt?.toISOString?.() || listing.publishedAt,
    }));
  } catch (error) {
    console.error("Error fetching listings:", error);
  }

  const locationText =
    locationData.type === "city"
      ? `à ${locationData.name}`
      : `dans le ${locationData.name}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 px-4 overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50/50 to-teal-50/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm mb-6">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  {locationData.type === "city" ? "Ville" : "Département"}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Maisons à rénover {locationText}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Découvrez les opportunités de biens immobiliers à rénover{" "}
                {locationText}. Maisons anciennes avec travaux, appartements à
                rénover, investissement immobilier avec fort potentiel.
              </p>
            </div>
          </div>
        </section>

        {/* SEO Content Section */}
        <section className="py-12 px-4 bg-white">
          <div className="container mx-auto max-w-4xl">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 md:p-8">
                <div className="prose prose-sm md:prose-base max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">
                      Maisons à rénover {locationText}
                    </strong>
                    : découvrez les opportunités de biens immobiliers à fort
                    potentiel {locationText}. Que vous cherchiez une{" "}
                    <strong className="text-foreground">
                      maison ancienne à rénover
                    </strong>
                    , un{" "}
                    <strong className="text-foreground">
                      appartement avec travaux
                    </strong>
                    , ou un{" "}
                    <strong className="text-foreground">
                      bien pour investissement
                    </strong>
                    , notre sélection de biens à rénover {locationText} vous
                    permet de trouver la perle rare. Les biens présentés
                    nécessitent des travaux de rénovation (électricité,
                    plomberie, isolation, ravalement...) et offrent un excellent
                    rapport qualité-prix pour votre projet immobilier.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Listings Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            {listings.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold">
                    {listings.length} annonce{listings.length > 1 ? "s" : ""}{" "}
                    disponible{listings.length > 1 ? "s" : ""}
                  </h2>
                  <Link
                    href={`/search?${locationData.type === "city" ? `cities=${encodeURIComponent(locationData.originalName)}` : `departments=${encodeURIComponent(locationData.originalName)}`}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    Voir toutes les annonces
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((listing) => (
                    <ListingCard key={listing._id} listing={listing} />
                  ))}
                </div>
              </>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                    <Home className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Aucune annonce disponible {locationText}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Il n'y a actuellement aucune annonce de bien à rénover{" "}
                    {locationText}. Revenez bientôt pour découvrir de nouvelles
                    opportunités.
                  </p>
                  <Link href="/search">
                    <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                      Voir toutes les annonces
                    </button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
