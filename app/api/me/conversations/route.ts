import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserConversations, getUnreadCount } from "@/models/Conversation";
import { getAgencyById } from "@/models/Agency";
import { getListingModel } from "@/models/Listing";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Vous devez être connecté" },
        { status: 401 }
      );
    }

    // Seuls les utilisateurs réguliers peuvent accéder
    if (session.user.role === "agency" || session.user.role === "admin") {
      return NextResponse.json(
        { error: "Cette route est réservée aux utilisateurs" },
        { status: 403 }
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

    // Récupérer les conversations
    const conversations = await getUserConversations(user._id.toString());

    // Enrichir avec les informations de l'agence, de l'annonce et le dernier message
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Récupérer l'agence
        const agencyId =
          typeof conv.agencyId === "string"
            ? conv.agencyId
            : conv.agencyId.toString();
        const agency = await getAgencyById(agencyId);

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
          "USER"
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
          agency: agency
            ? {
                id: agency._id!.toString(),
                companyName: agency.companyName,
                logo: agency.logo,
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
    console.error("Error fetching user conversations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des conversations" },
      { status: 500 }
    );
  }
}

