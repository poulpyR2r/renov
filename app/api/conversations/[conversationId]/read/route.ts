import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getConversationById,
  markMessagesAsRead,
} from "@/models/Conversation";
import { requireAgencyRole } from "@/lib/agency-rbac";

export async function POST(
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

    const { conversationId } = await params;

    // Vérifier que la conversation existe
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

    let authorized = false;
    let readBy: "USER" | "AGENCY";

    if (session.user.role === "agency") {
      // Vérifier que l'utilisateur est membre de l'agence
      const authResult = await requireAgencyRole(request, [
        "AGENCY_ADMIN",
        "AGENCY_MANAGER",
        "AGENCY_USER",
      ]);

      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const conversationAgencyId =
        typeof conversation.agencyId === "string"
          ? conversation.agencyId
          : conversation.agencyId.toString();

      if (authResult.agencyId === conversationAgencyId) {
        authorized = true;
        readBy = "AGENCY";
      }
    } else {
      // Vérifier que l'utilisateur correspond
      const userId = user._id.toString();
      const conversationUserId =
        typeof conversation.userId === "string"
          ? conversation.userId
          : conversation.userId.toString();

      if (userId === conversationUserId) {
        authorized = true;
        readBy = "USER";
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à marquer cette conversation comme lue" },
        { status: 403 }
      );
    }

    // Marquer les messages comme lus
    await markMessagesAsRead(conversationId, readBy!);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Erreur lors du marquage des messages" },
      { status: 500 }
    );
  }
}

