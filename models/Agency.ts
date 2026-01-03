import { dbConnect } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { PackType, getPackConfig } from "@/lib/packs";

export type AgencyStatus = "pending" | "verified" | "rejected" | "suspended";

export interface IAgency {
  _id?: ObjectId;
  // Informations de l'entreprise
  companyName: string; // Raison sociale
  tradeName?: string; // Nom commercial (si différent)
  legalForm: string; // Forme juridique (SARL, SAS, EURL, etc.)
  siret: string; // Numéro SIRET (14 chiffres)
  siren?: string; // Numéro SIREN (9 premiers chiffres du SIRET)
  vatNumber?: string; // Numéro de TVA intracommunautaire
  rcs?: string; // RCS (Registre du Commerce et des Sociétés)
  capital?: number; // Capital social en euros

  // Carte professionnelle (Loi Hoguet)
  professionalCard: {
    number: string; // Numéro de carte professionnelle
    type: "T" | "G" | "TG"; // Transaction, Gestion, ou les deux
    prefecture: string; // Préfecture de délivrance
    expirationDate: Date; // Date d'expiration
    guaranteeProvider: string; // Organisme de garantie financière
    guaranteeAmount: number; // Montant de la garantie
  };

  // Assurance RCP (Responsabilité Civile Professionnelle)
  insurance: {
    provider: string; // Nom de l'assureur
    policyNumber: string; // Numéro de police
    coverage: number; // Montant de couverture
    expirationDate: Date; // Date d'expiration
  };

  // Coordonnées
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  phone: string;
  email: string;
  website?: string;

  // Logo et présentation
  logo?: string; // URL du logo
  description?: string; // Description de l'agence

  // Utilisateur principal (admin de l'agence)
  ownerId: ObjectId;

  // Statut de vérification
  status: AgencyStatus;
  verifiedAt?: Date;
  verifiedBy?: ObjectId; // Admin qui a vérifié
  rejectionReason?: string;

  // Documents uploadés pour vérification
  documents: {
    type: "kbis" | "professional_card" | "insurance" | "id" | "other";
    url: string;
    name: string;
    uploadedAt: Date;
  }[];

  // Statistiques
  listingsCount: number;
  totalViews: number;

  // Stripe IDs
  stripeCustomerId?: string; // ID du Customer Stripe
  stripeSubscriptionId?: string; // ID de l'abonnement actif
  stripePriceId?: string; // Price ID du plan actuel
  stripeSubscriptionStatus?:
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "trialing";
  stripeSubscriptionCurrentPeriodEnd?: Date; // Date de fin de période

  // Abonnement / Pack
  subscription: {
    pack: PackType; // FREE, STARTER, PRO, PREMIUM
    startDate: Date;
    endDate?: Date; // null = illimité
    autoRenew: boolean;
    // Historique des changements de pack
    history?: Array<{
      pack: PackType;
      startDate: Date;
      endDate: Date;
      reason?: string;
    }>;
  };

  // Budget CPC (Cost Per Click)
  cpc: {
    balance: number; // Solde en euros
    totalSpent: number; // Total dépensé
    costPerClick: number; // Coût par clic (défaut 0.50€)
    clicksThisMonth: number;
    lastRechargeAt?: Date;
  };

  // Validation des annonces
  requireApproval?: boolean; // Si true, les annonces des AGENCY_USER doivent être approuvées

  // Email preferences
  emailPreferences?: {
    messages: boolean; // Receive email notifications for new messages (default: true)
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

let agencyIndexesInitialized = false;

export async function getAgencyModel() {
  const db = await dbConnect();
  const collection = db.collection<IAgency>("agencies");

  if (!agencyIndexesInitialized) {
    try {
      await collection.createIndex({ siret: 1 }, { unique: true });
      await collection.createIndex({ "professionalCard.number": 1 });
      await collection.createIndex({ ownerId: 1 });
      await collection.createIndex({ status: 1 });
      agencyIndexesInitialized = true;
    } catch (error: any) {
      if (error.code !== 85 && error.code !== 86) {
        console.error("Error creating agency indexes:", error);
      }
      agencyIndexesInitialized = true;
    }
  }

  return collection;
}

export async function createAgency(
  data: Omit<
    IAgency,
    | "_id"
    | "status"
    | "listingsCount"
    | "totalViews"
    | "subscription"
    | "cpc"
    | "createdAt"
    | "updatedAt"
    | "verifiedAt"
    | "verifiedBy"
  >
): Promise<{ success: boolean; error?: string; agency?: IAgency }> {
  const Agency = await getAgencyModel();

  // Vérifier si le SIRET existe déjà
  const existing = await Agency.findOne({ siret: data.siret });
  if (existing) {
    return { success: false, error: "Une agence avec ce SIRET existe déjà" };
  }

  const agency: IAgency = {
    ...data,
    status: "pending",
    listingsCount: 0,
    totalViews: 0,
    subscription: {
      pack: "FREE",
      startDate: new Date(),
      autoRenew: false,
    },
    cpc: {
      balance: 0,
      totalSpent: 0,
      costPerClick: 0.5, // 50 centimes par clic de base (sera ajusté selon le pack)
      clicksThisMonth: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await Agency.insertOne(agency);
  return { success: true, agency: { ...agency, _id: result.insertedId } };
}

export async function getAgencyById(agencyId: string): Promise<IAgency | null> {
  const Agency = await getAgencyModel();
  return Agency.findOne({ _id: new ObjectId(agencyId) });
}

export async function getAgencyByOwnerId(
  ownerId: string
): Promise<IAgency | null> {
  const Agency = await getAgencyModel();
  return Agency.findOne({ ownerId: new ObjectId(ownerId) });
}

export async function getAgencyBySiret(siret: string): Promise<IAgency | null> {
  const Agency = await getAgencyModel();
  return Agency.findOne({ siret });
}

export async function updateAgencyStatus(
  agencyId: string,
  status: AgencyStatus,
  adminId: string,
  rejectionReason?: string
): Promise<boolean> {
  const Agency = await getAgencyModel();

  const update: any = {
    $set: {
      status,
      updatedAt: new Date(),
    },
  };

  if (status === "verified") {
    update.$set.verifiedAt = new Date();
    // Only set verifiedBy if adminId is a valid ObjectId
    if (adminId && ObjectId.isValid(adminId)) {
      update.$set.verifiedBy = new ObjectId(adminId);
    }
  }

  if (status === "rejected" && rejectionReason) {
    update.$set.rejectionReason = rejectionReason;
  }

  // Validate agencyId before using
  if (!agencyId || !ObjectId.isValid(agencyId)) {
    console.error("Invalid agencyId:", agencyId);
    return false;
  }

  const result = await Agency.updateOne(
    { _id: new ObjectId(agencyId) },
    update
  );

  return result.modifiedCount > 0;
}

export async function getAllAgencies(
  page: number = 1,
  limit: number = 20,
  status?: AgencyStatus
): Promise<{ agencies: IAgency[]; total: number; pages: number }> {
  const Agency = await getAgencyModel();

  const query: any = {};
  if (status) {
    query.status = status;
  }

  const total = await Agency.countDocuments(query);
  const pages = Math.ceil(total / limit);

  const agencies = await Agency.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return { agencies, total, pages };
}

export async function getAgencyStats(): Promise<{
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}> {
  const Agency = await getAgencyModel();

  const [total, pending, verified, rejected] = await Promise.all([
    Agency.countDocuments({}),
    Agency.countDocuments({ status: "pending" }),
    Agency.countDocuments({ status: "verified" }),
    Agency.countDocuments({ status: "rejected" }),
  ]);

  return { total, pending, verified, rejected };
}

export async function incrementAgencyListings(agencyId: string): Promise<void> {
  const Agency = await getAgencyModel();
  await Agency.updateOne(
    { _id: new ObjectId(agencyId) },
    { $inc: { listingsCount: 1 } }
  );
}

export async function decrementAgencyListings(agencyId: string): Promise<void> {
  const Agency = await getAgencyModel();
  await Agency.updateOne(
    { _id: new ObjectId(agencyId) },
    { $inc: { listingsCount: -1 } }
  );
}

/**
 * Obtenir le pack actuel d'une agence
 */
export async function getAgencyPack(agencyId: string): Promise<PackType> {
  const agency = await getAgencyById(agencyId);
  return agency?.subscription?.pack || "FREE";
}

/**
 * Mettre à jour le pack d'une agence
 */
export async function updateAgencyPack(
  agencyId: string,
  newPack: PackType,
  reason?: string
): Promise<boolean> {
  const Agency = await getAgencyModel();
  const agency = await getAgencyById(agencyId);
  
  if (!agency) return false;
  
  const oldPack = agency.subscription?.pack || "FREE";
  const now = new Date();
  
  // Préparer l'historique
  const historyEntry = {
    pack: oldPack,
    startDate: agency.subscription?.startDate || now,
    endDate: now,
    reason: reason || `Changement vers ${newPack}`,
  };
  
  const result = await Agency.updateOne(
    { _id: new ObjectId(agencyId) },
    {
      $set: {
        "subscription.pack": newPack,
        "subscription.startDate": now,
        updatedAt: now,
      },
      $push: {
        "subscription.history": historyEntry,
      },
    }
  );
  
  return result.modifiedCount > 0;
}

/**
 * Obtenir le nombre d'annonces actives d'une agence
 */
export async function getAgencyActiveListingsCount(agencyId: string): Promise<number> {
  const db = await dbConnect();
  const listings = db.collection("listings");
  
  return listings.countDocuments({
    $or: [
      { agencyId: new ObjectId(agencyId) },
      { agencyId: agencyId },
    ],
    status: "active",
  });
}

/**
 * Vérifier si une agence peut créer une nouvelle annonce
 */
export async function canAgencyCreateListing(agencyId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxAllowed: number;
}> {
  const agency = await getAgencyById(agencyId);
  if (!agency) {
    return { allowed: false, reason: "Agence non trouvée", currentCount: 0, maxAllowed: 0 };
  }
  
  const pack = agency.subscription?.pack || "FREE";
  const config = getPackConfig(pack);
  const currentCount = await getAgencyActiveListingsCount(agencyId);
  const maxAllowed = config.maxActiveListings;
  
  if (maxAllowed === -1) {
    return { allowed: true, currentCount, maxAllowed: Infinity };
  }
  
  if (currentCount >= maxAllowed) {
    return {
      allowed: false,
      reason: `Limite d'annonces atteinte (${maxAllowed} max pour le pack ${config.name})`,
      currentCount,
      maxAllowed,
    };
  }
  
  return { allowed: true, currentCount, maxAllowed };
}

export async function debitAgencyCpc(
  agencyId: string,
  amount: number
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const Agency = await getAgencyModel();

  if (!ObjectId.isValid(agencyId)) {
    return { success: false, newBalance: 0, error: "ID d'agence invalide" };
  }

  const agency = await Agency.findOne({ _id: new ObjectId(agencyId) });

  if (!agency) {
    return { success: false, newBalance: 0, error: "Agence non trouvée" };
  }

  const currentBalance = agency.cpc?.balance || 0;
  console.log(
    `[CPC] debitAgencyCpc - agencyId: ${agencyId}, balance actuel: ${currentBalance}€, montant à débiter: ${amount}€`
  );

  if (currentBalance < amount) {
    console.log(`[CPC] Solde insuffisant: ${currentBalance}€ < ${amount}€`);
    return {
      success: false,
      newBalance: currentBalance,
      error: "Solde CPC insuffisant",
    };
  }

  const newBalance = currentBalance - amount;
  console.log(`[CPC] Nouveau solde après débit: ${newBalance}€`);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Vérifier si on est dans le même mois que le dernier clic
  // On utilise la date de dernière mise à jour du CPC ou le début du mois actuel
  const lastUpdate = agency.updatedAt || agency.createdAt || startOfMonth;
  const isSameMonth =
    lastUpdate.getMonth() === now.getMonth() &&
    lastUpdate.getFullYear() === now.getFullYear();

  const update: any = {
    $inc: {
      "cpc.balance": -amount,
      "cpc.totalSpent": amount,
    },
    $set: {
      updatedAt: now,
    },
  };

  // Si on change de mois, réinitialiser clicksThisMonth à 1, sinon incrémenter
  if (!isSameMonth) {
    update.$set["cpc.clicksThisMonth"] = 1;
  } else {
    update.$inc["cpc.clicksThisMonth"] = 1;
  }

  const result = await Agency.updateOne(
    { _id: new ObjectId(agencyId) },
    update
  );
  console.log(
    `[CPC] Mise à jour MongoDB: modifiedCount=${result.modifiedCount}, matchedCount=${result.matchedCount}`
  );

  if (result.modifiedCount === 0) {
    console.error(
      `[CPC] Erreur: Aucun document modifié pour agencyId ${agencyId}`
    );
  }

  return { success: true, newBalance };
}
