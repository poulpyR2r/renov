"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Home, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const returnTo = searchParams.get("returnTo");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) {
      handlePostLoginRedirect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handlePostLoginRedirect = async () => {
    if (!returnTo) {
      router.push(callbackUrl);
      return;
    }

    try {
      const returnData = JSON.parse(decodeURIComponent(returnTo));

      if (returnData.type === "conversation") {
        // Créer la conversation
        const response = await fetch(
          `/api/listings/${returnData.listingId}/conversations`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              firstMessage: returnData.draftMessage || undefined,
            }),
          }
        );

        const data = await response.json();

        if (response.ok && data.conversationId) {
          // Rediriger vers la conversation
          router.push(`/profile/messages/${data.conversationId}`);
        } else {
          // En cas d'erreur, rediriger vers la page d'accueil
          router.push("/");
        }
      } else {
        router.push(callbackUrl);
      }
    } catch (error) {
      console.error("Error handling returnTo:", error);
      router.push(callbackUrl);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
        toast.error("Identifiants incorrects");
      } else {
        toast.success("Connexion réussie !");
        // La redirection sera gérée par useEffect
        
        // Wait a bit for session to be updated, then check and redirect
        setTimeout(async () => {
          const updatedSession = await getSession();
          
          // If user must change password, redirect to change-password page
          if (updatedSession?.user?.mustChangePassword) {
            window.location.href = "/change-password";
          } else {
            // Use window.location.href to ensure middleware runs
            window.location.href = callbackUrl;
          }
        }, 100);
      }
    } catch (error) {
      setError("Une erreur est survenue");
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/30 to-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/30 to-background">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-xl overflow-hidden">
          {/* Header gradient */}
          <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Connexion</h1>
            <p className="text-white/80 text-sm">
              Accédez à vos favoris et personnalisez votre recherche
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Google Login */}
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              size="lg"
              className="w-full gap-3 h-12 rounded-xl"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuer avec Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Ou par email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-11 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-11 pr-11 rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-12 rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            {/* Register Link */}
            <p className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link
                href="/register"
                className="text-primary font-medium hover:underline"
              >
                Créer un compte
              </Link>
            </p>

            <p className="text-xs text-center text-muted-foreground">
              En vous connectant, vous acceptez nos{" "}
              <Link href="/terms" className="underline hover:text-primary">
                conditions d'utilisation
              </Link>{" "}
              et notre{" "}
              <Link href="/privacy" className="underline hover:text-primary">
                politique de confidentialité
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
