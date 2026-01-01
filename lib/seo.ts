import { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://renovscout.fr";
const SITE_NAME = "Maisons à Rénover";
const DEFAULT_DESCRIPTION =
  "Trouvez votre bien à rénover en France. Recherche d'annonces immobilières à rénover : maisons, appartements, investissement immobilier.";

/**
 * Génère les metadata SEO de base
 */
export function generateMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  noindex = false,
  images,
}: {
  title: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  images?: string[];
}): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical || BASE_URL;
  const imageUrl = images?.[0] ? `${BASE_URL}${images[0]}` : undefined;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : [],
      locale: "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
      },
    },
  };
}

/**
 * Génère le titre SEO pour la page home
 */
export function getHomeMetadata(): Metadata {
  return generateMetadata({
    title: "Maisons à rénover en France",
    description:
      "Trouvez votre maison à rénover en France. Recherche d'annonces immobilières à rénover : maisons anciennes, appartements à rénover, biens avec travaux. Filtres avancés pour trouver la perle rare.",
    canonical: BASE_URL,
  });
}

/**
 * Génère le titre SEO pour une page de recherche
 */
export function getSearchMetadata({
  location,
  count,
}: {
  location?: string;
  count?: number;
}): Metadata {
  if (location) {
    return generateMetadata({
      title: `Maisons à rénover à ${location} – Annonces immobilières`,
      description: `Découvrez les maisons à rénover à ${location}. Recherche d'annonces immobilières à rénover avec filtres avancés. Trouvez votre bien avec travaux à ${location}.`,
      canonical: `${BASE_URL}/search${
        location ? `?cities=${encodeURIComponent(location)}` : ""
      }`,
    });
  }

  return generateMetadata({
    title: "Recherche de maisons à rénover en France",
    description:
      "Recherche avancée de maisons à rénover en France. Filtres par ville, prix, surface, travaux nécessaires. Trouvez votre bien à rénover avec notre moteur de recherche.",
    canonical: `${BASE_URL}/search`,
  });
}

/**
 * Génère le titre SEO pour une page de détail d'annonce
 */
export function getListingMetadata({
  title: listingTitle,
  city,
  price,
  surface,
  id,
}: {
  title: string;
  city: string;
  price?: number;
  surface?: number;
  id: string;
}): Metadata {
  const priceStr = price ? `${price.toLocaleString("fr-FR")}€` : "";
  const surfaceStr = surface ? `${surface}m²` : "";
  // Format SEO optimisé : "Maison à rénover {surface} m² à {ville} – {prix} €"
  const seoTitle = `Maison à rénover${
    surfaceStr ? ` ${surfaceStr}` : ""
  } à ${city}${priceStr ? ` – ${priceStr}` : ""}`;

  return generateMetadata({
    title: seoTitle,
    description: `${listingTitle} à ${city}. ${
      surface ? `Surface : ${surface}m². ` : ""
    }${
      price ? `Prix : ${price.toLocaleString("fr-FR")}€. ` : ""
    }Bien immobilier à rénover avec travaux. Découvrez cette annonce de maison à rénover sur Maisons à Rénover.`,
    canonical: `${BASE_URL}/l/${id}`,
  });
}

/**
 * Génère le titre SEO pour une page locale (ville/département)
 */
export function getLocalPageMetadata({
  type,
  name,
  count,
}: {
  type: "city" | "department";
  name: string;
  count?: number;
}): Metadata {
  const countText = count ? `${count} annonces` : "Annonces";
  const locationText = type === "city" ? `à ${name}` : `dans le ${name}`;

  return generateMetadata({
    title: `Maisons à rénover ${locationText} | ${countText}`,
    description: `Découvrez les maisons à rénover ${locationText}. ${countText} de biens immobiliers à rénover ${locationText}. Recherche de maisons anciennes avec travaux, investissement immobilier.`,
    canonical: `${BASE_URL}/maisons-a-renover/${
      type === "city"
        ? name.toLowerCase().replace(/\s+/g, "-")
        : name.toLowerCase()
    }`,
  });
}
