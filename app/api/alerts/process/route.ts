import { NextRequest, NextResponse } from "next/server";
import { processAlertsByFrequency } from "@/lib/alert-matcher";

// This endpoint can be called by a cron job to process alerts
// You can set up a cron job on Vercel, Railway, or use a service like cron-job.org

// Secure with a secret key
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify secret key
    const authHeader = request.headers.get("authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const frequency = body.frequency as "instant" | "daily" | "weekly";

    if (!frequency || !["instant", "daily", "weekly"].includes(frequency)) {
      return NextResponse.json(
        { error: "Fréquence invalide" },
        { status: 400 }
      );
    }

    console.log(`[Cron] Processing ${frequency} alerts...`);

    const result = await processAlertsByFrequency(frequency);

    console.log(
      `[Cron] Processed ${result.processed} alerts, sent ${result.sent} emails, ${result.totalMatches} total matches`
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error processing alerts:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET endpoint to check status (useful for monitoring)
export async function GET(request: NextRequest) {
  // Verify secret key
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  return NextResponse.json({
    status: "ok",
    message: "Alert processing endpoint ready",
    endpoints: {
      daily: "POST /api/alerts/process with body { frequency: 'daily' }",
      weekly: "POST /api/alerts/process with body { frequency: 'weekly' }",
      instant: "POST /api/alerts/process with body { frequency: 'instant' }",
    },
  });
}

