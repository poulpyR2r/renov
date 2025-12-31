"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Home,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  XCircle,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  // Password validation
  const passwordChecks = {
    length: password.length >= 8,
    match: password === confirmPassword && confirmPassword.length > 0,
  };

  const isPasswordValid = passwordChecks.length && passwordChecks.match;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Veuillez vérifier les critères du mot de passe");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription");
        toast.error(data.error || "Erreur lors de l'inscription");
        return;
      }

      toast.success("Compte créé ! Connexion en cours...");

      // Auto login after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login");
      } else {
        router.push("/");
      }
    } catch (error) {
      setError("Une erreur est survenue");
      toast.error("Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    signIn("google", { callbackUrl: "/" });
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

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-3 gap-6">
          {/* Left Section - Registration Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-8 md:p-10 text-center text-white">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Home className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Créer un compte</h1>
                <p className="text-white/90 text-base">
                  Rejoignez RenovScout et sauvegardez vos favoris
                </p>
              </div>

              <CardContent className="p-6 md:p-8 space-y-6">
                {/* Google Signup */}
                <Button
                  onClick={handleGoogleSignup}
                  variant="outline"
                  size="lg"
                  className="w-full gap-3 h-12 rounded-xl border-2 hover:bg-muted/50 transition-all"
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
                  S'inscrire avec Google
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground font-medium">
                      Ou par email
                    </span>
                  </div>
                </div>

                {/* Registration Form */}
                <form onSubmit={handleRegister} className="space-y-5">
                  {error && (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                      {error}
                    </div>
                  )}

                  {/* Name */}
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Nom complet"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 pl-12 pr-4 rounded-xl border-2 focus:border-primary transition-colors"
                      required
                      minLength={2}
                    />
                  </div>

                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-12 pr-4 rounded-xl border-2 focus:border-primary transition-colors"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pl-12 pr-12 rounded-xl border-2 focus:border-primary transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmer le mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 pl-12 pr-12 rounded-xl border-2 focus:border-primary transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Password Requirements */}
                  {password.length > 0 && (
                    <div className="space-y-2 text-sm bg-muted/50 p-4 rounded-xl">
                      <div
                        className={`flex items-center gap-2 transition-colors ${
                          passwordChecks.length
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {passwordChecks.length ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span>Au moins 8 caractères</span>
                      </div>
                      {confirmPassword.length > 0 && (
                        <div
                          className={`flex items-center gap-2 transition-colors ${
                            passwordChecks.match
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-destructive"
                          }`}
                        >
                          {passwordChecks.match ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          <span>Les mots de passe correspondent</span>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                    disabled={isLoading || !isPasswordValid || !name || !email}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      "Créer mon compte"
                    )}
                  </Button>
                </form>

                {/* Login Link */}
                <p className="text-center text-sm text-muted-foreground">
                  Déjà un compte ?{" "}
                  <Link
                    href="/login"
                    className="text-orange-600 font-semibold hover:text-orange-700 hover:underline transition-colors"
                  >
                    Se connecter
                  </Link>
                </p>

                {/* Legal Text */}
                <p className="text-xs text-center text-muted-foreground leading-relaxed">
                  En créant un compte, vous acceptez nos{" "}
                  <Link
                    href="/terms"
                    className="text-orange-600 hover:text-orange-700 underline font-medium"
                  >
                    conditions d'utilisation
                  </Link>{" "}
                  et notre{" "}
                  <Link
                    href="/privacy"
                    className="text-orange-600 hover:text-orange-700 underline font-medium"
                  >
                    politique de confidentialité
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Section - Agency CTA */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-orange-950/30 h-full">
              <CardContent className="p-6 md:p-8 flex flex-col h-full">
                <div className="flex-1 flex flex-col justify-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg mx-auto">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-foreground">
                      Vous êtes une agence immobilière ?
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Créez un compte professionnel pour publier vos annonces
                    </p>
                  </div>

                  <Button
                    asChild
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    <Link href="/register/agency">
                      Inscription Pro
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
