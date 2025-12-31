"use client";

import { useCallback } from "react";

interface ListingClickTrackerProps {
  listingId: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ListingClickTracker({
  listingId,
  children,
  className,
  onClick,
}: ListingClickTrackerProps) {
  const handleClick = useCallback(async () => {
    // Track click
    try {
      await fetch(`/api/listings/${listingId}/click`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error tracking click:", error);
    }

    // Call original onClick if provided
    if (onClick) {
      onClick();
    }
  }, [listingId, onClick]);

  return (
    <div onClick={handleClick} className={className}>
      {children}
    </div>
  );
}

