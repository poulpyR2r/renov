import { type NextRequest, NextResponse } from "next/server";
import { getListingModel } from "@/models/Listing";
import { detectRenovationNeed } from "@/lib/renovation-detector";
import { generateFingerprint } from "@/lib/deduplication";
import { auth } from "@/auth";
import { getAgencyById, incrementAgencyListings, canAgencyCreateListing } from "@/models/Agency";
import { getUserByEmail } from "@/models/User";
import { getUserAgencyRole } from "@/models/AgencyMembership";
import { getPackConfig } from "@/lib/packs";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour soumettre une annonce" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est une agence vérifiée ou un admin
    if (session.user.role !== "admin") {
      if (session.user.role !== "agency") {
        return NextResponse.json(
          { error: "Seules les agences peuvent publier des annonces" },
          { status: 403 }
        );
      }

      if (session.user.agencyStatus !== "verified") {
        return NextResponse.json(
          {
            error: "Votre agence doit être vérifiée pour publier des annonces",
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();

    // Vérifier que l'agenceId est fourni pour les agences
    if (session.user.role === "agency" && !body.agencyId) {
      return NextResponse.json(
        { error: "L'identifiant de l'agence est requis" },
        { status: 400 }
      );
    }

    // ✅ VÉRIFICATION LIMITE D'ANNONCES SELON LE PACK
    if (body.agencyId) {
      const canCreate = await canAgencyCreateListing(body.agencyId);
      if (!canCreate.allowed) {
        const agency = await getAgencyById(body.agencyId);
        const pack = agency?.subscription?.pack || "FREE";
        const config = getPackConfig(pack);
        return NextResponse.json(
          { 
            error: canCreate.reason,
            code: "LISTING_LIMIT_REACHED",
            currentCount: canCreate.currentCount,
            maxAllowed: canCreate.maxAllowed,
            currentPack: pack,
            upgradeTo: pack === "FREE" ? "STARTER" : pack === "STARTER" ? "PRO" : pack === "PRO" ? "PREMIUM" : null,
          },
          { status: 403 }
        );
      }
    }
    
    const {
      title,
      description,
      price,
      location,
      propertyType,
      transactionType,
      surface,
      landSurface,
      rooms,
      bedrooms,
      bathrooms,
      constructionYear,
      externalUrl,
      contactPhone,
      hidePhone,
      submittedBy,
      submitterEmail,
      images,
      agencyId,
      fees,
      currency,
      diagnostics,
      renovation: renovationData,
      copropriety,
      agencyInfo,
      agencyCertification,
    } = body;

    // Validation des champs obligatoires
    if (!title || !description || !price || !location?.city || !propertyType) {
      return NextResponse.json(
        { error: "Veuillez remplir tous les champs obligatoires" },
        { status: 400 }
      );
    }

    // Validation des champs obligatoires supplémentaires
    if (!surface) {
      return NextResponse.json(
        { error: "La surface habitable est obligatoire" },
        { status: 400 }
      );
    }
    if (!rooms) {
      return NextResponse.json(
        { error: "Le nombre de pièces principales est obligatoire" },
        { status: 400 }
      );
    }
    // Validation DPE selon le statut
    if (!diagnostics?.dpe?.status) {
      return NextResponse.json(
        { error: "Le statut du DPE est obligatoire" },
        { status: 400 }
      );
    }
    if (diagnostics.dpe.status === "available") {
      if (!diagnostics.dpe.energyClass || !diagnostics.dpe.gesClass) {
        return NextResponse.json(
          { error: "Les classes DPE (énergie et GES) sont obligatoires lorsque le DPE est disponible" },
          { status: 400 }
        );
      }
    }
    // Validation terrainSurface pour les terrains
    if (propertyType === "land" && !landSurface) {
      return NextResponse.json(
        { error: "La superficie du terrain est obligatoire pour un terrain" },
        { status: 400 }
      );
    }
    if (!renovationData?.level) {
      return NextResponse.json(
        { error: "Le niveau de rénovation est obligatoire" },
        { status: 400 }
      );
    }

    // Validation des conditions légales
    if (!agencyCertification?.certified) {
      return NextResponse.json(
        { error: "Vous devez certifier l'exactitude des informations" },
        { status: 400 }
      );
    }

    // Détection du potentiel de rénovation
    const renovation = detectRenovationNeed(title, description);

    // Déterminer le statut de l'annonce
    let listingStatus: "active" | "pending" = "active";

    // Vérifier si l'approbation est requise pour cette agence
    if (agencyId) {
      const agency = await getAgencyById(agencyId);
      if (agency?.requireApproval) {
        // Vérifier le rôle de l'utilisateur dans l'agence
        const user = await getUserByEmail(session.user.email);
        if (user?._id) {
          // Le propriétaire est automatiquement ADMIN
          const isOwner = agency.ownerId.toString() === user._id.toString();
          if (!isOwner) {
            const agencyRole = await getUserAgencyRole(
              user._id.toString(),
              agencyId
            );
            // Si c'est un AGENCY_USER, mettre en attente
            if (agencyRole === "AGENCY_USER") {
              listingStatus = "pending";
            }
          }
          // ADMIN et MANAGER (ainsi que le propriétaire) peuvent publier directement
        }
      }
    }

    // Récupérer les informations agence si non fournies
    let finalAgencyInfo = agencyInfo;
    let agencyPack = "FREE";
    let autoBoostData: {
      isSponsored: boolean;
      sponsoredAt?: Date;
      sponsoredUntil?: Date;
      autoBoostApplied?: boolean;
      autoBoostRecurrent?: boolean;
    } = { isSponsored: false };

    if (agencyId) {
      const agency = await getAgencyById(agencyId);
      if (agency) {
        if (!finalAgencyInfo) {
          finalAgencyInfo = {
            companyName: agency.companyName,
            cardNumber: agency.professionalCard?.number || "",
            cardPrefecture: agency.professionalCard?.prefecture || "",
            rcpProvider: agency.insurance?.provider,
            rcpPolicyNumber: agency.insurance?.policyNumber,
          };
        }
        
        // ✅ AUTO-BOOST PRO/PREMIUM : Boost automatique de 48h pour les nouvelles annonces
        agencyPack = agency.subscription?.pack || "FREE";
        const packConfig = getPackConfig(agencyPack);
        
        if (packConfig.autoBoost && packConfig.autoBoostDuration) {
          const boostEndDate = new Date();
          boostEndDate.setHours(boostEndDate.getHours() + packConfig.autoBoostDuration);
          
          autoBoostData = {
            isSponsored: true,
            sponsoredAt: new Date(),
            sponsoredUntil: boostEndDate,
            autoBoostApplied: true, // Marquer comme boost automatique (gratuit, pas de CPC)
            autoBoostRecurrent: packConfig.autoBoostRecurrent || false,
          };
          
          console.log(`[AUTO-BOOST] Pack ${agencyPack}: Auto-boost ${packConfig.autoBoostDuration}h applied for new listing`);
        }
      }
    }

    // Générer un externalId unique pour cette annonce
    const uniqueExternalId = `sub-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Création de l'annonce
    const listing = {
      title,
      description,
      price: parseInt(price),
      location: {
        city: location.city,
        postalCode: location.postalCode || "",
        department: location.department || "",
        address: location.address || "",
        region: "",
        coordinates: location.coordinates || undefined,
        geo: location.geo || undefined,
      },
      propertyType,
      transactionType: transactionType || "sale",
      surface: surface ? parseInt(surface) : undefined,
      landSurface: landSurface ? parseInt(landSurface) : undefined,
      rooms: rooms ? parseInt(rooms) : undefined,
      bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
      bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
      constructionYear: constructionYear
        ? parseInt(constructionYear)
        : undefined,

      // Source
      sourceId: "agency_submission",
      sourceName: "Soumission par l'agence " + agencyInfo?.companyName,
      sourceUrl: externalUrl || "",
      externalId: uniqueExternalId,

      // Images
      images: images || [],

      // Agency
      agencyId: agencyId || undefined,

      // Prix & Honoraires
      fees: fees || undefined,
      currency: currency || "EUR",

      // Diagnostics
      diagnostics: diagnostics || undefined,

      // Rénovation
      renovation: renovationData || undefined,

      // Copropriété
      copropriety: copropriety || undefined,

      // Informations agence
      agencyInfo: finalAgencyInfo || undefined,

      // Certification agence
      agencyCertification: agencyCertification || undefined,

      // Sponsoring & Auto-Boost
      ...autoBoostData,
      views: 0,
      clicks: 0,

      // Rénovation (score automatique)
      renovationScore: renovation.score,
      renovationKeywords: renovation.keywords,

      // Déduplication : générer un fingerprint unique basé sur externalId pour éviter les doublons
      fingerprint: generateFingerprint(
        `agency_submission_${uniqueExternalId}_${Date.now()}_${Math.random()}`,
        0,
        "",
        0
      ),

      // Statut déterminé selon les règles de validation
      status: listingStatus,

      // Informations de soumission
      submission: {
        submittedBy: submittedBy || session.user.id,
        submitterEmail: submitterEmail || session.user.email,
        submitterName: session.user.name,
        sellerType: "agence",
        contactPhone: hidePhone ? null : contactPhone,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },

      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      submittedAt: new Date(),
    };

    const Listing = await getListingModel();
    const result = await Listing.insertOne(listing);

    // Incrémenter le compteur d'annonces de l'agence
    if (agencyId) {
      try {
        await incrementAgencyListings(agencyId);
      } catch (e) {
        console.error("Error incrementing agency listings:", e);
      }
    }

    const message =
      listingStatus === "pending"
        ? "Annonce soumise avec succès ! Elle sera examinée avant publication."
        : "Annonce publiée avec succès !";

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      message,
    });
  } catch (error: any) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la soumission" },
      { status: 500 }
    );
  }
}
