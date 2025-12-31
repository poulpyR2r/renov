import { dbConnect } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Track if indexes have been initialized
let listingIndexesInitialized = false;

export interface IListing {
  _id?: ObjectId;
  title: string;
  description: string;
  price: number;
  propertyType: string;
  surface?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  location: {
    city: string;
    postalCode: string;
    department?: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    // GeoJSON Point format: [lng, lat] (ordre important pour MongoDB)
    geo?: {
      type: "Point";
      coordinates: [number, number]; // [lng, lat]
    };
  };
  // Privacy: exact location or approximate (shifted randomly for display)
  locationPrecision?: "exact" | "approx";
  images: string[];

  // Source info
  sourceId?: string;
  externalId?: string;
  externalUrl?: string;
  fingerprint?: string;

  // Agency info
  agencyId?: ObjectId;

  // Renovation
  renovationScore?: number;
  renovationDetails?: any;

  // CPC / Sponsoring
  isSponsored: boolean;
  sponsoredAt?: Date;
  sponsoredUntil?: Date;

  // Stats
  views: number;
  clicks: number;

  // Status
  status: "active" | "inactive" | "pending" | "sold";

  // Contact
  contactPhone?: string;
  contactEmail?: string;

  // Prix & Honoraires
  fees?: {
    included: boolean; // Honoraires inclus ou non
    amount?: number; // Montant en euros
    percentage?: number; // Pourcentage
    paidBy: "seller" | "buyer"; // À la charge de : vendeur / acquéreur
  };
  currency: string; // Devise (EUR par défaut)

  // Diagnostics immobiliers (obligatoires)
  diagnostics?: {
    dpe?: {
      energyClass: "A" | "B" | "C" | "D" | "E" | "F" | "G"; // Classe énergie
      gesClass: "A" | "B" | "C" | "D" | "E" | "F" | "G"; // Classe GES
      energyCost?: {
        min: number; // Montant min estimé
        max: number; // Montant max estimé
      };
      referenceYear?: number; // Année de référence
      date?: Date; // Date de réalisation du DPE
    };
    asbestos?: "available" | "in_progress" | "not_applicable"; // Amiante
    lead?: "available" | "in_progress" | "not_applicable"; // Plomb
    electricity?: "available" | "in_progress" | "not_applicable"; // Électricité
    gas?: "available" | "in_progress" | "not_applicable"; // Gaz
    termites?: "available" | "in_progress" | "not_applicable"; // Termites
    erp?: "available" | "in_progress" | "not_applicable"; // ERP (Établissement recevant du public)
  };

  // Rénovation & Travaux
  renovation?: {
    level: number; // Niveau de rénovation (1 à 5)
    requiredWorks?: string[]; // Travaux à prévoir (électricité, plomberie, etc.)
    estimatedBudget?: number; // Budget travaux estimatif
  };

  // Copropriété
  copropriety?: {
    isSubject: boolean; // Bien soumis à la copropriété
    lotsCount?: number; // Nombre de lots
    annualCharges?: number; // Charges annuelles moyennes
    procedureInProgress?: boolean; // Procédure en cours
  };

  // Informations agence (auto-injectées, non modifiables)
  agencyInfo?: {
    companyName: string;
    cardNumber: string;
    cardPrefecture: string;
    rcpProvider?: string;
    rcpPolicyNumber?: string;
  };

  // Validation & Responsabilité
  agencyCertification?: {
    certified: boolean; // Checkbox obligatoire
    certifiedAt?: Date;
    certifiedBy?: string; // Email de l'utilisateur qui a certifié
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export async function getListingModel() {
  const db = await dbConnect();
  const collection = db.collection<IListing>("listings");

  if (!listingIndexesInitialized) {
    try {
      await collection.createIndex(
        { fingerprint: 1 },
        { unique: true, sparse: true }
      );
      await collection.createIndex({ sourceId: 1, externalId: 1 });
      await collection.createIndex({ status: 1 });
      await collection.createIndex({ renovationScore: -1 });
      await collection.createIndex({ "location.city": 1 });
      await collection.createIndex({ propertyType: 1 });
      await collection.createIndex({ price: 1 });
      await collection.createIndex({ createdAt: -1 });
      await collection.createIndex({ agencyId: 1 });
      await collection.createIndex({ isSponsored: 1, createdAt: -1 });
      // Index géospatial 2dsphere pour les requêtes de carte optimisées
      await collection.createIndex(
        { "location.geo": "2dsphere" },
        { sparse: true }
      );
      listingIndexesInitialized = true;
    } catch (error: any) {
      if (error.code !== 85 && error.code !== 86) {
        console.error("Error creating listing indexes:", error);
      }
      listingIndexesInitialized = true;
    }
  }

  return collection;
}

export async function incrementListingViews(listingId: string): Promise<void> {
  const Listing = await getListingModel();
  await Listing.updateOne(
    { _id: new ObjectId(listingId) },
    { $inc: { views: 1 } }
  );
}

export async function incrementListingClicks(listingId: string): Promise<void> {
  const Listing = await getListingModel();
  await Listing.updateOne(
    { _id: new ObjectId(listingId) },
    { $inc: { clicks: 1 } }
  );
}

export async function getAgencyListings(
  agencyId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ listings: IListing[]; total: number; pages: number }> {
  const Listing = await getListingModel();

  // Chercher par ObjectId ou string (pour compatibilité)
  const query = {
    $or: [{ agencyId: new ObjectId(agencyId) }, { agencyId: agencyId }],
  } as any;
  const total = await Listing.countDocuments(query);
  const pages = Math.ceil(total / limit);

  const listings = await Listing.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return { listings, total, pages };
}

export async function toggleListingSponsored(
  listingId: string,
  isSponsored: boolean
): Promise<boolean> {
  const Listing = await getListingModel();
  const result = await Listing.updateOne(
    { _id: new ObjectId(listingId) },
    {
      $set: {
        isSponsored,
        sponsoredAt: isSponsored ? new Date() : undefined,
        updatedAt: new Date(),
      },
    }
  );
  return result.modifiedCount > 0;
}

export async function getListingFavoritesCount(
  listingId: string
): Promise<number> {
  const { getUserModel } = await import("@/models/User");
  const User = await getUserModel();
  const count = await User.countDocuments({
    favorites: listingId,
  });
  return count;
}
