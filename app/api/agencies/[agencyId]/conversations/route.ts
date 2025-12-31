import { NextRequest, NextResponse } from "next/server";
import { requireAgencyRole } from "@/lib/agency-rbac";
import { getAgencyConversations, getUnreadCount } from "@/models/Conversation";
import { getListingModel } from "@/models/Listing";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
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

    const { agencyId } = await params;

    // Vérifier que l'agence correspond
    if (authResult.agencyId !== agencyId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à voir les conversations de cette agence" },
        { status: 403 }
      );
    }

    // Récupérer les conversations
    const conversations = await getAgencyConversations(agencyId);

    // Enrichir avec les informations de l'utilisateur, de l'annonce et le dernier message
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Récupérer l'utilisateur
        const { getUserModel } = await import("@/models/User");
        const User = await getUserModel();
        const userId =
          typeof conv.userId === "string"
            ? conv.userId
            : conv.userId.toString();
        const user = await User.findOne({ _id: new ObjectId(userId) });

        // Récupérer l'annonce si présente
        let listing = null;
        if (conv.listingId) {
          const Listing = await getListingModel();
          const listingId =
            typeof conv.listingId === "string"
              ? conv.listingId
              : conv.listingId.toString();
          listing = await Listing.findOne({
            _id: new ObjectId(listingId),
          });
        }

        // Récupérer le dernier message
        const { getConversationMessages } = await import(
          "@/models/Conversation"
        );
        const messagesResult = await getConversationMessages(
          conv._id!.toString(),
          1,
          1
        );
        const lastMessage =
          messagesResult.messages.length > 0
            ? messagesResult.messages[messagesResult.messages.length - 1]
            : null;

        // Compter les messages non lus
        const unreadCount = await getUnreadCount(
          conv._id!.toString(),
          "AGENCY"
        );

        return {
          id: conv._id!.toString(),
          listingId: conv.listingId
            ? (typeof conv.listingId === "string"
                ? conv.listingId
                : conv.listingId.toString())
            : null,
          listing: listing
            ? {
                id: listing._id!.toString(),
                title: listing.title,
                price: listing.price,
              }
            : null,
          user: user
            ? {
                id: user._id!.toString(),
                name: user.name,
                email: user.email,
              }
            : null,
          lastMessage: lastMessage
            ? {
                body: lastMessage.body,
                senderType: lastMessage.senderType,
                createdAt: lastMessage.createdAt,
              }
            : null,
          unreadCount,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
          status: conv.status,
        };
      })
    );

    return NextResponse.json({
      success: true,
      conversations: enrichedConversations,
    });
  } catch (error: any) {
    console.error("Error fetching agency conversations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des conversations" },
      { status: 500 }
    );
  }
}

