/**
 * Modèle Contact - Tracking des contacts reçus par les agences
 * 
 * Un contact est comptabilisé lorsqu'un acheteur effectue une action explicite :
 * - Envoi d'un message via la messagerie
 * - Soumission d'un formulaire de contact
 * - Clic sur téléphone / email / WhatsApp
 */

import { dbConnect } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export type ContactType = 
  | "message"           // Message envoyé via messagerie
  | "form_submission"   // Formulaire de contact soumis
  | "phone_click"       // Clic sur numéro de téléphone
  | "email_click"       // Clic sur email
  | "whatsapp_click"    // Clic sur WhatsApp
  | "external_link";    // Clic sur lien de contact externe

export interface IContact {
  _id?: ObjectId;
  
  // Références
  agencyId: ObjectId;
  listingId: ObjectId;
  userId?: ObjectId; // null si visiteur non connecté
  
  // Type de contact
  type: ContactType;
  
  // Métadonnées optionnelles
  metadata?: {
    conversationId?: string; // Pour les messages
    referrer?: string;       // Page d'origine
    userAgent?: string;      // Navigateur
  };
  
  // Tracking
  ipHash?: string; // Hash de l'IP pour déduplication (jamais l'IP en clair)
  sessionId?: string; // Pour éviter les doublons dans une même session
  
  // Timestamps
  createdAt: Date;
}

// Track if indexes have been initialized
let contactIndexesInitialized = false;

export async function getContactModel() {
  const db = await dbConnect();
  const collection = db.collection<IContact>("contacts");

  if (!contactIndexesInitialized) {
    try {
      // Index par agence (pour stats agence)
      await collection.createIndex({ agencyId: 1, createdAt: -1 });
      
      // Index par listing (pour stats par annonce)
      await collection.createIndex({ listingId: 1, createdAt: -1 });
      
      // Index pour éviter les doublons (même session + même listing + même type dans les 5 min)
      await collection.createIndex(
        { listingId: 1, sessionId: 1, type: 1, createdAt: 1 },
        { sparse: true }
      );
      
      // Index pour le nettoyage des vieux contacts
      await collection.createIndex({ createdAt: 1 });
      
      contactIndexesInitialized = true;
    } catch (error: any) {
      if (error.code !== 85 && error.code !== 86) {
        console.error("Error creating contact indexes:", error);
      }
      contactIndexesInitialized = true;
    }
  }

  return collection;
}

// Fonction pour valider un ObjectId
function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  return /^[a-fA-F0-9]{24}$/.test(id);
}

/**
 * Enregistrer un nouveau contact
 * Avec déduplication pour éviter les comptages multiples
 */
export async function recordContact(data: {
  agencyId: string;
  listingId: string;
  userId?: string;
  type: ContactType;
  sessionId?: string;
  ipHash?: string;
  metadata?: IContact["metadata"];
}): Promise<{ success: boolean; isDuplicate?: boolean; error?: string }> {
  // Valider les IDs avant de les convertir
  if (!isValidObjectId(data.agencyId)) {
    console.error("Invalid agencyId in recordContact:", data.agencyId);
    return { success: false, error: "Invalid agencyId format" };
  }
  
  if (!isValidObjectId(data.listingId)) {
    console.error("Invalid listingId in recordContact:", data.listingId);
    return { success: false, error: "Invalid listingId format" };
  }
  
  if (data.userId && !isValidObjectId(data.userId)) {
    console.error("Invalid userId in recordContact:", data.userId);
    // On continue sans le userId plutôt que d'échouer
    data.userId = undefined;
  }
  
  const Contact = await getContactModel();
  
  // Vérifier si un contact similaire existe dans les 5 dernières minutes
  // (même session, même listing, même type)
  if (data.sessionId) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingContact = await Contact.findOne({
      listingId: new ObjectId(data.listingId),
      sessionId: data.sessionId,
      type: data.type,
      createdAt: { $gte: fiveMinutesAgo },
    });
    
    if (existingContact) {
      return { success: true, isDuplicate: true };
    }
  }
  
  const contact: IContact = {
    agencyId: new ObjectId(data.agencyId),
    listingId: new ObjectId(data.listingId),
    userId: data.userId ? new ObjectId(data.userId) : undefined,
    type: data.type,
    sessionId: data.sessionId,
    ipHash: data.ipHash,
    metadata: data.metadata,
    createdAt: new Date(),
  };
  
  await Contact.insertOne(contact);
  return { success: true, isDuplicate: false };
}

/**
 * Obtenir le nombre de contacts pour une agence
 */
export async function getAgencyContactsCount(
  agencyId: string,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  const Contact = await getContactModel();
  
  const query: any = { agencyId: new ObjectId(agencyId) };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }
  
  return Contact.countDocuments(query);
}

/**
 * Obtenir le nombre de contacts pour une annonce
 */
export async function getListingContactsCount(
  listingId: string,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  const Contact = await getContactModel();
  
  const query: any = { listingId: new ObjectId(listingId) };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }
  
  return Contact.countDocuments(query);
}

/**
 * Obtenir les statistiques de contacts par type
 */
export async function getContactsStatsByType(
  agencyId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Record<ContactType, number>> {
  const Contact = await getContactModel();
  
  const match: any = { agencyId: new ObjectId(agencyId) };
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }
  
  const pipeline = [
    { $match: match },
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ];
  
  const results = await Contact.aggregate(pipeline).toArray();
  
  const stats: Record<ContactType, number> = {
    message: 0,
    form_submission: 0,
    phone_click: 0,
    email_click: 0,
    whatsapp_click: 0,
    external_link: 0,
  };
  
  for (const result of results) {
    stats[result._id as ContactType] = result.count;
  }
  
  return stats;
}

/**
 * Obtenir les contacts par annonce pour une agence
 */
export async function getContactsPerListing(
  agencyId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Array<{ listingId: string; count: number }>> {
  const Contact = await getContactModel();
  
  const match: any = { agencyId: new ObjectId(agencyId) };
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }
  
  const pipeline = [
    { $match: match },
    { $group: { _id: "$listingId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ];
  
  const results = await Contact.aggregate(pipeline).toArray();
  
  return results.map((r) => ({
    listingId: r._id.toString(),
    count: r.count,
  }));
}

/**
 * Obtenir l'évolution des contacts dans le temps
 */
export async function getContactsTimeline(
  agencyId: string,
  days: number = 30
): Promise<Array<{ date: string; count: number }>> {
  const Contact = await getContactModel();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  const pipeline = [
    {
      $match: {
        agencyId: new ObjectId(agencyId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ];
  
  const results = await Contact.aggregate(pipeline).toArray();
  
  return results.map((r) => ({
    date: r._id,
    count: r.count,
  }));
}
