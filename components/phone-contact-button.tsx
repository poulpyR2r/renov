"use client";

import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { trackContact } from "@/lib/track-contact";

interface PhoneContactButtonProps {
  listingId: string;
  phone: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
}

export function PhoneContactButton({
  listingId,
  phone,
  className,
  variant = "outline",
}: PhoneContactButtonProps) {
  const handleClick = () => {
    // Tracker le contact en arrière-plan
    trackContact(listingId, "phone_click");
    
    // Naviguer vers le lien tel:
    window.location.href = `tel:${phone}`;
  };

  return (
    <Button
      onClick={handleClick}
      size="lg"
      variant={variant}
      className={className}
    >
      <Phone className="w-4 h-4 mr-2" />
      Voir le numéro
    </Button>
  );
}
