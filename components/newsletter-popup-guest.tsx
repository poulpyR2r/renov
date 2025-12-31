"use client";

import { useState, useEffect } from "react";
import { X, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function NewsletterPopupGuest() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    // Check if popup was already shown (stored in localStorage)
    const hasSeenPopup = localStorage.getItem("newsletter_popup_seen");
    if (!hasSeenPopup) {
      // Show popup after 3 seconds
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    if (!consentGiven) {
      toast.error("Vous devez accepter les conditions pour vous abonner");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consentGiven: true }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Abonnement réussi ! Merci de votre confiance.");
        localStorage.setItem("newsletter_popup_seen", "true");
        setIsOpen(false);
        setEmail("");
      } else {
        toast.error(data.error || "Erreur lors de l'abonnement");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("newsletter_popup_seen", "true");
  };

  if (!isOpen) return null;

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
              <h2 className="text-xl font-bold">Restez informé !</h2>
              <p className="text-sm text-muted-foreground">
                Recevez nos meilleures trouvailles
              </p>
            </div>
          </div>

          <form onSubmit={handleSubscribe} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Votre adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-1"
                  required
                />
                <span className="text-muted-foreground">
                  J'accepte de recevoir la newsletter et je comprends que je
                  peux me désabonner à tout moment.{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Politique de confidentialité
                  </a>
                </span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !consentGiven}
            >
              {isLoading ? "Abonnement..." : "S'abonner"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Conformément au RGPD, vos données sont protégées
          </p>
        </div>
      </div>
    </div>
  );
}

