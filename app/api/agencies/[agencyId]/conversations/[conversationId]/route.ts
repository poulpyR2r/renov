import { NextRequest, NextResponse } from "next/server";
import { requireAgencyRole } from "@/lib/agency-rbac";
import {
  getConversationById,
  getConversationMessages,
  markMessagesAsRead,
} from "@/models/Conversation";
import { getListingModel } from "@/models/Listing";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ agencyId: string; conversationId: string }> }
) {
  try {
    const authResult = await requireAgencyRole(request, [
      "AGENCY_ADMIN",
      "AGENCY_MANAGER",
      "AGENCY_USER",
    ]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { agencyId, conversationId } = await params;

    // Vérifier que l'agence correspond
    if (authResult.agencyId !== agencyId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à voir les conversations de cette agence" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Vérifier que la conversation existe et appartient à l'agence
    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation non trouvée" },
        { status: 404 }
      );
    }

    const conversationAgencyId =
      typeof conversation.agencyId === "string"
        ? conversation.agencyId
        : conversation.agencyId.toString();

    if (conversationAgencyId !== agencyId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à voir cette conversation" },
        { status: 403 }
      );
    }

    // Marquer les messages comme lus
    await markMessagesAsRead(conversationId, "AGENCY");

    // Récupérer les messages
    const result = await getConversationMessages(conversationId, page, limit);

    // Récupérer les infos de l'utilisateur
    const { getUserModel } = await import("@/models/User");
    const User = await getUserModel();
    const userId =
      typeof conversation.userId === "string"
        ? conversation.userId
        : conversation.userId.toString();
    const user = await User.findOne({ _id: new ObjectId(userId) });

    // Récupérer les infos de l'annonce si présente
    let listing = null;
    if (conversation.listingId) {
      const Listing = await getListingModel();
      const listingId =
        typeof conversation.listingId === "string"
          ? conversation.listingId
          : conversation.listingId.toString();
      listing = await Listing.findOne({
        _id: new ObjectId(listingId),
      });
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation._id!.toString(),
        listingId: conversation.listingId
          ? (typeof conversation.listingId === "string"
              ? conversation.listingId
              : conversation.listingId.toString())
          : null,
        userId: userId,
        status: conversation.status,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
      },
      user: user
        ? {
            id: user._id!.toString(),
            name: user.name,
            email: user.email,
          }
        : null,
      listing: listing
        ? {
            id: listing._id!.toString(),
            title: listing.title,
            price: listing.price,
          }
        : null,
      messages: result.messages.map((msg) => ({
        id: msg._id!.toString(),
        senderType: msg.senderType,
        body: msg.body,
        createdAt: msg.createdAt,
        readByUserAt: msg.readByUserAt,
        readByAgencyAt: msg.readByAgencyAt,
      })),
      total: result.total,
      pages: result.pages,
      page,
    });
  } catch (error: any) {
    console.error("Error fetching agency conversation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la conversation" },
      { status: 500 }
    );
  }
}

