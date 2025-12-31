import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as cheerio from "cheerio";

interface ScrapedData {
  source: string;
  url: string;
  title: string | null;
  description: string | null;
  price: number | null;
  surface: number | null;
  rooms: number | null;
  bedrooms: number | null;
  city: string | null;
  postalCode: string | null;
  propertyType: string | null;
  images: string[];
}

// Scraper pour LeBonCoin
async function scrapeLeBonCoin(url: string): Promise<Partial<ScrapedData>> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // LeBonCoin utilise des data attributes et du JSON-LD
    let data: Partial<ScrapedData> = {
      source: "leboncoin",
      images: [],
    };

    // Essayer de parser le JSON-LD
    const jsonLd = $('script[type="application/ld+json"]').html();
    if (jsonLd) {
      try {
        const parsed = JSON.parse(jsonLd);
        if (
          parsed["@type"] === "Product" ||
          parsed["@type"] === "RealEstateListing"
        ) {
          data.title = parsed.name || null;
          data.description = parsed.description || null;
          if (parsed.offers?.price) {
            data.price = parseInt(parsed.offers.price);
          }
          if (parsed.image) {
            data.images = Array.isArray(parsed.image)
              ? parsed.image
              : [parsed.image];
          }
        }
      } catch (e) {
        // JSON invalide, continuer avec le parsing HTML
      }
    }

    // Fallback: parsing HTML classique
    if (!data.title) {
      data.title =
        $('h1[data-qa-id="adview_title"]').text().trim() ||
        $("h1").first().text().trim() ||
        null;
    }

    if (!data.description) {
      data.description =
        $('[data-qa-id="adview_description_container"]').text().trim() ||
        $(".styles_AdviewContent__LnGlc").text().trim() ||
        null;
    }

    if (!data.price) {
      const priceText =
        $('[data-qa-id="adview_price"]').text() ||
        $(".styles_Price__XetDj").text();
      const priceMatch = priceText.replace(/\s/g, "").match(/(\d+)/);
      if (priceMatch) {
        data.price = parseInt(priceMatch[1]);
      }
    }

    // Extraire surface, pièces depuis les critères
    const criteriaText = $('[data-qa-id="criteria_container"]').text();

    const surfaceMatch = criteriaText.match(/(\d+)\s*m²/);
    if (surfaceMatch) {
      data.surface = parseInt(surfaceMatch[1]);
    }

    const roomsMatch = criteriaText.match(/(\d+)\s*pièces?/i);
    if (roomsMatch) {
      data.rooms = parseInt(roomsMatch[1]);
    }

    const bedroomsMatch = criteriaText.match(/(\d+)\s*chambres?/i);
    if (bedroomsMatch) {
      data.bedrooms = parseInt(bedroomsMatch[1]);
    }

    // Localisation
    const locationText =
      $('[data-qa-id="adview_location_informations"]').text() ||
      $(".styles_AdviewContent__LnGlc").text();

    const postalCodeMatch = locationText.match(/\b(\d{5})\b/);
    if (postalCodeMatch) {
      data.postalCode = postalCodeMatch[1];
    }

    // Images
    if (!data.images || data.images.length === 0) {
      data.images = [];
      $("img[src*='img.leboncoin.fr']").each((_, el) => {
        const src = $(el).attr("src");
        if (
          src &&
          !src.includes("thumb") &&
          data.images &&
          data.images.length < 10
        ) {
          data.images.push(src);
        }
      });
    }

    return data;
  } catch (error) {
    console.error("LeBonCoin scraping error:", error);
    return { source: "leboncoin" };
  }
}

// Scraper générique
async function scrapeGeneric(
  url: string,
  source: string
): Promise<Partial<ScrapedData>> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let data: Partial<ScrapedData> = {
      source,
      images: [],
    };

    // Titre - essayer plusieurs sélecteurs courants
    data.title =
      $('meta[property="og:title"]').attr("content") ||
      $("h1").first().text().trim() ||
      $("title").text().trim() ||
      null;

    // Description
    data.description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      null;

    // Prix - chercher des patterns courants
    const pricePatterns = [
      /(\d[\d\s]*)\s*€/,
      /€\s*(\d[\d\s]*)/,
      /prix[:\s]*(\d[\d\s]*)/i,
    ];

    const bodyText = $("body").text();
    for (const pattern of pricePatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        data.price = parseInt(match[1].replace(/\s/g, ""));
        break;
      }
    }

    // Surface
    const surfaceMatch = bodyText.match(/(\d+)\s*m²/);
    if (surfaceMatch) {
      data.surface = parseInt(surfaceMatch[1]);
    }

    // Pièces
    const roomsMatch = bodyText.match(/(\d+)\s*pièces?/i);
    if (roomsMatch) {
      data.rooms = parseInt(roomsMatch[1]);
    }

    // Code postal
    const postalMatch = bodyText.match(/\b(\d{5})\b/);
    if (postalMatch) {
      data.postalCode = postalMatch[1];
    }

    // Images depuis og:image ou images de la page
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) {
      data.images = [ogImage];
    }

    return data;
  } catch (error) {
    console.error("Generic scraping error:", error);
    return { source };
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL requise" }, { status: 400 });
    }

    // Valider l'URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "URL invalide" }, { status: 400 });
    }

    // Détecter la source et scraper
    let data: Partial<ScrapedData>;
    const hostname = parsedUrl.hostname.toLowerCase();

    if (hostname.includes("leboncoin.fr")) {
      data = await scrapeLeBonCoin(url);
    } else if (hostname.includes("seloger.com")) {
      data = await scrapeGeneric(url, "seloger");
    } else if (hostname.includes("pap.fr")) {
      data = await scrapeGeneric(url, "pap");
    } else if (
      hostname.includes("bienici.com") ||
      hostname.includes("bien-ici.com")
    ) {
      data = await scrapeGeneric(url, "bienici");
    } else if (hostname.includes("logic-immo.com")) {
      data = await scrapeGeneric(url, "logicimmo");
    } else {
      data = await scrapeGeneric(url, "other");
    }

    // Ajouter l'URL
    data.url = url;

    // Vérifier si on a récupéré des données utiles
    const hasData = data.title || data.price || data.description;

    return NextResponse.json({
      success: true,
      data,
      message: hasData
        ? `Informations récupérées depuis ${data.source}`
        : `Source détectée (${data.source}) mais impossible de récupérer les données. Certains sites bloquent le scraping.`,
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse du lien" },
      { status: 500 }
    );
  }
}
