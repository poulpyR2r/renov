"use client";

import { useCallback } from "react";
import { ListingCard } from "./listing-card";

interface TrackedListingCardProps {
  listing: any;
  variant?: "default" | "compact" | "featured";
}

export function TrackedListingCard({
  listing,
  variant,
}: TrackedListingCardProps) {
  const handleClick = useCallback(async () => {
    // Track click when user clicks on the listing card
    if (listing._id) {
      try {
        await fetch(`/api/listings/${listing._id}/click`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Error tracking click:", error);
      }
    }
  }, [listing._id]);

  return (
    <div onClick={handleClick}>
      <ListingCard listing={listing} variant={variant} />
    </div>
  );
}

