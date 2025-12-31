"use client";

import { Button } from "@/components/ui/button";
import { useCallback } from "react";

interface ListingActionButtonProps {
  listingId: string;
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  asChild?: boolean;
}

export function ListingActionButton({
  listingId,
  href,
  onClick,
  children,
  variant = "default",
  size = "default",
  className,
  asChild = false,
}: ListingActionButtonProps) {
  const handleClick = useCallback(async () => {
    // Track click for agency listings
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

  if (asChild && href) {
    return (
      <Button
        asChild
        variant={variant}
        size={size}
        className={className}
      >
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={handleClick}
        >
          {children}
        </a>
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}

// Hook pour tracker les clics sur n'importe quel élément
export function useListingClickTracker(listingId: string) {
  return useCallback(async () => {
    try {
      await fetch(`/api/listings/${listingId}/click`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error tracking click:", error);
    }
  }, [listingId]);
}

