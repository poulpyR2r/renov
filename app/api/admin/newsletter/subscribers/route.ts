import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { dbConnect } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || undefined;

    const db = await dbConnect();

    // Build query
    const query: any = { isSubscribed: true };
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await db
      .collection("newsletter_subscriptions")
      .countDocuments(query);

    // Get subscribers
    const subscribers = await db
      .collection("newsletter_subscriptions")
      .find(query)
      .sort({ subscribedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      subscribers: subscribers.map((sub) => ({
        _id: sub._id?.toString(),
        email: sub.email,
        name: sub.name,
        subscribedAt: sub.subscribedAt,
        consentDate: sub.consentDate,
        source: sub.source,
      })),
      total,
      pages,
      page,
    });
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
