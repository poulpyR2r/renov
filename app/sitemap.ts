import { MetadataRoute } from "next";
import { getListingModel } from "@/models/Listing";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://renovscout.fr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [];

  // Page d'accueil
  urls.push({
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  });

  // Page de recherche
  urls.push({
    url: `${BASE_URL}/search`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  });

  // Pages d'annonces actives (limite à 10 000 pour éviter un sitemap trop gros)
  try {
    const Listing = await getListingModel();
    const listings = await Listing.find({
      status: "active",
    })
      .sort({ updatedAt: -1 })
      .limit(10000)
      .select({ _id: 1, updatedAt: 1, createdAt: 1 })
      .toArray();

    listings.forEach((listing) => {
      urls.push({
        url: `${BASE_URL}/l/${listing._id?.toString()}`,
        lastModified: listing.updatedAt || listing.createdAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });
  } catch (error) {
    console.error("Error generating sitemap for listings:", error);
  }

  // Pages locales (villes et départements) - génération dynamique
  try {
    const Listing = await getListingModel();
    
    // Récupérer toutes les villes uniques avec des annonces actives
    const cities = await Listing.distinct("location.city", {
      status: "active",
      "location.city": { $exists: true, $ne: "" },
    });

    // Récupérer tous les départements uniques avec des annonces actives
    const departments = await Listing.distinct("location.department", {
      status: "active",
      "location.department": { $exists: true, $ne: "" },
    });

    // Ajouter les pages villes (limite à 500 pour éviter un sitemap trop gros)
    cities.slice(0, 500).forEach((city) => {
      if (city && typeof city === "string") {
        const citySlug = city.toLowerCase().replace(/\s+/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        urls.push({
          url: `${BASE_URL}/maisons-a-renover/${citySlug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    });

    // Ajouter les pages départements
    departments.forEach((dept) => {
      if (dept && typeof dept === "string") {
        const deptSlug = dept.toLowerCase().replace(/\s+/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        urls.push({
          url: `${BASE_URL}/maisons-a-renover/${deptSlug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    });
  } catch (error) {
    console.error("Error generating sitemap for local pages:", error);
  }

  // Pages légales
  urls.push({
    url: `${BASE_URL}/legal`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.3,
  });

  urls.push({
    url: `${BASE_URL}/privacy`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.3,
  });

  urls.push({
    url: `${BASE_URL}/terms`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.3,
  });

  return urls;
}
