import { dbConnect } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export interface Feedback {
  _id?: ObjectId;
  agencyId: ObjectId | string;
  createdByUserId: ObjectId | string;
  title: string;
  message: string;
  category: "BUG" | "FEATURE_REQUEST" | "IMPROVEMENT" | "OTHER";
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_REVIEW" | "PLANNED" | "DONE" | "REJECTED";
  pageUrl?: string;
  screenshotUrl?: string;
  adminNote?: string;
  adminReply?: string;
  assignToAdminId?: ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getFeedbackModel() {
  const db = await dbConnect();
  return db.collection<Feedback>("feedbacks");
}

export async function createFeedback(data: Omit<Feedback, "_id" | "createdAt" | "updatedAt">) {
  const Feedback = await getFeedbackModel();
  const now = new Date();
  const feedback: Omit<Feedback, "_id"> = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const result = await Feedback.insertOne(feedback as any);
  return result.insertedId;
}

export async function getFeedbackById(id: string) {
  const Feedback = await getFeedbackModel();
  return await Feedback.findOne({ _id: new ObjectId(id) });
}

export async function getFeedbacksByAgency(agencyId: string | ObjectId) {
  const Feedback = await getFeedbackModel();
  const agencyIdObj = typeof agencyId === "string" ? new ObjectId(agencyId) : agencyId;
  return await Feedback.find({ agencyId: agencyIdObj })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getAllFeedbacks(filters?: {
  status?: string;
  category?: string;
  severity?: string;
  agencyId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const Feedback = await getFeedbackModel();
  const query: any = {};

  if (filters?.status) {
    query.status = filters.status;
  }
  if (filters?.category) {
    query.category = filters.category;
  }
  if (filters?.severity) {
    query.severity = filters.severity;
  }
  if (filters?.agencyId) {
    query.agencyId = new ObjectId(filters.agencyId);
  }
  if (filters?.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: "i" } },
      { message: { $regex: filters.search, $options: "i" } },
    ];
  }
  if (filters?.startDate || filters?.endDate) {
    query.createdAt = {};
    if (filters.startDate) {
      query.createdAt.$gte = filters.startDate;
    }
    if (filters.endDate) {
      query.createdAt.$lte = filters.endDate;
    }
  }

  return await Feedback.find(query).sort({ createdAt: -1 }).toArray();
}

export async function updateFeedback(
  id: string,
  updates: Partial<Pick<Feedback, "status" | "adminNote" | "adminReply" | "assignToAdminId">>
) {
  const Feedback = await getFeedbackModel();
  const result = await Feedback.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    }
  );
  return result;
}

