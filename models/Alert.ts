import { dbConnect } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export interface IAlertFilters {
  query?: string;
  propertyTypes?: string[]; // house, apartment, building
  minPrice?: number;
  maxPrice?: number;
  minSurface?: number;
  maxSurface?: number;
  minRooms?: number;
  maxRooms?: number;
  cities?: string[];
  postalCodes?: string[];
  departments?: string[];
  regions?: string[];
  minRenovationScore?: number;
  keywords?: string[]; // Mots-clés dans le titre/description
}

export interface IAlert {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  filters: IAlertFilters;
  frequency: "instant" | "daily" | "weekly";
  isActive: boolean;
  isPaused: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  matchCount: number; // Nombre total de matchs
  lastSentAt?: Date;
  lastMatchAt?: Date;
  lastListingIds: string[]; // Pour éviter les doublons (garder les 100 derniers)
  createdAt: Date;
  updatedAt: Date;
}

let alertIndexesInitialized = false;

export async function getAlertModel() {
  const db = await dbConnect();
  const collection = db.collection<IAlert>("alerts");

  if (!alertIndexesInitialized) {
    try {
      await collection.createIndex({ userId: 1 });
      await collection.createIndex({ isActive: 1, isPaused: 1, frequency: 1 });
      await collection.createIndex({ lastSentAt: 1 });
      await collection.createIndex({ "filters.departments": 1 });
      await collection.createIndex({ "filters.cities": 1 });
      alertIndexesInitialized = true;
    } catch (error: any) {
      if (error.code !== 85 && error.code !== 86 && error.code !== 276) {
        console.error("Error creating alert indexes:", error);
      }
      alertIndexesInitialized = true;
    }
  }

  return collection;
}

export async function createAlert(
  userId: string,
  data: {
    name: string;
    filters: IAlertFilters;
    frequency: IAlert["frequency"];
    emailEnabled?: boolean;
  }
): Promise<IAlert> {
  const Alert = await getAlertModel();

  const alert: IAlert = {
    userId: new ObjectId(userId),
    name: data.name,
    filters: data.filters,
    frequency: data.frequency,
    isActive: true,
    isPaused: false,
    emailEnabled: data.emailEnabled ?? true,
    pushEnabled: false,
    matchCount: 0,
    lastListingIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await Alert.insertOne(alert);
  return { ...alert, _id: result.insertedId };
}

export async function getAlertById(
  alertId: string,
  userId?: string
): Promise<IAlert | null> {
  const Alert = await getAlertModel();
  const query: any = { _id: new ObjectId(alertId) };
  if (userId) {
    query.userId = new ObjectId(userId);
  }
  return Alert.findOne(query);
}

export async function getUserAlerts(userId: string): Promise<IAlert[]> {
  const Alert = await getAlertModel();
  return Alert.find({ userId: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getActiveAlerts(
  frequency?: IAlert["frequency"]
): Promise<IAlert[]> {
  const Alert = await getAlertModel();
  const query: any = { isActive: true, isPaused: false };
  if (frequency) {
    query.frequency = frequency;
  }
  return Alert.find(query).toArray();
}

export async function updateAlert(
  alertId: string,
  userId: string,
  data: Partial<
    Pick<
      IAlert,
      "name" | "filters" | "frequency" | "isActive" | "isPaused" | "emailEnabled"
    >
  >
): Promise<boolean> {
  const Alert = await getAlertModel();
  const result = await Alert.updateOne(
    { _id: new ObjectId(alertId), userId: new ObjectId(userId) },
    { $set: { ...data, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function toggleAlertPause(
  alertId: string,
  userId: string
): Promise<boolean> {
  const Alert = await getAlertModel();
  const alert = await Alert.findOne({
    _id: new ObjectId(alertId),
    userId: new ObjectId(userId),
  });

  if (!alert) return false;

  const result = await Alert.updateOne(
    { _id: new ObjectId(alertId) },
    { $set: { isPaused: !alert.isPaused, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function deleteAlert(
  alertId: string,
  userId: string
): Promise<boolean> {
  const Alert = await getAlertModel();
  const result = await Alert.deleteOne({
    _id: new ObjectId(alertId),
    userId: new ObjectId(userId),
  });
  return result.deletedCount > 0;
}

export async function markAlertSent(
  alertId: string,
  listingIds: string[],
  incrementMatchCount: number = 0
): Promise<void> {
  const Alert = await getAlertModel();

  // Garder seulement les 100 derniers IDs pour éviter que le document grossisse trop
  const update: any = {
    $set: {
      lastSentAt: new Date(),
      lastMatchAt: new Date(),
      updatedAt: new Date(),
    },
    $push: {
      lastListingIds: {
        $each: listingIds,
        $slice: -100, // Garder les 100 derniers
      },
    },
  };

  if (incrementMatchCount > 0) {
    update.$inc = { matchCount: incrementMatchCount };
  }

  await Alert.updateOne({ _id: new ObjectId(alertId) }, update);
}

export async function countUserAlerts(userId: string): Promise<number> {
  const Alert = await getAlertModel();
  return Alert.countDocuments({ userId: new ObjectId(userId) });
}

// Limite d'alertes par utilisateur
export const MAX_ALERTS_PER_USER = 10;
