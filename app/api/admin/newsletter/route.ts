import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { dbConnect } from "@/lib/mongodb";
import { sendNewsletterEmail } from "@/lib/email";
import { getActiveSubscribers } from "@/models/Newsletter";

export async function GET() {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const db = await dbConnect();

    // Get newsletters
    const newsletters = await db
      .collection("newsletters")
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Get stats
    const activeSubscribers = await getActiveSubscribers();
    const [totalSent, drafts] = await Promise.all([
      db.collection("newsletters").countDocuments({ status: "sent" }),
      db.collection("newsletters").countDocuments({ status: "draft" }),
    ]);
    const subscribers = activeSubscribers.length;

    return NextResponse.json({
      success: true,
      newsletters,
      stats: { subscribers, totalSent, drafts },
    });
  } catch (error) {
    console.error("Error fetching newsletters:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const body = await request.json();
    const { subject, content, sendNow } = body;

    if (!subject || !content) {
      return NextResponse.json(
        { error: "Sujet et contenu requis" },
        { status: 400 }
      );
    }

    const db = await dbConnect();

    // Create newsletter
    const newsletter = {
      subject,
      content,
      status: sendNow ? "sending" : "draft",
      createdAt: new Date(),
    };

    const result = await db.collection("newsletters").insertOne(newsletter);
    const newsletterId = result.insertedId.toString();

    if (sendNow) {
      // Send to all subscribers from newsletter_subscriptions collection
      const subscribers = await getActiveSubscribers();

      let successCount = 0;
      let failCount = 0;

      for (const subscriber of subscribers) {
        try {
          await sendNewsletterEmail(
            subscriber.email,
            subscriber.name || "Utilisateur",
            subject,
            content
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
        { _id: result.insertedId },
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
        newsletterId,
        recipientCount: successCount,
        failedCount: failCount,
      });
    }

    return NextResponse.json({
      success: true,
      newsletterId,
      message: "Brouillon enregistré",
    });
  } catch (error) {
    console.error("Error creating newsletter:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

