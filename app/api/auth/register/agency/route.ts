import { NextRequest, NextResponse } from "next/server";
import { createUserWithPassword, getUserModel } from "@/models/User";
import { createAgency } from "@/models/Agency";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      // Compte
      name,
      email,
      password,
      phone,
      // Entreprise
      companyName,
      tradeName,
      legalForm,
      siret,
      capital,
      // Adresse
      street,
      postalCode,
      city,
      // Carte pro
      cardNumber,
      cardType,
      cardPrefecture,
      cardExpiration,
      guaranteeProvider,
      guaranteeAmount,
      // Assurance
      insuranceProvider,
      insurancePolicyNumber,
      insuranceCoverage,
      insuranceExpiration,
    } = body;

    // Validations
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Informations de compte manquantes" },
        { status: 400 }
      );
    }

    if (!companyName || !legalForm || !siret) {
      return NextResponse.json(
        { error: "Informations d'entreprise manquantes" },
        { status: 400 }
      );
    }

    if (siret.length !== 14) {
      return NextResponse.json(
        { error: "Le SIRET doit contenir 14 chiffres" },
        { status: 400 }
      );
    }

    if (!cardNumber || !cardType || !cardPrefecture || !cardExpiration) {
      return NextResponse.json(
        { error: "Informations de carte professionnelle manquantes" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    // Créer l'utilisateur d'abord
    const userResult = await createUserWithPassword({
      email,
      password,
      name,
    });

    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        { error: userResult.error || "Erreur lors de la création du compte" },
        { status: 400 }
      );
    }

    const userId = userResult.user._id!;

    // Créer l'agence
    const agencyResult = await createAgency({
      companyName,
      tradeName: tradeName || undefined,
      legalForm,
      siret,
      capital: capital ? parseInt(capital) : undefined,
      professionalCard: {
        number: cardNumber,
        type: cardType as "T" | "G" | "TG",
        prefecture: cardPrefecture,
        expirationDate: new Date(cardExpiration),
        guaranteeProvider,
        guaranteeAmount: parseInt(guaranteeAmount) || 0,
      },
      insurance: {
        provider: insuranceProvider || "",
        policyNumber: insurancePolicyNumber || "",
        coverage: insuranceCoverage ? parseInt(insuranceCoverage) : 0,
        expirationDate: insuranceExpiration
          ? new Date(insuranceExpiration)
          : new Date(),
      },
      address: {
        street,
        postalCode,
        city,
        country: "France",
      },
      phone,
      email,
      ownerId: userId,
      documents: [],
    });

    if (!agencyResult.success || !agencyResult.agency) {
      // Rollback: supprimer l'utilisateur créé
      const User = await getUserModel();
      await User.deleteOne({ _id: userId });

      return NextResponse.json(
        { error: agencyResult.error || "Erreur lors de la création de l'agence" },
        { status: 400 }
      );
    }

    // Mettre à jour l'utilisateur avec le rôle agency et l'agencyId
    const User = await getUserModel();
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          role: "agency",
          agencyId: agencyResult.agency._id,
          updatedAt: new Date(),
        },
      }
    );

    // Create ADMIN membership for the owner
    const { createAgencyMembership } = await import(
      "@/models/AgencyMembership"
    );
    await createAgencyMembership(
      userId.toString(),
      agencyResult.agency._id!.toString(),
      "AGENCY_ADMIN"
    );

    return NextResponse.json({
      success: true,
      message: "Inscription réussie. Votre demande est en cours de traitement.",
    });
  } catch (error: any) {
    console.error("Agency registration error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription" },
      { status: 500 }
    );
  }
}

