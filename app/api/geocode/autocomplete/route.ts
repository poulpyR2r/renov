import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geocode/autocomplete
 * Autocomplétion d'adresses françaises
 * Utilise l'API Adresse de la Base Adresse Nationale (BAN)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Utiliser l'API Adresse de la BAN (Base Adresse Nationale)
    // Documentation: https://adresse.data.gouv.fr/api-doc/adresse
    const banUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
      query
    )}&limit=${limit}&country=France`;

    try {
      const response = await fetch(banUrl);
      const data = await response.json();

      if (data.features && Array.isArray(data.features)) {
        const suggestions = data.features.map((feature: any) => {
          const props = feature.properties;
          const geometry = feature.geometry;

          return {
            label: props.label,
            city: props.city,
            postalCode: props.postcode,
            department: props.context?.split(",")[0]?.trim() || "",
            address: props.name || "",
            coordinates: geometry?.coordinates
              ? {
                  lng: geometry.coordinates[0],
                  lat: geometry.coordinates[1],
                }
              : undefined,
            type: props.type, // "housenumber", "street", "locality", "municipality"
          };
        });

        return NextResponse.json({ suggestions });
      }

      return NextResponse.json({ suggestions: [] });
    } catch (error) {
      console.error("Error fetching from BAN API:", error);
      // Fallback sur Nominatim si BAN échoue
      return await fallbackNominatim(query, limit);
    }
  } catch (error) {
    console.error("Error in autocomplete:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'autocomplétion" },
      { status: 500 }
    );
  }
}

/**
 * Fallback sur Nominatim si l'API BAN échoue
 */
async function fallbackNominatim(
  query: string,
  limit: number
): Promise<NextResponse> {
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=${limit}&countrycodes=fr&addressdetails=1`;

    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "Maisons à Rénover/1.0",
      },
    });

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const suggestions = data.map((item: any) => {
        const addr = item.address || {};
        return {
          label: item.display_name,
          city:
            addr.city || addr.town || addr.village || addr.municipality || "",
          postalCode: addr.postcode || "",
          department: addr.state || "",
          address: item.name || "",
          coordinates:
            item.lat && item.lon
              ? {
                  lat: parseFloat(item.lat),
                  lng: parseFloat(item.lon),
                }
              : undefined,
          type: item.type || "unknown",
        };
      });

      return NextResponse.json({ suggestions });
    }

    return NextResponse.json({ suggestions: [] });
  } catch (error) {
    console.error("Error with Nominatim fallback:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
