"use client";

import { NewsletterPopupGuest } from "@/components/newsletter-popup-guest";
import { NewsletterPopupUser } from "@/components/newsletter-popup-user";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export function NewsletterPopups() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Don't show popups on these pages
  const excludedPaths = [
    "/login",
    "/register",
    "/register/agency",
    "/register/agency/pending",
  ];
  const isExcludedPath =
    excludedPaths.includes(pathname) ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/agency");

  // Don't show popups for admin or agency users
  const userRole = session?.user?.role;
  const shouldShowUserPopup =
    session && userRole !== "admin" && userRole !== "agency";

  // Don't show popups on excluded paths
  if (isExcludedPath) {
    return null;
  }

  // Show guest popup only if not logged in
  // Show user popup only if logged in and not admin/agency
  return (
    <>
      {status !== "loading" && !session && <NewsletterPopupGuest />}
      {status !== "loading" && shouldShowUserPopup && <NewsletterPopupUser />}
    </>
  );
}
