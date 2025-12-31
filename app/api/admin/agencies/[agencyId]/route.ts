import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { auth } from "@/auth";
import { getAgencyById, updateAgencyStatus } from "@/models/Agency";
import { getUserModel } from "@/models/User";
import { sendEmail, emailTemplates } from "@/lib/email";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const { agencyId } = await params;
    const agency = await getAgencyById(agencyId);

    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, agency });
  } catch (error) {
    console.error("Error fetching agency:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement de l'agence" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const session = await auth();
    const { agencyId } = await params;
    const body = await request.json();
    const { status, rejectionReason } = body;

    if (!status || !["verified", "rejected", "suspended"].includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide" },
        { status: 400 }
      );
    }

    const agency = await getAgencyById(agencyId);
    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    const success = await updateAgencyStatus(
      agencyId,
      status,
      session!.user.id,
      rejectionReason
    );

    if (!success) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    // Envoyer un email de notification
    try {
      if (status === "verified") {
        await sendEmail({
          to: agency.email,
          subject: "🎉 Votre compte agence est validé !",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #16a34a;">Félicitations !</h1>
              <p>Bonjour,</p>
              <p>Nous avons le plaisir de vous informer que votre compte agence <strong>${agency.companyName}</strong> a été validé.</p>
              <p>Vous pouvez maintenant publier des annonces sur notre plateforme.</p>
              <div style="margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL}/submit" 
                   style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  Publier une annonce
                </a>
              </div>
              <p>L'équipe RenovScout</p>
            </div>
          `,
        });
      } else if (status === "rejected") {
        await sendEmail({
          to: agency.email,
          subject: "Votre demande d'inscription agence",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #dc2626;">Demande non approuvée</h1>
              <p>Bonjour,</p>
              <p>Nous avons examiné votre demande d'inscription pour <strong>${agency.companyName}</strong>.</p>
              <p>Malheureusement, nous ne pouvons pas valider votre compte pour le moment.</p>
              ${rejectionReason ? `<p><strong>Motif :</strong> ${rejectionReason}</p>` : ""}
              <p>Si vous pensez qu'il s'agit d'une erreur, n'hésitez pas à nous contacter.</p>
              <p>L'équipe RenovScout</p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error("Error sending notification email:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating agency:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const { agencyId } = await params;

    // Get agency to find owner
    const agency = await getAgencyById(agencyId);
    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    // Delete agency and reset user role
    const { dbConnect } = await import("@/lib/mongodb");
    const db = await dbConnect();

    await db.collection("agencies").deleteOne({ _id: new ObjectId(agencyId) });

    // Reset user role to "user"
    const User = await getUserModel();
    await User.updateOne(
      { _id: agency.ownerId },
      {
        $set: { role: "user", updatedAt: new Date() },
        $unset: { agencyId: "" },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting agency:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}

