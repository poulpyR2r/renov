import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getConversationById,
  getConversationMessages,
  markMessagesAsRead,
} from "@/models/Conversation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Vous devez être connecté" },
        { status: 401 }
      );
    }

    if (session.user.role === "agency" || session.user.role === "admin") {
      return NextResponse.json(
        { error: "Cette route est réservée aux utilisateurs" },
        { status: 403 }
      );
    }

    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Vérifier que la conversation existe et appartient à l'utilisateur
    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation non trouvée" },
        { status: 404 }
      );
    }

    const { getUserByEmail } = await import("@/models/User");
    const user = await getUserByEmail(session.user.email);
    if (!user || !user._id) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const userId = user._id.toString();
    const conversationUserId =
      typeof conversation.userId === "string"
        ? conversation.userId
        : conversation.userId.toString();

    if (userId !== conversationUserId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à voir cette conversation" },
        { status: 403 }
      );
    }

    // Marquer les messages comme lus
    await markMessagesAsRead(conversationId, "USER");

    // Récupérer les messages
    const result = await getConversationMessages(conversationId, page, limit);

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation._id!.toString(),
        listingId: conversation.listingId
          ? (typeof conversation.listingId === "string"
              ? conversation.listingId
              : conversation.listingId.toString())
          : null,
        agencyId:
          typeof conversation.agencyId === "string"
            ? conversation.agencyId
            : conversation.agencyId.toString(),
        status: conversation.status,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
      },
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
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la conversation" },
      { status: 500 }
    );
  }
}

