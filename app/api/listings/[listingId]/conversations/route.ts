import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getListingModel } from "@/models/Listing";
import {
  findOrCreateConversation,
  createMessage,
  getConversationModel,
} from "@/models/Conversation";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Vous devez être connecté" },
        { status: 401 }
      );
    }

    const { listingId } = await params;
    const body = await request.json();
    const { firstMessage } = body;

    // Vérifier que l'annonce existe
    const Listing = await getListingModel();
    const listing = await Listing.findOne({
      _id: new ObjectId(listingId),
      status: "active",
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'annonce a une agence
    if (!listing.agencyId) {
      return NextResponse.json(
        { error: "Cette annonce n'a pas d'agence associée" },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur
    const { getUserByEmail } = await import("@/models/User");
    const user = await getUserByEmail(session.user.email);
    if (!user || !user._id) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Créer ou récupérer la conversation
    const agencyId =
      typeof listing.agencyId === "string"
        ? listing.agencyId
        : listing.agencyId.toString();
    const conversation = await findOrCreateConversation(
      listingId,
      agencyId,
      user._id.toString()
    );

    // Si un premier message est fourni, l'envoyer
    if (firstMessage && firstMessage.trim()) {
      await createMessage(
        conversation._id!.toString(),
        "USER",
        firstMessage.trim(),
        user._id.toString()
      );
    }

    return NextResponse.json({
      success: true,
      conversationId: conversation._id!.toString(),
    });
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la conversation" },
      { status: 500 }
    );
  }
}

