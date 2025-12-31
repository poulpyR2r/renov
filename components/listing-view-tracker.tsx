"use client";

import { useEffect } from "react";

interface ListingViewTrackerProps {
  listingId: string;
}

export function ListingViewTracker({ listingId }: ListingViewTrackerProps) {
  useEffect(() => {
    // Track view on mount
    const trackView = async () => {
      try {
        await fetch(`/api/listings/${listingId}/view`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Error tracking view:", error);
      }
    };

    trackView();
  }, [listingId]);

  return null;
}
