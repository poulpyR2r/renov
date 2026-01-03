"use client";

import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { trackContact } from "@/lib/track-contact";

interface EmailContactButtonProps {
  listingId: string;
  email: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
}

export function EmailContactButton({
  listingId,
  email,
  className,
  variant = "outline",
}: EmailContactButtonProps) {
  const handleClick = () => {
    // Tracker le contact en arrière-plan
    trackContact(listingId, "email_click");
    
    // Naviguer vers le lien mailto:
    window.location.href = `mailto:${email}`;
  };

  return (
    <Button
      onClick={handleClick}
      size="lg"
      variant={variant}
      className={className}
    >
      <Mail className="w-4 h-4 mr-2" />
      Envoyer un email
    </Button>
  );
}
