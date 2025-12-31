import { dbConnect } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export type LegalDocumentType =
  | "CGU"
  | "MENTIONS_LEGALES"
  | "POLITIQUE_CONFIDENTIALITE"
  | "POLITIQUE_COOKIES"
  | "CGV";

export interface ITermsOfService {
  _id?: ObjectId;
  type: LegalDocumentType; // Type de document légal
  version: string; // ex: "1.0.0" ou "2025-01-15"
  title: string; // ex: "Conditions Générales d'Utilisation"
  content: string; // texte brut ou markdown
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isCurrent: boolean; // une seule version current par type
  publishedAt?: Date;
  createdByAdminId?: string;
  updatedByAdminId?: string;
  createdAt: Date;
  updatedAt: Date;
}

let indexesInitialized = false;

export async function getTermsOfServiceModel() {
  const db = await dbConnect();
  const collection = db.collection<ITermsOfService>("termsofservice");

  if (!indexesInitialized) {
    try {
      // Index unique pour version + type (une version par type)
      await collection.createIndex({ type: 1, version: 1 }, { unique: true });
      // Index pour isCurrent + type (pour retrouver rapidement la version courante par type)
      await collection.createIndex({ type: 1, isCurrent: 1 });
      // Index pour status
      await collection.createIndex({ status: 1 });
      // Index pour type
      await collection.createIndex({ type: 1 });
      // Index pour tri par date
      await collection.createIndex({ createdAt: -1 });
      indexesInitialized = true;
    } catch (error: any) {
      if (error.code !== 85 && error.code !== 86) {
        console.error("Error creating termsofservice indexes:", error);
      }
      indexesInitialized = true;
    }
  }

  return collection;
}

/**
 * Créer une nouvelle version des CGU en DRAFT
 */
export async function createTermsOfService(
  data: Omit<ITermsOfService, "_id" | "status" | "isCurrent" | "publishedAt" | "createdAt" | "updatedAt">
): Promise<{ success: boolean; error?: string; tos?: ITermsOfService }> {
  try {
    const TermsOfService = await getTermsOfServiceModel();
    const now = new Date();

    const tos: ITermsOfService = {
      ...data,
      status: "DRAFT",
      isCurrent: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await TermsOfService.insertOne(tos);
    const created = await TermsOfService.findOne({ _id: result.insertedId });

    return { success: true, tos: created || undefined };
  } catch (error: any) {
    if (error.code === 11000) {
      return { success: false, error: "Cette version existe déjà" };
    }
    console.error("Error creating TermsOfService:", error);
    return { success: false, error: "Erreur lors de la création" };
  }
}

/**
 * Mettre à jour une version DRAFT
 */
export async function updateTermsOfService(
  id: string,
  data: Partial<Pick<ITermsOfService, "title" | "content" | "version">>,
  updatedByAdminId?: string
): Promise<{ success: boolean; error?: string; tos?: ITermsOfService }> {
  try {
    const TermsOfService = await getTermsOfServiceModel();
    const tos = await TermsOfService.findOne({ _id: new ObjectId(id) });

    if (!tos) {
      return { success: false, error: "Version non trouvée" };
    }

    if (tos.status !== "DRAFT") {
      return { success: false, error: "Seules les versions DRAFT peuvent être modifiées" };
    }

    const update: any = {
      ...data,
      updatedAt: new Date(),
    };

    if (updatedByAdminId) {
      update.updatedByAdminId = updatedByAdminId;
    }

    await TermsOfService.updateOne({ _id: new ObjectId(id) }, { $set: update });

    const updated = await TermsOfService.findOne({ _id: new ObjectId(id) });
    return { success: true, tos: updated || undefined };
  } catch (error: any) {
    if (error.code === 11000) {
      return { success: false, error: "Cette version existe déjà" };
    }
    console.error("Error updating TermsOfService:", error);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}

/**
 * Publier une version (passe en PUBLISHED)
 */
export async function publishTermsOfService(
  id: string,
  updatedByAdminId?: string
): Promise<{ success: boolean; error?: string; tos?: ITermsOfService }> {
  try {
    const TermsOfService = await getTermsOfServiceModel();
    const tos = await TermsOfService.findOne({ _id: new ObjectId(id) });

    if (!tos) {
      return { success: false, error: "Version non trouvée" };
    }

    const update: any = {
      status: "PUBLISHED",
      publishedAt: new Date(),
      updatedAt: new Date(),
    };

    if (updatedByAdminId) {
      update.updatedByAdminId = updatedByAdminId;
    }

    await TermsOfService.updateOne({ _id: new ObjectId(id) }, { $set: update });

    const updated = await TermsOfService.findOne({ _id: new ObjectId(id) });
    return { success: true, tos: updated || undefined };
  } catch (error: any) {
    console.error("Error publishing TermsOfService:", error);
    return { success: false, error: "Erreur lors de la publication" };
  }
}

/**
 * Définir une version comme courante (transaction : une seule version courante par type)
 */
export async function makeCurrentTermsOfService(
  id: string,
  updatedByAdminId?: string
): Promise<{ success: boolean; error?: string; tos?: ITermsOfService }> {
  try {
    const TermsOfService = await getTermsOfServiceModel();
    const tos = await TermsOfService.findOne({ _id: new ObjectId(id) });

    if (!tos) {
      return { success: false, error: "Version non trouvée" };
    }

    if (tos.status !== "PUBLISHED") {
      return { success: false, error: "Seules les versions PUBLISHED peuvent être définies comme courantes" };
    }

    // Transaction : mettre isCurrent=false sur toutes les autres versions du même type
    await TermsOfService.updateMany(
      { type: tos.type, _id: { $ne: new ObjectId(id) } },
      { $set: { isCurrent: false, updatedAt: new Date() } }
    );

    // Mettre isCurrent=true sur cette version
    const update: any = {
      isCurrent: true,
      updatedAt: new Date(),
    };

    if (updatedByAdminId) {
      update.updatedByAdminId = updatedByAdminId;
    }

    await TermsOfService.updateOne({ _id: new ObjectId(id) }, { $set: update });

    const updated = await TermsOfService.findOne({ _id: new ObjectId(id) });
    return { success: true, tos: updated || undefined };
  } catch (error: any) {
    console.error("Error making current TermsOfService:", error);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}

/**
 * Dupliquer une version (créer une copie en DRAFT)
 */
export async function duplicateTermsOfService(
  id: string,
  newVersion: string,
  createdByAdminId?: string
): Promise<{ success: boolean; error?: string; tos?: ITermsOfService }> {
  try {
    const TermsOfService = await getTermsOfServiceModel();
    const tos = await TermsOfService.findOne({ _id: new ObjectId(id) });

    if (!tos) {
      return { success: false, error: "Version non trouvée" };
    }

    const now = new Date();
    const newTos: ITermsOfService = {
      type: tos.type,
      version: newVersion,
      title: tos.title,
      content: tos.content,
      status: "DRAFT",
      isCurrent: false,
      createdByAdminId: createdByAdminId || tos.createdByAdminId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await TermsOfService.insertOne(newTos);
    const created = await TermsOfService.findOne({ _id: result.insertedId });

    return { success: true, tos: created || undefined };
  } catch (error: any) {
    if (error.code === 11000) {
      return { success: false, error: "Cette version existe déjà" };
    }
    console.error("Error duplicating TermsOfService:", error);
    return { success: false, error: "Erreur lors de la duplication" };
  }
}

/**
 * Récupérer la version courante (pour les utilisateurs)
 */
export async function getCurrentTermsOfService(
  type: LegalDocumentType
): Promise<ITermsOfService | null> {
  try {
    const TermsOfService = await getTermsOfServiceModel();
    return await TermsOfService.findOne({
      type,
      isCurrent: true,
      status: "PUBLISHED",
    });
  } catch (error) {
    console.error("Error getting current TermsOfService:", error);
    return null;
  }
}

/**
 * Récupérer toutes les versions (pour admin, paginé)
 */
export async function getAllTermsOfService(
  type?: LegalDocumentType,
  page: number = 1,
  limit: number = 20
): Promise<{ tos: ITermsOfService[]; total: number; pages: number }> {
  try {
    const TermsOfService = await getTermsOfServiceModel();
    const skip = (page - 1) * limit;
    const query = type ? { type } : {};

    const [tos, total] = await Promise.all([
      TermsOfService.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      TermsOfService.countDocuments(query),
    ]);

    return {
      tos,
      total,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error getting all TermsOfService:", error);
    return { tos: [], total: 0, pages: 0 };
  }
}

/**
 * Récupérer une version par ID
 */
export async function getTermsOfServiceById(id: string): Promise<ITermsOfService | null> {
  try {
    const TermsOfService = await getTermsOfServiceModel();
    return await TermsOfService.findOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.error("Error getting TermsOfService by id:", error);
    return null;
  }
}
