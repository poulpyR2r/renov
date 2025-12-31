import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getListingModel } from "@/models/Listing";
import { ObjectId } from "mongodb";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { listingId } = await params;
    const body = await request.json();

    const Listing = await getListingModel();

    const updateData: any = { updatedAt: new Date() };
    if (body.status) updateData.status = body.status;
    if (body.title) updateData.title = body.title;
    if (body.price !== undefined) updateData.price = body.price;

    const result = await Listing.updateOne(
      { _id: new ObjectId(listingId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating listing:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { listingId } = await params;

    const Listing = await getListingModel();
    const result = await Listing.deleteOne({ _id: new ObjectId(listingId) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting listing:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

