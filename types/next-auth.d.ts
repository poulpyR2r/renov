import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      googleId?: string;
      role: "user" | "admin" | "agency";
      agencyId?: string;
      agencyStatus?: "pending" | "verified" | "rejected" | "suspended";
      mustChangePassword?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    googleId?: string;
    role?: "user" | "admin" | "agency";
    agencyId?: string;
    agencyStatus?: "pending" | "verified" | "rejected" | "suspended";
    mustChangePassword?: boolean;
  }
}
