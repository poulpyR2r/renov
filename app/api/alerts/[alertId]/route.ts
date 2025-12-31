import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail } from "@/models/User";
import {
  getAlertById,
  updateAlert,
  deleteAlert,
  toggleAlertPause,
} from "@/models/Alert";

// GET: Récupérer une alerte spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);

    if (!user || !user._id) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const { alertId } = await params;
    const alert = await getAlertById(alertId, user._id.toString());

    if (!alert) {
      return NextResponse.json(
        { error: "Alerte non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Error fetching alert:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH: Mettre à jour une alerte
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);

    if (!user || !user._id) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const { alertId } = await params;
    const body = await request.json();

    // Action spéciale: toggle pause
    if (body.action === "togglePause") {
      const success = await toggleAlertPause(alertId, user._id.toString());
      if (!success) {
        return NextResponse.json(
          { error: "Alerte non trouvée" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: "Alerte mise à jour",
      });
    }

    // Mise à jour normale
    const { name, filters, frequency, isActive, isPaused, emailEnabled } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (filters !== undefined) updateData.filters = filters;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isPaused !== undefined) updateData.isPaused = isPaused;
    if (emailEnabled !== undefined) updateData.emailEnabled = emailEnabled;

    const success = await updateAlert(
      alertId,
      user._id.toString(),
      updateData
    );

    if (!success) {
      return NextResponse.json(
        { error: "Alerte non trouvée ou non modifiée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Alerte mise à jour",
    });
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE: Supprimer une alerte
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);

    if (!user || !user._id) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const { alertId } = await params;
    const success = await deleteAlert(alertId, user._id.toString());

    if (!success) {
      return NextResponse.json(
        { error: "Alerte non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Alerte supprimée",
    });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

