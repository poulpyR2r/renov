import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getConversationById,
  createMessage,
  getConversationMessages,
} from "@/models/Conversation";
import { requireAgencyRole } from "@/lib/agency-rbac";
import { sendEmail } from "@/lib/email";
import { getAgencyById } from "@/models/Agency";
import { ObjectId } from "mongodb";

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
    const body = await request.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Le message ne peut pas être vide" },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Le message est trop long (max 5000 caractères)" },
        { status: 400 }
      );
    }

    // Récupérer la conversation
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

    // Vérifier les autorisations
    const userId = user._id.toString();
    const conversationUserId =
      typeof conversation.userId === "string"
        ? conversation.userId
        : conversation.userId.toString();
    const conversationAgencyId =
      typeof conversation.agencyId === "string"
        ? conversation.agencyId
        : conversation.agencyId.toString();

    let senderType: "USER" | "AGENCY";
    let authorized = false;

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

      // Vérifier que l'agence correspond
      if (authResult.agencyId === conversationAgencyId) {
        senderType = "AGENCY";
        authorized = true;
      }
    } else {
      // Vérifier que l'utilisateur correspond
      if (userId === conversationUserId) {
        senderType = "USER";
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à envoyer un message dans cette conversation" },
        { status: 403 }
      );
    }

    // Créer le message
    const newMessage = await createMessage(
      conversationId,
      senderType,
      message.trim(),
      senderType === "USER" ? userId : undefined
    );

    // Envoyer une notification par email si la préférence est activée
    try {
      if (senderType === "USER") {
        // L'utilisateur envoie un message, notifier l'agence
        const agency = await getAgencyById(conversationAgencyId);
        if (
          agency &&
          (agency.emailPreferences?.messages ?? true) // Par défaut true
        ) {
          const { getUserModel } = await import("@/models/User");
          const User = await getUserModel();
          const conversationUser = await User.findOne({
            _id: new ObjectId(conversationUserId),
          });

          const listingTitle = conversation.listingId
            ? " (conversation liée à une annonce)"
            : "";

          await sendEmail({
            to: agency.email,
            subject: `Nouveau message de ${conversationUser?.name || "un utilisateur"}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #f97316;">Nouveau message${listingTitle}</h1>
                <p>Bonjour,</p>
                <p>Vous avez reçu un nouveau message de <strong>${conversationUser?.name || conversationUser?.email || "un utilisateur"}</strong>.</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; white-space: pre-wrap;">${message.trim()}</p>
                </div>
                <div style="margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/agency/messages/${conversationId}" 
                     style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                    Voir la conversation
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                  Vous recevez cet email car les notifications de messages sont activées dans vos paramètres.
                </p>
              </div>
            `,
          });
        }
      } else {
        // L'agence envoie un message, notifier l'utilisateur
        const { getUserModel } = await import("@/models/User");
        const User = await getUserModel();
        const conversationUser = await User.findOne({
          _id: new ObjectId(conversationUserId),
        });

        if (
          conversationUser &&
          (conversationUser.emailPreferences?.messages ?? true) // Par défaut true
        ) {
          const agency = await getAgencyById(conversationAgencyId);

          const listingTitle = conversation.listingId
            ? " (conversation liée à une annonce)"
            : "";

          await sendEmail({
            to: conversationUser.email,
            subject: `Nouveau message de ${agency?.companyName || "l'agence"}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #2563eb;">Nouveau message${listingTitle}</h1>
                <p>Bonjour ${conversationUser.name || ""},</p>
                <p>Vous avez reçu un nouveau message de <strong>${agency?.companyName || "l'agence"}</strong>.</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; white-space: pre-wrap;">${message.trim()}</p>
                </div>
                <div style="margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile/messages/${conversationId}" 
                     style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                    Voir la conversation
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                  Vous recevez cet email car les notifications de messages sont activées dans vos paramètres.
                </p>
              </div>
            `,
          });
        }
      }
    } catch (emailError) {
      // Ne pas faire échouer l'envoi du message si l'email échoue
      console.error("Error sending notification email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage._id!.toString(),
        conversationId: newMessage.conversationId.toString(),
        senderType: newMessage.senderType,
        body: newMessage.body,
        createdAt: newMessage.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}

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

    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Vérifier les autorisations
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
    const conversationAgencyId =
      typeof conversation.agencyId === "string"
        ? conversation.agencyId
        : conversation.agencyId.toString();

    let authorized = false;

    if (session.user.role === "agency") {
      const authResult = await requireAgencyRole(request, [
        "AGENCY_ADMIN",
        "AGENCY_MANAGER",
        "AGENCY_USER",
      ]);

      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (authResult.agencyId === conversationAgencyId) {
        authorized = true;
      }
    } else {
      if (userId === conversationUserId) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à voir cette conversation" },
        { status: 403 }
      );
    }

    // Récupérer les messages
    const result = await getConversationMessages(conversationId, page, limit);

    return NextResponse.json({
      success: true,
      messages: result.messages.map((msg) => ({
        id: msg._id!.toString(),
        conversationId: msg.conversationId.toString(),
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
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages" },
      { status: 500 }
    );
  }
}

