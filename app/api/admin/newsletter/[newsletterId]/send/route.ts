import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { dbConnect } from "@/lib/mongodb";
import { sendNewsletterEmail } from "@/lib/email";
import { getActiveSubscribers } from "@/models/Newsletter";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ newsletterId: string }> }
) {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { newsletterId } = await params;
    const db = await dbConnect();

    // Get newsletter
    const newsletter = await db
      .collection("newsletters")
      .findOne({ _id: new ObjectId(newsletterId) });

    if (!newsletter) {
      return NextResponse.json(
        { error: "Newsletter non trouvée" },
        { status: 404 }
      );
    }

    if (newsletter.status === "sent") {
      return NextResponse.json(
        { error: "Cette newsletter a déjà été envoyée" },
        { status: 400 }
      );
    }

    // Update status to sending
    await db.collection("newsletters").updateOne(
      { _id: new ObjectId(newsletterId) },
      { $set: { status: "sending" } }
    );

    // Get subscribers from newsletter_subscriptions collection
    const subscribers = await getActiveSubscribers();

    let successCount = 0;
    let failCount = 0;

    for (const subscriber of subscribers) {
      try {
        await sendNewsletterEmail(
          subscriber.email,
          subscriber.name || "Utilisateur",
          newsletter.subject,
          newsletter.content
        );
        successCount++;
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error);
        failCount++;
      }
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Update newsletter status
    await db.collection("newsletters").updateOne(
      { _id: new ObjectId(newsletterId) },
      {
        $set: {
          status: failCount === subscribers.length ? "failed" : "sent",
          sentAt: new Date(),
          recipientCount: successCount,
          failedCount: failCount,
        },
      }
    );

    return NextResponse.json({
      success: true,
      recipientCount: successCount,
      failedCount: failCount,
    });
  } catch (error) {
    console.error("Error sending newsletter:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

