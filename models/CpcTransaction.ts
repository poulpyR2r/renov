import { dbConnect } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export interface ICpcTransaction {
  _id?: ObjectId;
  agencyId: ObjectId;
  type: "credit" | "debit";
  amount: number; // en euros
  currency: string; // "eur"
  creditsAdded?: number; // si type="credit"
  description: string;

  // Stripe IDs
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeCheckoutSessionId?: string;

  // Métadonnées
  metadata?: Record<string, any>;

  // Timestamps
  createdAt: Date;
}

let cpcTransactionIndexesInitialized = false;

export async function getCpcTransactionModel() {
  const db = await dbConnect();
  const collection = db.collection<ICpcTransaction>("cpcTransactions");

  if (!cpcTransactionIndexesInitialized) {
    try {
      await collection.createIndex({ agencyId: 1 });
      await collection.createIndex({ stripePaymentIntentId: 1 }, { unique: true, sparse: true });
      await collection.createIndex({ stripeChargeId: 1 }, { unique: true, sparse: true });
      await collection.createIndex({ createdAt: -1 });
      cpcTransactionIndexesInitialized = true;
    } catch (error: any) {
      if (error.code !== 85 && error.code !== 86) {
        console.error("Error creating cpcTransaction indexes:", error);
      }
      cpcTransactionIndexesInitialized = true;
    }
  }

  return collection;
}

export async function createCpcTransaction(
  data: Omit<ICpcTransaction, "_id" | "createdAt">
): Promise<{ success: boolean; error?: string; transaction?: ICpcTransaction }> {
  const CpcTransaction = await getCpcTransactionModel();

  // Vérifier l'idempotency si paymentIntentId ou chargeId est fourni
  if (data.stripePaymentIntentId || data.stripeChargeId) {
    const existing = await CpcTransaction.findOne({
      $or: [
        data.stripePaymentIntentId ? { stripePaymentIntentId: data.stripePaymentIntentId } : {},
        data.stripeChargeId ? { stripeChargeId: data.stripeChargeId } : {},
      ].filter((obj) => Object.keys(obj).length > 0),
    });

    if (existing) {
      return {
        success: false,
        error: "Transaction déjà traitée (idempotency)",
        transaction: existing,
      };
    }
  }

  const transaction: ICpcTransaction = {
    ...data,
    createdAt: new Date(),
  };

  const result = await CpcTransaction.insertOne(transaction);
  return { success: true, transaction: { ...transaction, _id: result.insertedId } };
}

export async function getCpcTransactionsByAgency(
  agencyId: string,
  limit: number = 50
): Promise<ICpcTransaction[]> {
  const CpcTransaction = await getCpcTransactionModel();
  return await CpcTransaction.find({ agencyId: new ObjectId(agencyId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}
