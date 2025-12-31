import { NextRequest, NextResponse } from "next/server";
import { requireAgencyRole } from "@/lib/agency-rbac";
import {
  getAgencyMembers,
  createAgencyMembership,
  updateAgencyMembershipRole,
  removeAgencyMembership,
} from "@/models/AgencyMembership";
import { getUserByEmail, getUserModel } from "@/models/User";
import { ObjectId } from "mongodb";

/**
 * GET /api/agency/members
 * Get all members of the agency (ADMIN only)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAgencyRole(request, ["AGENCY_ADMIN"]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const members = await getAgencyMembers(authResult.agencyId);

    // Fetch user details for each member
    const User = await getUserModel();
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const user = await User.findOne({ _id: member.userId });
        return {
          _id: member._id?.toString(),
          userId: member.userId.toString(),
          role: member.role,
          email: user?.email || "",
          name: user?.name || "",
          createdAt: member.createdAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      members: membersWithDetails,
    });
  } catch (error) {
    console.error("Error fetching agency members:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agency/members
 * Invite/add a user to the agency (ADMIN only)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAgencyRole(request, ["AGENCY_ADMIN"]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { email, firstName, lastName, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email et rôle requis" },
        { status: 400 }
      );
    }

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Prénom et nom requis" },
        { status: 400 }
      );
    }

    if (!["AGENCY_ADMIN", "AGENCY_MANAGER", "AGENCY_USER"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    // Get agency info for email
    const { getAgencyById } = await import("@/models/Agency");
    const agency = await getAgencyById(authResult.agencyId);
    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    // Find user by email
    const user = await getUserByEmail(email);

    let userId: string;
    let isNewUser = false;
    let temporaryPassword: string | null = null;

    if (user && user._id) {
      // CAS 1: User exists - just create membership
      userId = user._id.toString();

      // Check if user already has membership
      const { getUserAgencyRole } = await import("@/models/AgencyMembership");
      const existingRole = await getUserAgencyRole(userId, authResult.agencyId);
      if (existingRole) {
        return NextResponse.json(
          { error: "Cet utilisateur est déjà membre de l'agence" },
          { status: 400 }
        );
      }

      // Update user's name if provided
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) {
        const User = await getUserModel();
        await User.updateOne(
          { _id: user._id },
          { $set: { name: fullName, updatedAt: new Date() } }
        );
      }
    } else {
      // CAS 2: User doesn't exist - create user with temporary password
      const { generateTemporaryPassword } = await import("@/lib/password");
      const { createUserWithPassword } = await import("@/models/User");
      
      temporaryPassword = generateTemporaryPassword();
      const fullName = `${firstName} ${lastName}`.trim();

      const createResult = await createUserWithPassword({
        email,
        password: temporaryPassword,
        name: fullName,
        mustChangePassword: true,
      });

      if (!createResult.success || !createResult.user?._id) {
        return NextResponse.json(
          { error: createResult.error || "Erreur lors de la création du compte" },
          { status: 500 }
        );
      }

      userId = createResult.user._id.toString();
      isNewUser = true;

      // Send invitation email with temporary password
      const { sendAgencyMemberInvitationEmail } = await import("@/lib/email");
      sendAgencyMemberInvitationEmail(
        email,
        agency.companyName,
        temporaryPassword,
        role
      ).catch((error) => {
        console.error("Failed to send invitation email:", error);
        // Don't fail the request if email fails
      });
    }

    // Create membership
    const success = await createAgencyMembership(
      userId,
      authResult.agencyId,
      role as "AGENCY_ADMIN" | "AGENCY_MANAGER" | "AGENCY_USER"
    );

    if (!success) {
      return NextResponse.json(
        { error: "Erreur lors de l'ajout du membre" },
        { status: 500 }
      );
    }

    // Update user's agencyId and role if not set (backward compatibility)
    const User = await getUserModel();
    await User.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          agencyId: new ObjectId(authResult.agencyId),
          role: "agency",
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: isNewUser
        ? "Invitation envoyée par email"
        : "Utilisateur existant ajouté à l'agence",
      isNewUser,
    });
  } catch (error) {
    console.error("Error adding agency member:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du membre" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agency/members
 * Update a member's role (ADMIN only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAgencyRole(request, ["AGENCY_ADMIN"]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId et rôle requis" },
        { status: 400 }
      );
    }

    if (!["AGENCY_ADMIN", "AGENCY_MANAGER", "AGENCY_USER"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    // Prevent changing own role (security)
    if (userId === authResult.user._id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier votre propre rôle" },
        { status: 400 }
      );
    }

    const success = await updateAgencyMembershipRole(
      userId,
      authResult.agencyId,
      role as "AGENCY_ADMIN" | "AGENCY_MANAGER" | "AGENCY_USER"
    );

    if (!success) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du rôle" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Rôle mis à jour avec succès",
    });
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du rôle" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agency/members
 * Remove a member from the agency (ADMIN only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAgencyRole(request, ["AGENCY_ADMIN"]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId requis" },
        { status: 400 }
      );
    }

    // Prevent removing yourself
    if (userId === authResult.user._id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous retirer de l'agence" },
        { status: 400 }
      );
    }

    const success = await removeAgencyMembership(userId, authResult.agencyId);

    if (!success) {
      return NextResponse.json(
        { error: "Erreur lors de la suppression du membre" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Membre retiré avec succès",
    });
  } catch (error) {
    console.error("Error removing agency member:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du membre" },
      { status: 500 }
    );
  }
}

