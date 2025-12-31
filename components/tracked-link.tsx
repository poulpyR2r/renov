"use client";

import { useCallback } from "react";

interface TrackedLinkProps {
  listingId: string;
  href: string;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

export function TrackedLink({
  listingId,
  href,
  children,
  className,
  target = "_blank",
  rel = "noopener noreferrer",
}: TrackedLinkProps) {
  const handleClick = useCallback(async () => {
    // Track click for agency listings
    try {
      await fetch(`/api/listings/${listingId}/click`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error tracking click:", error);
    }
  }, [listingId]);

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
