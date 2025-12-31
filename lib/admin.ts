import { auth } from "@/auth";
import { getUserByEmail, IUser } from "@/models/User";
import { NextResponse } from "next/server";

/**
 * Middleware to check if the current user is an admin
 * Returns NextResponse error if not admin, IUser if OK
 */
export async function requireAdmin(): Promise<NextResponse | IUser> {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  const user = await getUserByEmail(session.user.email);

  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Accès refusé - Droits administrateur requis" },
      { status: 403 }
    );
  }

  // User is admin, return user object
  return user;
}

/**
 * Check if user has admin role from session
 */
export function isAdmin(session: any): boolean {
  return session?.user?.role === "admin";
}
