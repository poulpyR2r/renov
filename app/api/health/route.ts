import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const healthStatus = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
    services: {
      database: "unknown",
    },
  };

  try {
    // Test database connection
    const db = await dbConnect();
    await db.command({ ping: 1 });
    healthStatus.services.database = "connected";
  } catch (error) {
    healthStatus.services.database = "disconnected";
    healthStatus.status = "degraded";
    
    return NextResponse.json(healthStatus, { status: 503 });
  }

  return NextResponse.json(healthStatus, { status: 200 });
}
