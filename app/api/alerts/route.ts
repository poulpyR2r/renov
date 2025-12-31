import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail } from "@/models/User";
import {
  createAlert,
  getUserAlerts,
  countUserAlerts,
  MAX_ALERTS_PER_USER,
  IAlertFilters,
} from "@/models/Alert";

// GET: Récupérer toutes les alertes de l'utilisateur
export async function GET() {
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

    const alerts = await getUserAlerts(user._id.toString());

    return NextResponse.json({
      alerts,
      count: alerts.length,
      maxAlerts: MAX_ALERTS_PER_USER,
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST: Créer une nouvelle alerte
export async function POST(request: NextRequest) {
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

    // Vérifier la limite d'alertes
    const alertCount = await countUserAlerts(user._id.toString());
    if (alertCount >= MAX_ALERTS_PER_USER) {
      return NextResponse.json(
        {
          error: `Vous avez atteint la limite de ${MAX_ALERTS_PER_USER} alertes`,
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, filters, frequency, emailEnabled } = body;

    // Validation
    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Le nom de l'alerte doit contenir au moins 2 caractères" },
        { status: 400 }
      );
    }

    if (!frequency || !["instant", "daily", "weekly"].includes(frequency)) {
      return NextResponse.json(
        { error: "Fréquence invalide" },
        { status: 400 }
      );
    }

    // Valider les filtres
    const validFilters: IAlertFilters = {};

    if (filters.query) validFilters.query = filters.query;
    if (filters.propertyTypes?.length)
      validFilters.propertyTypes = filters.propertyTypes;
    if (filters.minPrice && filters.minPrice > 0)
      validFilters.minPrice = filters.minPrice;
    if (filters.maxPrice && filters.maxPrice > 0)
      validFilters.maxPrice = filters.maxPrice;
    if (filters.minSurface && filters.minSurface > 0)
      validFilters.minSurface = filters.minSurface;
    if (filters.maxSurface && filters.maxSurface > 0)
      validFilters.maxSurface = filters.maxSurface;
    if (filters.minRooms && filters.minRooms > 0)
      validFilters.minRooms = filters.minRooms;
    if (filters.maxRooms && filters.maxRooms > 0)
      validFilters.maxRooms = filters.maxRooms;
    if (filters.cities?.length) validFilters.cities = filters.cities;
    if (filters.postalCodes?.length)
      validFilters.postalCodes = filters.postalCodes;
    if (filters.departments?.length)
      validFilters.departments = filters.departments;
    if (filters.regions?.length) validFilters.regions = filters.regions;
    if (filters.minRenovationScore && filters.minRenovationScore > 0)
      validFilters.minRenovationScore = filters.minRenovationScore;
    if (filters.keywords?.length) validFilters.keywords = filters.keywords;

    const alert = await createAlert(user._id.toString(), {
      name,
      filters: validFilters,
      frequency,
      emailEnabled: emailEnabled !== false,
    });

    return NextResponse.json({
      success: true,
      alert,
      message: "Alerte créée avec succès",
    });
  } catch (error) {
    console.error("Error creating alert:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

