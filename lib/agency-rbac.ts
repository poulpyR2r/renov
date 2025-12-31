import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail } from "@/models/User";
import { getAgencyById } from "@/models/Agency";
import {
  AgencyRole,
  getUserAgencyRole,
  hasAgencyRole,
  getUserAgencies,
} from "@/models/AgencyMembership";

export interface AgencyAuthResult {
  user: {
    _id: string;
    email: string;
  };
  agencyId: string;
  role: AgencyRole;
}

/**
 * Require user to be authenticated and have a specific role in an agency
 */
export async function requireAgencyRole(
  request: NextRequest,
  requiredRoles: AgencyRole[],
  agencyId?: string
): Promise<NextResponse | AgencyAuthResult> {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await getUserByEmail(session.user.email);
  if (!user || !user._id) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  // Get agency ID - from param if provided, otherwise from user's first agency
  let targetAgencyId: string;
  if (agencyId) {
    targetAgencyId = agencyId;
  } else {
    // Get user's agencies from memberships
    const userAgencies = await getUserAgencies(user._id.toString());
    if (userAgencies.length === 0) {
      // Fallback to legacy agencyId from user object
      if (user.agencyId) {
        targetAgencyId = user.agencyId.toString();
      } else {
        return NextResponse.json(
          { error: "Vous n'appartenez à aucune agence" },
          { status: 403 }
        );
      }
    } else {
      targetAgencyId = userAgencies[0];
    }
  }

  // Verify agency exists
  const agency = await getAgencyById(targetAgencyId);
  if (!agency) {
    return NextResponse.json({ error: "Agence non trouvée" }, { status: 404 });
  }

  // Check role
  const userRole = await getUserAgencyRole(user._id.toString(), targetAgencyId);

  // Special case: if user is the owner, they are automatically ADMIN
  const isOwner = agency.ownerId.toString() === user._id.toString();
  const effectiveRole: AgencyRole | null = isOwner ? "AGENCY_ADMIN" : userRole;

  if (!effectiveRole || !requiredRoles.includes(effectiveRole)) {
    return NextResponse.json(
      {
        error: `Accès refusé. Rôles requis: ${requiredRoles.join(", ")}`,
      },
      { status: 403 }
    );
  }

  return {
    user: {
      _id: user._id.toString(),
      email: user.email,
    },
    agencyId: targetAgencyId,
    role: effectiveRole,
  };
}

/**
 * Get user's agency ID from memberships or legacy field
 */
export async function getUserAgencyId(userId: string): Promise<string | null> {
  const userAgencies = await getUserAgencies(userId);
  if (userAgencies.length > 0) {
    return userAgencies[0];
  }
  return null;
}

/**
 * Get user's agency (helper for backward compatibility)
 */
export async function getAgencyForUser(userId: string) {
  const { getAgencyById } = await import("@/models/Agency");
  const agencyId = await getUserAgencyId(userId);
  if (!agencyId) {
    // Fallback to legacy ownerId lookup
    const { getAgencyByOwnerId } = await import("@/models/Agency");
    return await getAgencyByOwnerId(userId);
  }
  return await getAgencyById(agencyId);
}

/**
 * Get user's agency role (helper for frontend/context)
 */
export async function getUserAgencyRoleFromSession(
  agencyId: string
): Promise<AgencyRole | null> {
  const session = await auth();
  if (!session?.user?.email) {
    return null;
  }

  const user = await getUserByEmail(session.user.email);
  if (!user || !user._id) {
    return null;
  }

  const agency = await getAgencyById(agencyId);
  if (!agency) {
    return null;
  }

  // Owner is automatically ADMIN
  if (agency.ownerId.toString() === user._id.toString()) {
    return "AGENCY_ADMIN";
  }

  return await getUserAgencyRole(user._id.toString(), agencyId);
}

