import type { Listing } from "@/lib/types";
import { detectRenovationNeed } from "@/lib/renovation-detector";
import { generateFingerprint } from "@/lib/deduplication";
import * as cheerio from "cheerio";

type PropertyType =
  | "house"
  | "apartment"
  | "building"
  | "land"
  | "commercial"
  | "other";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const REAL_ESTATE_TYPE_MAP: Record<PropertyType, number | undefined> = {
  house: 1, // Maison
  apartment: 2, // Appartement
  building: 5, // Autre (faute de mieux)
  land: 3,
  commercial: undefined,
  other: undefined,
};

function mapIncomingPropertyType(value?: string): PropertyType | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (v.includes("house") || v.includes("maison")) return "house";
  if (v.includes("apartment") || v.includes("appartement")) return "apartment";
  if (v.includes("building") || v.includes("immeuble")) return "building";
  if (v.includes("land") || v.includes("terrain")) return "land";
  return "other";
}

function buildSearchUrl(params: {
  location?: string;
  propertyType?: PropertyType;
  maxPrice?: number;
  lat?: number;
  lng?: number;
  radius?: number;
  immoSellType?: "old" | "new";
  globalCondition?: number[] | string;
}): string {
  const base = new URL("https://www.leboncoin.fr/recherche");
  // Catégorie "Ventes immobilières" (valeur courante côté LBC)
  base.searchParams.set("category", "9");

  if (params.location) {
    // LBC accepte différents formats pour `locations`. On passe le libellé brut,
    // ce qui fonctionne pour les grandes villes/départements/régions.
    base.searchParams.append("locations", params.location);
  }

  const realEstateType = params.propertyType
    ? REAL_ESTATE_TYPE_MAP[params.propertyType]
    : undefined;
  if (realEstateType) {
    base.searchParams.set("real_estate_type", String(realEstateType));
  }

  if (params.maxPrice && params.maxPrice > 0) {
    base.searchParams.set("price", `0-${params.maxPrice}`);
  }

  if (
    typeof params.lat === "number" &&
    typeof params.lng === "number" &&
    typeof params.radius === "number"
  ) {
    base.searchParams.set("lat", String(params.lat));
    base.searchParams.set("lng", String(params.lng));
    base.searchParams.set("radius", String(params.radius));
  }

  if (params.immoSellType === "old" || params.immoSellType === "new") {
    base.searchParams.set("immo_sell_type", params.immoSellType);
  }

  if (params.globalCondition) {
    const value = Array.isArray(params.globalCondition)
      ? params.globalCondition.join(",")
      : String(params.globalCondition);
    base.searchParams.set("global_condition", value);
  }

  // Tri par pertinence ou récent; on laisse par défaut (pertinence)
  return base.toString();
}

function parseSearchParamsFromUrl(raw?: string): {
  lat?: number;
  lng?: number;
  radius?: number;
  realEstateType?: number;
  immoSellType?: "old" | "new";
  globalCondition?: string;
} {
  try {
    if (!raw) return {};
    const u = new URL(raw);
    if (!u.hostname.includes("leboncoin.fr")) return {};
    const lat = u.searchParams.get("lat");
    const lng = u.searchParams.get("lng");
    const radius = u.searchParams.get("radius");
    const ret = u.searchParams.get("real_estate_type");
    const immoSellType = u.searchParams.get("immo_sell_type") as
      | "old"
      | "new"
      | null;
    const globalCondition = u.searchParams.get("global_condition") || undefined;
    return {
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      radius: radius ? Number(radius) : undefined,
      realEstateType: ret ? Number(ret) : undefined,
      immoSellType:
        immoSellType === "old" || immoSellType === "new"
          ? immoSellType
          : undefined,
      globalCondition,
    };
  } catch {
    return {};
  }
}

function parseNextData(html: string): any | null {
  try {
    const $ = cheerio.load(html);
    const script = $("#__NEXT_DATA__")?.text();
    if (!script) return null;
    const json = JSON.parse(script);
    return json;
  } catch {
    return null;
  }
}

function getBrowserLikeHeaders(): Record<string, string> {
  return {
    "user-agent": USER_AGENT,
    "accept-language": "fr-FR,fr;q=0.9,en;q=0.8",
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    connection: "keep-alive",
    referer: "https://www.leboncoin.fr/recherche?category=9",
    "upgrade-insecure-requests": "1",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-ch-ua":
      '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    "sec-ch-ua-platform": '"Windows"',
    "sec-ch-ua-mobile": "?0",
  };
}

function coerceNumber(value: any): number | undefined {
  if (value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function resolvePropertyTypeFromAd(ad: any): PropertyType {
  const label: string =
    ad?.attributes?.real_estate_type ||
    ad?.real_estate_type ||
    ad?.category_name ||
    ad?.categoryLabel ||
    ad?.category ||
    "";
  const lower = String(label).toLowerCase();
  if (lower.includes("maison")) return "house";
  if (lower.includes("appartement")) return "apartment";
  if (
    lower.includes("immeuble") ||
    lower.includes("bâtiment") ||
    lower.includes("batiment")
  )
    return "building";
  if (lower.includes("terrain")) return "land";
  return "other";
}

function extractImages(ad: any): string[] {
  const results = new Set<string>();
  const images = ad?.images || ad?.pictures || ad?.photos || ad?.image;

  if (Array.isArray(images)) {
    for (const img of images) {
      if (typeof img === "string") {
        results.add(img);
      } else if (img?.url) {
        results.add(img.url);
      } else if (img?.urls) {
        const urls = Object.values(img.urls).filter(
          (u: any) => typeof u === "string"
        ) as string[];
        urls.forEach((u) => results.add(u));
      } else if (img?.small_url) {
        results.add(img.small_url);
      }
    }
  } else if (images?.urls) {
    const urls = Object.values(images.urls).filter(
      (u: any) => typeof u === "string"
    ) as string[];
    urls.forEach((u) => results.add(u));
  } else if (typeof images === "string") {
    results.add(images);
  }

  return Array.from(results);
}

function extractFromQueriesArray(nextData: any): any[] {
  // Structure courante: json.props.pageProps.dehydratedState.queries[*].state.data.ads
  const queries = nextData?.props?.pageProps?.dehydratedState?.queries;
  if (!Array.isArray(queries)) return [];
  for (const q of queries) {
    const maybeAds =
      q?.state?.data?.ads ||
      q?.state?.data?.adSearch?.ads ||
      q?.state?.data?.ad_list ||
      q?.state?.data?.results ||
      q?.data?.ads;
    if (Array.isArray(maybeAds) && maybeAds.length > 0) {
      return maybeAds;
    }
  }
  return [];
}

function inferPropertyTypeFromText(text: string): PropertyType {
  const lower = text.toLowerCase();
  if (lower.includes("maison")) return "house";
  if (lower.includes("appartement")) return "apartment";
  if (
    lower.includes("immeuble") ||
    lower.includes("bâtiment") ||
    lower.includes("batiment")
  )
    return "building";
  if (lower.includes("terrain")) return "land";
  return "other";
}

function parsePriceFromText(text: string): number | undefined {
  const match = text.replace(/\s/g, "").match(/(\d{2,})€/);
  if (match) {
    const n = Number(match[1]);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function coerceNumberFromString(value: any): number | undefined {
  if (value == null) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const m = value.replace(/\s/g, "").match(/-?\d+([.,]\d+)?/);
  if (!m) return undefined;
  const parsed = Number(m[0].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractMetricsFromAttributes(attributes: any): {
  surface?: number;
  rooms?: number;
  bedrooms?: number;
} {
  const result: { surface?: number; rooms?: number; bedrooms?: number } = {};
  if (!attributes) return result;
  if (Array.isArray(attributes)) {
    for (const item of attributes) {
      const key = String(item?.key || "").toLowerCase();
      const label = String(item?.label || "").toLowerCase();
      const num = coerceNumberFromString(item?.value);

      if (
        !result.surface &&
        (key.includes("square") ||
          key.includes("surface") ||
          key.includes("living_area") ||
          label.includes("m²") ||
          label.includes("m2") ||
          label.includes("surface")) &&
        num != null
      ) {
        result.surface = num;
      }
      if (
        !result.rooms &&
        (key.includes("rooms") ||
          key.includes("nb_rooms") ||
          label.includes("pièce")) &&
        num != null
      ) {
        result.rooms = num;
      }
      if (
        !result.bedrooms &&
        (key.includes("bedrooms") ||
          key.includes("nb_bedrooms") ||
          label.includes("chambre")) &&
        num != null
      ) {
        result.bedrooms = num;
      }
    }
  } else if (typeof attributes === "object") {
    const surface =
      coerceNumber(attributes.surface) ??
      coerceNumber(attributes.square) ??
      coerceNumber(attributes.living_area);
    if (surface != null) result.surface = surface;

    const rooms =
      coerceNumber(attributes.rooms) ??
      coerceNumber(attributes.nb_rooms) ??
      coerceNumber(attributes.num_rooms);
    if (rooms != null) result.rooms = rooms;

    const bedrooms =
      coerceNumber(attributes.bedrooms) ??
      coerceNumber(attributes.nb_bedrooms) ??
      coerceNumber(attributes.num_bedrooms);
    if (bedrooms != null) result.bedrooms = bedrooms;
  }
  return result;
}

function extractMetricsFromHtml(html: string): {
  surface?: number;
  rooms?: number;
  bedrooms?: number;
} {
  const $ = cheerio.load(html);
  const text = $("body").text().toLowerCase().replace(/\s+/g, " ");
  const surfaceMatch = text.match(/(\d{2,4})\s*m(?:²|2)\b/);
  const surface = surfaceMatch ? Number(surfaceMatch[1]) : undefined;
  const roomsMatch = text.match(/(\d{1,2})\s*(?:pi[eè]ce|p)\b/);
  const rooms = roomsMatch ? Number(roomsMatch[1]) : undefined;
  const bedroomsMatch = text.match(/(\d{1,2})\s*chambre/);
  const bedrooms = bedroomsMatch ? Number(bedroomsMatch[1]) : undefined;
  return { surface, rooms, bedrooms };
}

function fallbackExtractListingsFromHtml(html: string): Array<{
  id: string;
  title?: string;
  description?: string;
  price?: number;
  city?: string;
  region?: string;
  department?: string;
  images?: string[];
  url: string;
  propertyType?: PropertyType;
}> {
  const $ = cheerio.load(html);
  const results: Array<{
    id: string;
    title?: string;
    description?: string;
    price?: number;
    city?: string;
    region?: string;
    department?: string;
    images?: string[];
    url: string;
    propertyType?: PropertyType;
  }> = [];

  // Cherche les liens d’annonce
  const links = new Set<string>();
  $('a[href*="/vi/"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    if (href.includes("/vi/")) {
      links.add(href);
    }
  });
  $('a[href^="/ad/"], a[href*="/ad/"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    if (href.includes("/ad/")) {
      links.add(href);
    }
  });

  for (const href of links) {
    const absoluteUrl = href.startsWith("http")
      ? href
      : `https://www.leboncoin.fr${href}`;
    // ID dans /vi/{id}.htm ou trailing numérique sur /ad/...
    let id = href;
    const idMatchVi = href.match(/\/vi\/(\d+)\.htm/);
    const idMatchAd = href.match(/\/(\d{6,})[^/]*$/);
    if (idMatchVi?.[1]) id = idMatchVi[1];
    else if (idMatchAd?.[1]) id = idMatchAd[1];

    // Conteneur probable (article, li, parent)
    const node = $(`a[href="${href}"]`).first();
    const container = node.closest("article").length
      ? node.closest("article")
      : node.closest("li");

    // Titre
    const title =
      node.attr("title") ||
      node.attr("aria-label") ||
      (container.text() || "")
        .trim()
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)[0];

    // Prix
    let price: number | undefined;
    // Essaye data-qa-id connus, sinon regex brute
    const priceNode = container
      .find('[data-qa-id*="price"], [data-qa-id*="aditem_price"]')
      .first();
    if (priceNode.length) {
      price = parsePriceFromText(priceNode.text());
    }
    if (price == null) {
      price = parsePriceFromText(container.text());
    }

    // Localisation (best-effort)
    const locationNode = container.find('[data-qa-id*="location"]').first();
    const locationText = (locationNode.text() || "").trim();
    const city = locationText.split("(")[0]?.trim() || undefined;

    // Image
    const imgs = new Set<string>();
    container.find("img").each((_, img) => {
      const src = $(img).attr("src") || $(img).attr("data-src");
      if (src) imgs.add(src);
    });

    const propertyType = title ? inferPropertyTypeFromText(title) : "other";

    results.push({
      id,
      title,
      description: undefined,
      price,
      city,
      region: undefined,
      department: undefined,
      images: Array.from(imgs),
      url: absoluteUrl,
      propertyType,
    });
  }

  return results;
}

function findAdObjectInNextData(nextData: any): any | null {
  const pp = nextData?.props?.pageProps;
  if (pp?.ad) return pp.ad;
  if (pp?.listing) return pp.listing;
  const queries = pp?.dehydratedState?.queries;
  if (Array.isArray(queries)) {
    for (const q of queries) {
      const cand =
        q?.state?.data?.ad || q?.state?.data?.adView || q?.state?.data?.ad_view;
      if (cand && (cand.subject || cand.title || cand.description || cand.body))
        return cand;
      const data = q?.state?.data;
      if (data && (data.subject || data.title || data.description || data.body))
        return data;
    }
  }
  return null;
}

function normalizeFromAdObject(ad: any) {
  const id = String(ad?.id ?? ad?.ad_id ?? ad?.list_id ?? "");
  const title: string =
    ad?.subject || ad?.title || ad?.header || ad?.attributes?.title || "";
  const description: string =
    ad?.body || ad?.description || ad?.attributes?.description || "";
  const priceCandidate =
    ad?.price?.[0]?.value ??
    ad?.price?.value ??
    ad?.price ??
    ad?.pricing?.price ??
    ad?.owner?.price;
  const price = coerceNumber(priceCandidate) ?? 0;
  const city: string =
    ad?.location?.city || ad?.location?.city_label || ad?.location?.label || "";
  const department: string =
    ad?.location?.department_name ||
    ad?.location?.department ||
    ad?.location?.department_label ||
    "";
  const region: string =
    ad?.location?.region_name ||
    ad?.location?.region ||
    ad?.location?.region_label ||
    "";
  const lat = coerceNumber(
    ad?.location?.lat ?? ad?.location?.latitude ?? ad?.location?.geo?.lat
  );
  const lng = coerceNumber(
    ad?.location?.lng ?? ad?.location?.longitude ?? ad?.location?.geo?.lng
  );
  const surface =
    coerceNumber(ad?.surface) ??
    coerceNumber(ad?.attributes?.surface) ??
    coerceNumber(ad?.living_area) ??
    undefined;
  const rooms =
    coerceNumber(ad?.rooms) ??
    coerceNumber(ad?.attributes?.rooms) ??
    coerceNumber(ad?.nb_rooms) ??
    undefined;
  const bedrooms =
    coerceNumber(ad?.bedrooms) ??
    coerceNumber(ad?.attributes?.bedrooms) ??
    coerceNumber(ad?.nb_bedrooms) ??
    undefined;

  return {
    id,
    title,
    description,
    price,
    city,
    department,
    region,
    lat,
    lng,
    surface,
    rooms,
    bedrooms,
  };
}

async function fetchDetailAndEnrich(
  candidate: {
    id: string;
    title?: string;
    description?: string;
    price?: number;
    city?: string;
    region?: string;
    department?: string;
    images?: string[];
    url: string;
    propertyType?: PropertyType;
  },
  desiredPropertyType: PropertyType | undefined,
  searchParams: { location?: string; propertyType?: string; maxPrice?: number }
): Promise<Listing | null> {
  try {
    const res = await fetch(candidate.url, {
      cache: "no-store",
      headers: getBrowserLikeHeaders(),
    } as RequestInit);
    if (!res.ok) return null;
    const html = await res.text();
    const nextData = parseNextData(html);
    const ad = nextData ? findAdObjectInNextData(nextData) : null;

    let title = candidate.title || "";
    let description = candidate.description || "";
    let price = candidate.price ?? 0;
    let city = candidate.city || "";
    let department = candidate.department || "";
    let region = candidate.region || "";
    let lat: number | undefined;
    let lng: number | undefined;
    let surface: number | undefined;
    let rooms: number | undefined;
    let bedrooms: number | undefined;
    let images = candidate.images || [];
    let resolvedType = candidate.propertyType || "other";

    if (ad) {
      const n = normalizeFromAdObject(ad);
      title = n.title || title;
      description = n.description || description;
      price = n.price || price;
      city = n.city || city;
      department = n.department || department;
      region = n.region || region;
      lat = n.lat ?? lat;
      lng = n.lng ?? lng;
      surface = n.surface ?? surface;
      rooms = n.rooms ?? rooms;
      bedrooms = n.bedrooms ?? bedrooms;
      resolvedType = resolvePropertyTypeFromAd(ad);
      const detailImages = extractImages(ad);
      if (detailImages.length) images = detailImages;

      // Compléter via attributes (tableau) si présent
      const metrics = extractMetricsFromAttributes(ad?.attributes);
      surface = surface ?? metrics.surface;
      rooms = rooms ?? metrics.rooms;
      bedrooms = bedrooms ?? metrics.bedrooms;
    } else {
      const $ = cheerio.load(html);
      title = $('meta[property="og:title"]').attr("content") || title;
      description =
        $('meta[property="og:description"]').attr("content") || description;
      const metaImg = $('meta[property="og:image"]').attr("content");
      if (metaImg) images = [metaImg, ...images];
    }

    // Fallback HTML si toujours manquants
    if (surface == null || rooms == null || bedrooms == null) {
      const metricsHtml = extractMetricsFromHtml(html);
      surface = surface ?? metricsHtml.surface;
      rooms = rooms ?? metricsHtml.rooms;
      bedrooms = bedrooms ?? metricsHtml.bedrooms;
    }
    if (desiredPropertyType && resolvedType !== desiredPropertyType)
      return null;
    if (searchParams.maxPrice && price > searchParams.maxPrice) return null;
    if (searchParams.location && city) {
      const needle = searchParams.location.toLowerCase();
      if (
        !city.toLowerCase().includes(needle) &&
        !(region || "").toLowerCase().includes(needle)
      ) {
        return null;
      }
    }

    const renovation = detectRenovationNeed(title || "", description || "");

    return {
      title: title || "Annonce immobilière",
      description: description || "",
      price,
      location: {
        city: city || "",
        department: department || "",
        region: region || "",
        coordinates: lat != null && lng != null ? { lat, lng } : undefined,
      },
      propertyType: resolvedType,
      surface,
      rooms,
      bedrooms,
      sourceId: "leboncoin",
      sourceName: "LeBonCoin",
      sourceUrl: candidate.url,
      externalId: `lbc-${candidate.id}`,
      images: images.length ? images : ["/placeholder.svg"],
      renovationScore: renovation.score,
      renovationKeywords: renovation.keywords,
      fingerprint: generateFingerprint(
        title || candidate.id,
        price || 0,
        city || "",
        surface || 0
      ),
      isSponsored: false,
      views: 0,
      clicks: 0,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
    };
  } catch {
    return null;
  }
}

async function processWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R | null>
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function next(): Promise<void> {
    const i = index++;
    if (i >= items.length) return;
    const r = await worker(items[i]);
    if (r) results.push(r);
    await next();
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () =>
    next()
  );
  await Promise.all(runners);
  return results;
}

export async function scrapeLeboncoin(searchParams: {
  location?: string;
  propertyType?: string;
  maxPrice?: number;
  url?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  immoSellType?: "old" | "new";
  globalCondition?: number[] | string;
}): Promise<Listing[]> {
  const desiredPropertyType = mapIncomingPropertyType(
    searchParams.propertyType
  );

  // Si une URL complète est fournie, on l’utilise telle quelle
  const url =
    searchParams.url &&
    searchParams.url.startsWith("https://www.leboncoin.fr/recherche")
      ? searchParams.url
      : buildSearchUrl({
          location: searchParams.location,
          propertyType: desiredPropertyType,
          maxPrice: searchParams.maxPrice,
          lat: searchParams.lat,
          lng: searchParams.lng,
          radius: searchParams.radius,
          immoSellType: searchParams.immoSellType,
          globalCondition: searchParams.globalCondition,
        });

  let html: string | null = null;
  try {
    const res = await fetch(url, {
      // Force le mode serveur et évite le cache pour des résultats frais
      cache: "no-store",
      headers: {
        "user-agent": USER_AGENT,
        "accept-language": "fr-FR,fr;q=0.9,en;q=0.8",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        connection: "keep-alive",
        referer: "https://www.leboncoin.fr/recherche?category=9",
        "upgrade-insecure-requests": "1",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-ch-ua":
          '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "sec-ch-ua-platform": '"Windows"',
        "sec-ch-ua-mobile": "?0",
      },
    } as RequestInit);
    if (!res.ok) {
      console.log("Error fetching URL:", url, "status:", res.status);
      // Fallback 1: reconstruire une URL propre
      const parsed = parseSearchParamsFromUrl(searchParams.url);
      const fallback1 = buildSearchUrl({
        propertyType: desiredPropertyType,
        lat: parsed.lat ?? searchParams.lat,
        lng: parsed.lng ?? searchParams.lng,
        radius: parsed.radius ?? searchParams.radius,
        immoSellType: parsed.immoSellType ?? searchParams.immoSellType,
        globalCondition: parsed.globalCondition ?? searchParams.globalCondition,
      });
      const res2 = await fetch(fallback1, {
        cache: "no-store",
        headers: {
          "user-agent": USER_AGENT,
          "accept-language": "fr-FR,fr;q=0.9,en;q=0.8",
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          connection: "keep-alive",
          referer: "https://www.leboncoin.fr/recherche?category=9",
          "upgrade-insecure-requests": "1",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-ch-ua":
            '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          "sec-ch-ua-platform": '"Windows"',
          "sec-ch-ua-mobile": "?0",
        },
      } as RequestInit);
      if (!res2.ok) {
        console.log(
          "Error fetching fallback1:",
          fallback1,
          "status:",
          res2.status
        );
        const fallback2 = "https://www.leboncoin.fr/recherche?category=9";
        const res3 = await fetch(fallback2, {
          cache: "no-store",
          headers: {
            "user-agent": USER_AGENT,
            "accept-language": "fr-FR,fr;q=0.9,en;q=0.8",
            accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            connection: "keep-alive",
            referer: "https://www.leboncoin.fr/recherche?category=9",
            "upgrade-insecure-requests": "1",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-ch-ua":
              '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            "sec-ch-ua-platform": '"Windows"',
            "sec-ch-ua-mobile": "?0",
          },
        } as RequestInit);
        if (!res3.ok) {
          console.log(
            "Error fetching fallback2:",
            fallback2,
            "status:",
            res3.status
          );
          return [];
        }
        html = await res3.text();
        console.log(
          "lbc: fetched html length",
          html?.length || 0,
          "(fallback2)"
        );
      } else {
        html = await res2.text();
        console.log(
          "lbc: fetched html length",
          html?.length || 0,
          "(fallback1)"
        );
      }
    } else {
      html = await res.text();
      console.log("lbc: fetched html length", html?.length || 0, "(primary)");
    }
  } catch {
    return [];
  }

  const nextData = html ? parseNextData(html) : null;
  const listings: Listing[] = [];

  // 1) Chemin JSON via __NEXT_DATA__
  const ads = nextData ? extractFromQueriesArray(nextData) : [];
  console.log("lbc: using url", url);
  console.log(
    "lbc: nextData present?",
    !!nextData,
    "ads:",
    Array.isArray(ads) ? ads.length : 0
  );
  if (Array.isArray(ads) && ads.length > 0) {
    for (const ad of ads) {
      // Champs de base
      const id = String(ad?.id ?? ad?.ad_id ?? ad?._id ?? ad?.list_id ?? "");
      if (!id) continue;

      const title: string =
        ad?.subject ||
        ad?.title ||
        ad?.header ||
        ad?.attributes?.title ||
        ad?.short_description ||
        "";

      const description: string =
        ad?.body ||
        ad?.description ||
        ad?.attributes?.description ||
        ad?.long_description ||
        "";

      // Prix
      const priceCandidate =
        ad?.price?.[0]?.value ??
        ad?.price?.value ??
        ad?.price ??
        ad?.pricing?.price ??
        ad?.owner?.price;
      const price = coerceNumber(priceCandidate) ?? 0;

      // Localisation
      const city: string =
        ad?.location?.city ||
        ad?.location?.city_label ||
        ad?.location?.label ||
        ad?.owner?.city ||
        "";
      const department: string =
        ad?.location?.department_name ||
        ad?.location?.department ||
        ad?.location?.department_label ||
        "";
      const region: string =
        ad?.location?.region_name ||
        ad?.location?.region ||
        ad?.location?.region_label ||
        "";
      const lat = coerceNumber(
        ad?.location?.lat ?? ad?.location?.latitude ?? ad?.location?.geo?.lat
      );
      const lng = coerceNumber(
        ad?.location?.lng ?? ad?.location?.longitude ?? ad?.location?.geo?.lng
      );

      // Typologie
      const resolvedType = resolvePropertyTypeFromAd(ad);

      // Surface / pièces / chambres (best-effort, dépend du modèle LBC)
      const surface =
        coerceNumber(ad?.surface) ??
        coerceNumber(ad?.attributes?.surface) ??
        coerceNumber(ad?.living_area) ??
        undefined;
      const rooms =
        coerceNumber(ad?.rooms) ??
        coerceNumber(ad?.attributes?.rooms) ??
        coerceNumber(ad?.nb_rooms) ??
        undefined;
      const bedrooms =
        coerceNumber(ad?.bedrooms) ??
        coerceNumber(ad?.attributes?.bedrooms) ??
        coerceNumber(ad?.nb_bedrooms) ??
        undefined;

      // Images
      const images = extractImages(ad);

      // URL source (patron /vi/{id}.htm si non fourni)
      const sourceUrl: string =
        ad?.url ||
        ad?.permalink ||
        `https://www.leboncoin.fr/vi/${encodeURIComponent(id)}.htm`;

      // Détection rénovation puis filtrage
      const renovation = detectRenovationNeed(title || "", description || "");
      if (renovation.score < 10) {
        continue;
      }

      // Post-filtrage côté app si l’URL de recherche n’a pas tout filtré
      const desiredPropertyType = mapIncomingPropertyType(
        searchParams.propertyType
      );
      if (desiredPropertyType && resolvedType !== desiredPropertyType) {
        continue;
      }
      if (searchParams.maxPrice && price > searchParams.maxPrice) {
        continue;
      }
      if (searchParams.location && city) {
        const needle = searchParams.location.toLowerCase();
        if (
          !city.toLowerCase().includes(needle) &&
          !(region || "").toLowerCase().includes(needle)
        ) {
          continue;
        }
      }

      const listing: Listing = {
        title: title || "Annonce immobilière",
        description: description || "",
        price,
        location: {
          city: city || "",
          department: department || "",
          region: region || "",
          coordinates: lat != null && lng != null ? { lat, lng } : undefined,
        },
        propertyType: resolvedType,
        surface,
        rooms,
        bedrooms,
        sourceId: "leboncoin",
        sourceName: "LeBonCoin",
        sourceUrl,
        externalId: `lbc-${id}`,
        images: images.length ? images : ["/placeholder.svg"],
        renovationScore: renovation.score,
        renovationKeywords: renovation.keywords,
        fingerprint: generateFingerprint(
          title || id,
          price || 0,
          city || "",
          surface || 0
        ),
        isSponsored: false,
        views: 0,
        clicks: 0,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
      };

      listings.push(listing);
    }

    return listings;
  }

  // 2) Fallback DOM si __NEXT_DATA__ ne contient pas la liste
  const rough = fallbackExtractListingsFromHtml(html);
  console.log("lbc: fallback candidates", rough.length);
  const urlHasCondition =
    typeof url === "string" && url.includes("global_condition=");
  const minScoreFallback =
    urlHasCondition || !!searchParams.globalCondition ? 0 : 10;
  const desiredType = mapIncomingPropertyType(searchParams.propertyType);
  const prefiltered = rough
    .filter((ad) => {
      const title = ad.title || "";
      const price = ad.price ?? 0;
      const resolvedType = ad.propertyType || inferPropertyTypeFromText(title);
      if (desiredType && resolvedType !== desiredType) return false;
      if (searchParams.maxPrice && price > searchParams.maxPrice) return false;
      if (searchParams.location && ad.city) {
        const needle = searchParams.location.toLowerCase();
        if (
          !ad.city.toLowerCase().includes(needle) &&
          !(ad.region || "").toLowerCase().includes(needle)
        ) {
          return false;
        }
      }
      const renovation = detectRenovationNeed(title, ad.description || "");
      if (renovation.score < minScoreFallback) return false;
      return true;
    })
    .slice(0, 40);

  const enriched = await processWithConcurrency(prefiltered, 6, (ad) =>
    fetchDetailAndEnrich(ad, desiredType, searchParams)
  );
  listings.push(...enriched);

  // Champs de base
  return listings;
}
