import { dbConnect } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export interface INewsletterSubscription {
  _id?: ObjectId;
  email: string;
  userId?: ObjectId; // Optional - can subscribe without account
  name?: string;
  isSubscribed: boolean;
  preferences: {
    weeklyDigest: boolean;
    newFeatures: boolean;
    tips: boolean;
  };
  unsubscribeToken: string;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  // RGPD compliance
  consentGiven: boolean;
  consentDate?: Date;
  consentIp?: string;
  consentUserAgent?: string;
  source?: string; // Where the subscription came from (popup, signup, etc.)
  createdAt: Date;
  updatedAt: Date;
}

function generateToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join("");
}

export async function getNewsletterModel() {
  const db = await dbConnect();
  const collection = db.collection<INewsletterSubscription>("newsletter_subscriptions");

  try {
    await collection.createIndex({ email: 1 }, { unique: true });
    await collection.createIndex({ userId: 1 }, { sparse: true });
    await collection.createIndex({ unsubscribeToken: 1 });
    await collection.createIndex({ isSubscribed: 1 });
  } catch (error: any) {
    if (error.code !== 85 && error.code !== 86) throw error;
  }

  return collection;
}

export async function subscribeToNewsletter(
  email: string,
  options?: {
    userId?: string;
    name?: string;
    preferences?: Partial<INewsletterSubscription["preferences"]>;
    consentIp?: string;
    consentUserAgent?: string;
    source?: string;
  }
): Promise<INewsletterSubscription> {
  const Newsletter = await getNewsletterModel();

  const existingSubscription = await Newsletter.findOne({ email: email.toLowerCase() });

  if (existingSubscription) {
    // Resubscribe if previously unsubscribed
    await Newsletter.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          isSubscribed: true,
          subscribedAt: new Date(),
          updatedAt: new Date(),
          unsubscribedAt: undefined,
          consentGiven: true,
          consentDate: new Date(),
          consentIp: options?.consentIp,
          consentUserAgent: options?.consentUserAgent,
          source: options?.source || existingSubscription.source,
          ...(options?.preferences && { preferences: { ...existingSubscription.preferences, ...options.preferences } }),
        },
      }
    );
    return { ...existingSubscription, isSubscribed: true, consentGiven: true };
  }

  const subscription: INewsletterSubscription = {
    email: email.toLowerCase(),
    userId: options?.userId ? new ObjectId(options.userId) : undefined,
    name: options?.name,
    isSubscribed: true,
    preferences: {
      weeklyDigest: true,
      newFeatures: true,
      tips: true,
      ...options?.preferences,
    },
    unsubscribeToken: generateToken(),
    subscribedAt: new Date(),
    consentGiven: true,
    consentDate: new Date(),
    consentIp: options?.consentIp,
    consentUserAgent: options?.consentUserAgent,
    source: options?.source || "popup",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await Newsletter.insertOne(subscription);
  return { ...subscription, _id: result.insertedId };
}

export async function unsubscribeFromNewsletter(token: string): Promise<boolean> {
  const Newsletter = await getNewsletterModel();
  const result = await Newsletter.updateOne(
    { unsubscribeToken: token },
    {
      $set: {
        isSubscribed: false,
        unsubscribedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );
  return result.modifiedCount > 0;
}

export async function getActiveSubscribers(
  preference?: keyof INewsletterSubscription["preferences"]
): Promise<INewsletterSubscription[]> {
  const Newsletter = await getNewsletterModel();

  const query: any = { isSubscribed: true };
  if (preference) {
    query[`preferences.${preference}`] = true;
  }

  return Newsletter.find(query).toArray();
}

export async function updateNewsletterPreferences(
  email: string,
  preferences: Partial<INewsletterSubscription["preferences"]>
): Promise<boolean> {
  const Newsletter = await getNewsletterModel();

  const updateFields: any = { updatedAt: new Date() };
  for (const [key, value] of Object.entries(preferences)) {
    updateFields[`preferences.${key}`] = value;
  }

  const result = await Newsletter.updateOne(
    { email: email.toLowerCase() },
    { $set: updateFields }
  );
  return result.modifiedCount > 0;
}

