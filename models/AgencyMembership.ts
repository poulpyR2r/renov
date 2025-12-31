import { dbConnect } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export type AgencyRole = "AGENCY_ADMIN" | "AGENCY_MANAGER" | "AGENCY_USER";

export interface IAgencyMembership {
  _id?: ObjectId;
  userId: ObjectId;
  agencyId: ObjectId;
  role: AgencyRole;
  createdAt: Date;
  updatedAt: Date;
}

let indexesInitialized = false;

export async function getAgencyMembershipModel() {
  const db = await dbConnect();
  const collection = db.collection<IAgencyMembership>("agency_memberships");

  if (!indexesInitialized) {
    await collection.createIndex({ userId: 1, agencyId: 1 }, { unique: true });
    await collection.createIndex({ agencyId: 1 });
    await collection.createIndex({ userId: 1 });
    indexesInitialized = true;
  }

  return collection;
}

/**
 * Get user's role in an agency
 */
export async function getUserAgencyRole(
  userId: string,
  agencyId: string
): Promise<AgencyRole | null> {
  const Membership = await getAgencyMembershipModel();
  const membership = await Membership.findOne({
    userId: new ObjectId(userId),
    agencyId: new ObjectId(agencyId),
  });

  return membership?.role || null;
}

/**
 * Check if user has one of the required roles in the agency
 */
export async function hasAgencyRole(
  userId: string,
  agencyId: string,
  requiredRoles: AgencyRole[]
): Promise<boolean> {
  const role = await getUserAgencyRole(userId, agencyId);
  return role ? requiredRoles.includes(role) : false;
}

/**
 * Create a membership
 */
export async function createAgencyMembership(
  userId: string,
  agencyId: string,
  role: AgencyRole
): Promise<boolean> {
  try {
    const Membership = await getAgencyMembershipModel();
    await Membership.insertOne({
      userId: new ObjectId(userId),
      agencyId: new ObjectId(agencyId),
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error("Error creating agency membership:", error);
    return false;
  }
}

/**
 * Update user's role in an agency
 */
export async function updateAgencyMembershipRole(
  userId: string,
  agencyId: string,
  newRole: AgencyRole
): Promise<boolean> {
  try {
    const Membership = await getAgencyMembershipModel();
    const result = await Membership.updateOne(
      {
        userId: new ObjectId(userId),
        agencyId: new ObjectId(agencyId),
      },
      {
        $set: {
          role: newRole,
          updatedAt: new Date(),
        },
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Error updating agency membership:", error);
    return false;
  }
}

/**
 * Get all members of an agency
 */
export async function getAgencyMembers(
  agencyId: string
): Promise<IAgencyMembership[]> {
  const Membership = await getAgencyMembershipModel();
  return Membership.find({
    agencyId: new ObjectId(agencyId),
  })
    .sort({ createdAt: 1 })
    .toArray();
}

/**
 * Remove a member from an agency
 */
export async function removeAgencyMembership(
  userId: string,
  agencyId: string
): Promise<boolean> {
  try {
    const Membership = await getAgencyMembershipModel();
    const result = await Membership.deleteOne({
      userId: new ObjectId(userId),
      agencyId: new ObjectId(agencyId),
    });
    return result.deletedCount > 0;
  } catch (error) {
    console.error("Error removing agency membership:", error);
    return false;
  }
}

/**
 * Get all agencies a user belongs to
 */
export async function getUserAgencies(userId: string): Promise<string[]> {
  const Membership = await getAgencyMembershipModel();
  const memberships = await Membership.find({
    userId: new ObjectId(userId),
  }).toArray();

  return memberships.map((m) => m.agencyId.toString());
}

