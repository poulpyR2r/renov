export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextResponse } from "next/server"
import { getSourceModel } from "@/models/Source"

export async function GET() {
  try {
    const Source = await getSourceModel()
    const sources = await Source.find({ isActive: true }).toArray()
    return NextResponse.json(sources)
  } catch (error: any) {
    console.error("Get sources error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
