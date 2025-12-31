import { dbConnect } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export interface IConversation {
  _id?: ObjectId;
  listingId?: ObjectId | string; // Nullable si conversation générique
  agencyId: ObjectId | string;
  userId: ObjectId | string;
  status: "OPEN" | "CLOSED";
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  _id?: ObjectId;
  conversationId: ObjectId | string;
  senderType: "USER" | "AGENCY";
  senderUserId?: ObjectId | string; // Pour tracker l'agent si besoin
  body: string;
  readByUserAt?: Date;
  readByAgencyAt?: Date;
  createdAt: Date;
}

let conversationIndexesInitialized = false;
let messageIndexesInitialized = false;

export async function getConversationModel() {
  const db = await dbConnect();
  const collection = db.collection<IConversation>("conversations");

  if (!conversationIndexesInitialized) {
    try {
      // Index unique pour éviter les doublons
      await collection.createIndex(
        { listingId: 1, agencyId: 1, userId: 1 },
        { unique: true, sparse: true }
      );
      // Index pour les requêtes par user
      await collection.createIndex({ userId: 1, lastMessageAt: -1 });
      // Index pour les requêtes par agence
      await collection.createIndex({ agencyId: 1, lastMessageAt: -1 });
      // Index pour les requêtes par listing
      await collection.createIndex({ listingId: 1 });
      conversationIndexesInitialized = true;
    } catch (error: any) {
      if (error.code !== 85 && error.code !== 86) {
        console.error("Error creating conversation indexes:", error);
      }
      conversationIndexesInitialized = true;
    }
  }

  return collection;
}

export async function getMessageModel() {
  const db = await dbConnect();
  const collection = db.collection<IMessage>("messages");

  if (!messageIndexesInitialized) {
    try {
      // Index pour récupérer les messages d'une conversation
      await collection.createIndex({ conversationId: 1, createdAt: -1 });
      messageIndexesInitialized = true;
    } catch (error: any) {
      if (error.code !== 85 && error.code !== 86) {
        console.error("Error creating message indexes:", error);
      }
      messageIndexesInitialized = true;
    }
  }

  return collection;
}

export async function findOrCreateConversation(
  listingId: string | undefined,
  agencyId: string,
  userId: string
): Promise<IConversation> {
  const Conversation = await getConversationModel();

  // Chercher une conversation existante
  const query: any = {
    agencyId: new ObjectId(agencyId),
    userId: new ObjectId(userId),
  };

  if (listingId) {
    query.listingId = new ObjectId(listingId);
  } else {
    query.listingId = null;
  }

  let conversation = await Conversation.findOne(query);

  if (!conversation) {
    // Créer une nouvelle conversation
    const now = new Date();
    const newConversation: IConversation = {
      listingId: listingId ? new ObjectId(listingId) : undefined,
      agencyId: new ObjectId(agencyId),
      userId: new ObjectId(userId),
      status: "OPEN",
      createdAt: now,
      updatedAt: now,
    };

    const result = await Conversation.insertOne(newConversation);
    conversation = { ...newConversation, _id: result.insertedId };
  }

  return conversation;
}

export async function getUserConversations(
  userId: string
): Promise<IConversation[]> {
  const Conversation = await getConversationModel();
  return await Conversation.find({
    userId: new ObjectId(userId),
  })
    .sort({ lastMessageAt: -1, createdAt: -1 })
    .toArray();
}

export async function getAgencyConversations(
  agencyId: string
): Promise<IConversation[]> {
  const Conversation = await getConversationModel();
  return await Conversation.find({
    agencyId: new ObjectId(agencyId),
  })
    .sort({ lastMessageAt: -1, createdAt: -1 })
    .toArray();
}

export async function getConversationById(
  conversationId: string
): Promise<IConversation | null> {
  const Conversation = await getConversationModel();
  return await Conversation.findOne({
    _id: new ObjectId(conversationId),
  });
}

export async function getConversationMessages(
  conversationId: string,
  page: number = 1,
  limit: number = 50
): Promise<{ messages: IMessage[]; total: number; pages: number }> {
  const Message = await getMessageModel();
  const total = await Message.countDocuments({
    conversationId: new ObjectId(conversationId),
  });
  const pages = Math.ceil(total / limit);

  const messages = await Message.find({
    conversationId: new ObjectId(conversationId),
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  // Inverser pour avoir les plus anciens en premier
  return { messages: messages.reverse(), total, pages };
}

export async function createMessage(
  conversationId: string,
  senderType: "USER" | "AGENCY",
  body: string,
  senderUserId?: string
): Promise<IMessage> {
  const Message = await getMessageModel();
  const Conversation = await getConversationModel();

  const now = new Date();
  const message: IMessage = {
    conversationId: new ObjectId(conversationId),
    senderType,
    senderUserId: senderUserId ? new ObjectId(senderUserId) : undefined,
    body: body.trim(),
    createdAt: now,
  };

  const result = await Message.insertOne(message);

  // Mettre à jour lastMessageAt de la conversation
  await Conversation.updateOne(
    { _id: new ObjectId(conversationId) },
    {
      $set: {
        lastMessageAt: now,
        updatedAt: now,
      },
    }
  );

  return { ...message, _id: result.insertedId };
}

export async function markMessagesAsRead(
  conversationId: string,
  readBy: "USER" | "AGENCY"
): Promise<void> {
  const Message = await getMessageModel();
  const now = new Date();

  const updateField =
    readBy === "USER" ? "readByUserAt" : "readByAgencyAt";

  await Message.updateMany(
    {
      conversationId: new ObjectId(conversationId),
      senderType: readBy === "USER" ? "AGENCY" : "USER",
      [updateField]: null,
    },
    {
      $set: {
        [updateField]: now,
      },
    }
  );
}

export async function getUnreadCount(
  conversationId: string,
  userType: "USER" | "AGENCY"
): Promise<number> {
  const Message = await getMessageModel();
  const readField =
    userType === "USER" ? "readByUserAt" : "readByAgencyAt";
  const senderType = userType === "USER" ? "AGENCY" : "USER";

  return await Message.countDocuments({
    conversationId: new ObjectId(conversationId),
    senderType,
    [readField]: null,
  });
}

