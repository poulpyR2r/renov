import { NextRequest, NextResponse } from "next/server";
import { requireAgencyRole, getAgencyForUser } from "@/lib/agency-rbac";
import { getAgencyModel, getAgencyById } from "@/models/Agency";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    // Only ADMIN can view settings
    const authResult = await requireAgencyRole(request, [
      "AGENCY_ADMIN",
    ]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const agency = await getAgencyById(authResult.agencyId);

    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agency: {
        _id: agency._id?.toString(),
        companyName: agency.companyName,
        tradeName: agency.tradeName,
        legalForm: agency.legalForm,
        siret: agency.siret,
        siren: agency.siren,
        vatNumber: agency.vatNumber,
        rcs: agency.rcs,
        capital: agency.capital,
        professionalCard: agency.professionalCard,
        insurance: agency.insurance,
        address: agency.address,
        phone: agency.phone,
        email: agency.email,
        website: agency.website,
        logo: agency.logo,
        description: agency.description,
        status: agency.status,
        requireApproval: agency.requireApproval || false,
        emailPreferences: agency.emailPreferences || { messages: true },
      },
    });
  } catch (error) {
    console.error("Error fetching agency settings:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Only ADMIN can modify company name
    const authResult = await requireAgencyRole(request, ["AGENCY_ADMIN"]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const agency = await getAgencyById(authResult.agencyId);

    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      companyName,
      tradeName,
      phone,
      email,
      website,
      address,
      description,
      logo,
      requireApproval,
      emailPreferences,
    } = body;

    // Validation des champs obligatoires
    if (!companyName || !phone || !email) {
      return NextResponse.json(
        { error: "Les champs obligatoires sont manquants" },
        { status: 400 }
      );
    }

    // Only ADMIN can modify companyName
    const isChangingCompanyName = companyName !== agency.companyName;
    if (isChangingCompanyName && authResult.role !== "AGENCY_ADMIN") {
      return NextResponse.json(
        { error: "Seul l'administrateur peut modifier le nom de l'agence" },
        { status: 403 }
      );
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      );
    }

    // Validation de l'adresse
    if (!address || !address.street || !address.postalCode || !address.city) {
      return NextResponse.json(
        { error: "L'adresse complète est requise" },
        { status: 400 }
      );
    }

    const Agency = await getAgencyModel();
    const update: any = {
      $set: {
        phone,
        email,
        address: {
          street: address.street,
          postalCode: address.postalCode,
          city: address.city,
          country: address.country || "France",
        },
        updatedAt: new Date(),
      },
    };

    // Only ADMIN can update companyName
    if (authResult.role === "AGENCY_ADMIN" && isChangingCompanyName) {
      update.$set.companyName = companyName;
    }

    // Champs optionnels
    if (tradeName !== undefined) update.$set.tradeName = tradeName;
    if (website !== undefined) update.$set.website = website;
    if (description !== undefined) update.$set.description = description;
    if (logo !== undefined) update.$set.logo = logo;
    if (requireApproval !== undefined) update.$set.requireApproval = requireApproval;
    if (emailPreferences) {
      // Merge avec les préférences existantes
      const currentPreferences = agency.emailPreferences || { messages: true };
      update.$set.emailPreferences = {
        ...currentPreferences,
        ...emailPreferences,
      };
    }

    await Agency.updateOne({ _id: agency._id }, update);

    return NextResponse.json({
      success: true,
      message: "Informations mises à jour avec succès",
    });
  } catch (error) {
    console.error("Error updating agency settings:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
