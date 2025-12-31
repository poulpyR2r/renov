"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { X, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function NewsletterPopupUser() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (status === "loading" || !session) return;

    // Don't show popup for admin or agency users
    const userRole = session.user?.role;
    if (userRole === "admin" || userRole === "agency") {
      setHasChecked(true);
      return;
    }

    // Check if user has already seen this popup
    const hasSeenPopup = localStorage.getItem(
      `newsletter_user_popup_seen_${session.user?.email}`
    );
    if (hasSeenPopup) {
      setHasChecked(true);
      return;
    }

    // Check subscription status
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/newsletter/status");
        const data = await res.json();

        if (data.success) {
          setIsSubscribed(data.isSubscribed || false);
          // Only show popup if user hasn't made a choice yet
          if (!data.isSubscribed && !hasSeenPopup) {
            // Show popup after 2 seconds
            setTimeout(() => {
              setIsOpen(true);
            }, 2000);
          }
        }
      } catch (error) {
        console.error("Error checking newsletter status:", error);
      } finally {
        setHasChecked(true);
      }
    };

    checkStatus();
  }, [session, status]);

  const handleToggle = async (subscribe: boolean) => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/newsletter/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscribe }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSubscribed(subscribe);
        toast.success(
          subscribe
            ? "Abonnement réussi !"
            : "Désabonnement effectué avec succès"
        );
        localStorage.setItem(
          `newsletter_user_popup_seen_${session?.user?.email}`,
          "true"
        );
        setIsOpen(false);
      } else {
        toast.error(data.error || "Une erreur est survenue");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (session?.user?.email) {
      localStorage.setItem(
        `newsletter_user_popup_seen_${session.user.email}`,
        "true"
      );
    }
  };

  // Don't show for admin or agency
  const userRole = session?.user?.role;
  if (userRole === "admin" || userRole === "agency") return null;

  if (!isOpen || status === "loading" || !session || !hasChecked) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-card border rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-fade-in-up">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Recevoir la newsletter ?</h2>
              <p className="text-sm text-muted-foreground">
                Restez informé de nos meilleures trouvailles
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Souhaitez-vous recevoir notre newsletter avec les meilleures
              opportunités de rénovation ?
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => handleToggle(true)}
                className="flex-1"
                disabled={isLoading}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Oui, s'abonner
              </Button>
              <Button
                onClick={() => handleToggle(false)}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                Non merci
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Vous pourrez modifier vos préférences à tout moment dans votre
              profil.{" "}
              <a
                href="/privacy"
                target="_blank"
                className="text-primary hover:underline"
              >
                Politique de confidentialité
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
