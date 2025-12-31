import { NextRequest, NextResponse } from "next/server";
import { requireAgencyRole } from "@/lib/agency-rbac";
import { getAgencyById, getAgencyModel } from "@/models/Agency";
import { getListingModel } from "@/models/Listing";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    // All roles can view listings
    const authResult = await requireAgencyRole(request, [
      "AGENCY_ADMIN",
      "AGENCY_MANAGER",
      "AGENCY_USER",
    ]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const agency = await getAgencyById(authResult.agencyId);
    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    const { listingId } = await params;

    if (!ObjectId.isValid(listingId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const Listing = await getListingModel();

    // Verify listing belongs to agency - check both ObjectId and string formats
    const agencyIdStr = agency._id?.toString();
    const listing = await Listing.findOne({
      _id: new ObjectId(listingId),
      $or: [{ agencyId: agency._id }, { agencyId: agencyIdStr }],
    } as any);

    if (!listing) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      listing: {
        _id: listing._id?.toString(),
        title: listing.title,
        description: listing.description,
        price: listing.price,
        propertyType: listing.propertyType,
        surface: listing.surface,
        rooms: listing.rooms,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        location: listing.location,
        images: listing.images,
        status: listing.status,
        contactPhone: listing.contactPhone,
        contactEmail: listing.contactEmail,
      },
    });
  } catch (error) {
    console.error("Error fetching listing:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    // All roles can edit listings (USER can edit their own, MANAGER and ADMIN can edit any)
    const authResult = await requireAgencyRole(request, [
      "AGENCY_ADMIN",
      "AGENCY_MANAGER",
      "AGENCY_USER",
    ]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const agency = await getAgencyById(authResult.agencyId);
    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    const { listingId } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(listingId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const Listing = await getListingModel();

    // Verify listing belongs to agency - check both ObjectId and string formats
    const agencyIdStr = agency._id?.toString();
    const listing = await Listing.findOne({
      _id: new ObjectId(listingId),
      $or: [{ agencyId: agency._id }, { agencyId: agencyIdStr }],
    } as any);

    if (!listing) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = { updatedAt: new Date() };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.propertyType !== undefined)
      updateData.propertyType = body.propertyType;
    if (body.surface !== undefined) updateData.surface = body.surface;
    if (body.rooms !== undefined) updateData.rooms = body.rooms;
    if (body.bedrooms !== undefined) updateData.bedrooms = body.bedrooms;
    if (body.bathrooms !== undefined) updateData.bathrooms = body.bathrooms;
    
    // Status changes: only ADMIN and MANAGER can change status from pending to active
    if (body.status !== undefined) {
      // If trying to change from pending to active, require ADMIN or MANAGER role
      if (listing.status === "pending" && body.status === "active") {
        if (
          authResult.role !== "AGENCY_ADMIN" &&
          authResult.role !== "AGENCY_MANAGER"
        ) {
          return NextResponse.json(
            { error: "Seuls les administrateurs et managers peuvent valider les annonces" },
            { status: 403 }
          );
        }
      }
      updateData.status = body.status;
    }
    if (body.contactPhone !== undefined)
      updateData.contactPhone = body.contactPhone;
    if (body.contactEmail !== undefined)
      updateData.contactEmail = body.contactEmail;

    if (body.location !== undefined) {
      updateData.location = {
        ...listing.location,
        ...body.location,
      };
    }

    if (body.images !== undefined) {
      updateData.images = body.images;
    }

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
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    // All roles can delete listings
    const authResult = await requireAgencyRole(request, [
      "AGENCY_ADMIN",
      "AGENCY_MANAGER",
      "AGENCY_USER",
    ]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const agency = await getAgencyById(authResult.agencyId);
    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    const { listingId } = await params;

    if (!ObjectId.isValid(listingId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const Listing = await getListingModel();

    // Verify listing belongs to agency - check both ObjectId and string formats
    const agencyIdStr = agency._id?.toString();
    const listing = await Listing.findOne({
      _id: new ObjectId(listingId),
      $or: [{ agencyId: agency._id }, { agencyId: agencyIdStr }],
    } as any);

    if (!listing) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 }
      );
    }

    await Listing.deleteOne({ _id: new ObjectId(listingId) });

    // Decrement agency listings count
    const Agency = await getAgencyModel();
    await Agency.updateOne(
      { _id: agency._id },
      { $inc: { listingsCount: -1 } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting listing:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
