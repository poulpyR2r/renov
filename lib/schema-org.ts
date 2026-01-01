/**
 * Génère les données structurées Schema.org pour une annonce immobilière
 */
export function generateListingSchema(listing: {
  _id: string;
  title: string;
  description: string;
  price?: number;
  currency?: string;
  surface?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: {
    city: string;
    postalCode?: string;
    department?: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  propertyType: string;
  images?: string[];
  url: string;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://renovscout.fr";
  const listingUrl = listing.url || `${BASE_URL}/l/${listing._id}`;

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.description,
    url: listingUrl,
    image: listing.images?.slice(0, 5).map((img) =>
      img.startsWith("http") ? img : `${BASE_URL}${img}`
    ) || [],
  };

  // Offer
  if (listing.price) {
    schema.offers = {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: listing.currency || "EUR",
      availability: "https://schema.org/InStock",
      url: listingUrl,
    };
  }

  // Address
  if (listing.location) {
    schema.address = {
      "@type": "PostalAddress",
      addressLocality: listing.location.city,
      postalCode: listing.location.postalCode,
      addressRegion: listing.location.department,
      streetAddress: listing.location.address,
      addressCountry: "FR",
    };
  }

  // GeoCoordinates
  if (listing.location?.coordinates) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: listing.location.coordinates.lat,
      longitude: listing.location.coordinates.lng,
    };
  }

  // Property details
  const propertyDetails: any = {};

  if (listing.surface) {
    propertyDetails.floorSize = {
      "@type": "QuantitativeValue",
      value: listing.surface,
      unitCode: "MTK", // m²
    };
  }

  if (listing.rooms) {
    propertyDetails.numberOfRooms = {
      "@type": "QuantitativeValue",
      value: listing.rooms,
    };
  }

  if (listing.bedrooms) {
    propertyDetails.numberOfBedrooms = {
      "@type": "QuantitativeValue",
      value: listing.bedrooms,
    };
  }

  if (listing.bathrooms) {
    propertyDetails.numberOfBathroomsTotal = {
      "@type": "QuantitativeValue",
      value: listing.bathrooms,
    };
  }

  // Property type mapping
  const propertyTypeMap: Record<string, string> = {
    house: "SingleFamilyResidence",
    apartment: "Apartment",
    land: "Landform",
    commercial: "CommercialProperty",
  };

  const schemaType =
    propertyTypeMap[listing.propertyType.toLowerCase()] || "RealEstateListing";

  schema["@type"] = schemaType;

  // Add property details if any
  if (Object.keys(propertyDetails).length > 0) {
    Object.assign(schema, propertyDetails);
  }

  // Date published
  if (listing.createdAt) {
    schema.datePosted = new Date(listing.createdAt).toISOString();
  }

  return schema;
}

/**
 * Génère le BreadcrumbList Schema.org
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
