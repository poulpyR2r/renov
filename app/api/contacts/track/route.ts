import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { recordContact, ContactType } from "@/models/Contact";
import { getListingModel } from "@/models/Listing";
import { ObjectId } from "mongodb";
import crypto from "crypto";

// Fonction pour valider un ObjectId
function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  return /^[a-fA-F0-9]{24}$/.test(id);
}

// Fonction pour extraire un ObjectId valide (gère les cas où c'est déjà un ObjectId ou une string)
function toObjectIdString(value: any): string | null {
  if (!value) return null;
  
  // Si c'est déjà un ObjectId MongoDB, utiliser toString()
  if (value instanceof ObjectId) {
    return value.toString();
  }
  
  // Si c'est un objet avec une propriété toString (ObjectId sérialisé)
  if (typeof value === "object" && typeof value.toString === "function") {
    const str = value.toString();
    if (isValidObjectId(str)) {
      return str;
    }
  }
  
  // Si c'est une string
  if (typeof value === "string") {
    if (isValidObjectId(value)) {
      return value;
    }
  }
  
  return null;
}

/**
 * POST /api/contacts/track
 * Enregistrer un contact (clic téléphone, email, formulaire, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, type, sessionId } = body;

    if (!listingId || !type) {
      return NextResponse.json(
        { error: "listingId et type requis" },
        { status: 400 }
      );
    }

    // Valider le format de l'ObjectId
    if (!isValidObjectId(listingId)) {
      return NextResponse.json(
        { error: "Format de listingId invalide" },
        { status: 400 }
      );
    }

    // Valider le type de contact
    const validTypes: ContactType[] = [
      "message",
      "form_submission",
      "phone_click",
      "email_click",
      "whatsapp_click",
      "external_link",
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Type de contact invalide" },
        { status: 400 }
      );
    }

    // Récupérer le listing pour obtenir l'agencyId
    const Listing = await getListingModel();
    const listing = await Listing.findOne({ _id: new ObjectId(listingId) });

    if (!listing) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 }
      );
    }

    if (!listing.agencyId) {
      return NextResponse.json(
        { error: "Cette annonce n'appartient pas à une agence" },
        { status: 400 }
      );
    }

    // Extraire l'agencyId de manière sécurisée
    const agencyIdString = toObjectIdString(listing.agencyId);
    if (!agencyIdString) {
      console.error("Invalid agencyId format:", listing.agencyId);
      return NextResponse.json(
        { error: "Format d'agencyId invalide" },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur connecté (optionnel)
    const session = await auth();
    const userId = session?.user?.id;
    const userIdString = userId && isValidObjectId(userId) ? userId : undefined;

    // Hash de l'IP pour la déduplication (jamais stockée en clair)
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);

    // Enregistrer le contact
    const result = await recordContact({
      agencyId: agencyIdString,
      listingId,
      userId: userIdString,
      type,
      sessionId,
      ipHash,
      metadata: {
        referrer: request.headers.get("referer") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    if (!result.success) {
      console.error("recordContact failed:", result.error);
      return NextResponse.json(
        { error: result.error || "Erreur lors de l'enregistrement" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      recorded: !result.isDuplicate,
    });
  } catch (error) {
    console.error("Error tracking contact:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement" },
      { status: 500 }
    );
  }
}
