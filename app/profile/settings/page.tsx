"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Lock,
  Bell,
  Moon,
  Sun,
  Loader2,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  darkMode: boolean;
  emailPreferences: {
    newsletter: boolean;
    alerts: boolean;
    marketing: boolean;
    messages: boolean;
  };
}

export default function ProfileSettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingNewsletter, setIsSavingNewsletter] = useState(false);
  const [isSavingMessages, setIsSavingMessages] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  // Form data
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    darkMode: false,
    emailPreferences: {
      newsletter: false,
      alerts: true,
      marketing: false,
      messages: true, // Par défaut activé
    },
  });

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    // Only allow regular users (not admin or agency)
    if (session.user?.role === "admin" || session.user?.role === "agency") {
      router.push("/");
      return;
    }

    fetchProfile();
  }, [session, status, router]);


  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();

      if (data.success) {
        setProfile(data.user);
        // Sync theme with user preference after a small delay to ensure theme is ready
        setTimeout(() => {
          if (data.user.darkMode) {
            setTheme("dark");
          } else {
            setTheme("light");
          }
        }, 100);
      } else {
        toast.error("Erreur lors du chargement du profil");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Profil mis à jour avec succès");
        // Update session to reflect changes
        await update();
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setIsSavingPassword(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Mot de passe mis à jour avec succès");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleToggleNewsletter = async (checked: boolean) => {
    setIsSavingNewsletter(true);

    try {
      const res = await fetch("/api/newsletter/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscribe: checked }),
      });

      const data = await res.json();

      if (res.ok) {
        setProfile((prev) => ({
          ...prev,
          emailPreferences: {
            ...prev.emailPreferences,
            newsletter: checked,
          },
        }));
        toast.success(
          checked ? "Abonnement à la newsletter activé" : "Désabonnement réussi"
        );
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSavingNewsletter(false);
    }
  };

  const handleToggleMessages = async (checked: boolean) => {
    setIsSavingMessages(true);

    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailPreferences: {
            messages: checked,
          },
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setProfile((prev) => ({
          ...prev,
          emailPreferences: {
            ...prev.emailPreferences,
            messages: checked,
          },
        }));
        toast.success(
          checked
            ? "Notifications par email activées"
            : "Notifications par email désactivées"
        );
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSavingMessages(false);
    }
  };

  const handleToggleDarkMode = async (checked: boolean) => {
    setIsSavingTheme(true);

    // Mise à jour optimiste
    setProfile((prev) => ({ ...prev, darkMode: checked }));
    // Apply theme immediately
    setTheme(checked ? "dark" : "light");

    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ darkMode: checked }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          checked ? "Mode sombre activé" : "Mode clair activé"
        );
      } else {
        // Revert on error
        setProfile((prev) => ({ ...prev, darkMode: !checked }));
        setTheme(checked ? "light" : "dark");
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      // Revert on error
      setProfile((prev) => ({ ...prev, darkMode: !checked }));
      setTheme(checked ? "light" : "dark");
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSavingTheme(false);
    }
  };

  // Password validation
  const passwordChecks = {
    length: newPassword.length >= 8,
    match: newPassword === confirmPassword && confirmPassword.length > 0,
  };

  if (status === "loading" || isLoading) {
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

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/30 to-background">
      <Header />

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Paramètres</h1>
            <p className="text-muted-foreground">
              Gérez vos informations personnelles et préférences
            </p>
          </div>

          {/* 1. Informations utilisateur */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Informations utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={profile.firstName}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                      placeholder="Prénom"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={profile.lastName}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                      placeholder="Nom"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="pl-11"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isSaving} className="w-full md:w-auto">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 2. Communication */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Communication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="newsletter" className="text-base">
                    Newsletter
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recevez nos actualités et conseils par email
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="newsletter"
                    checked={profile.emailPreferences.newsletter}
                    onChange={(e) => handleToggleNewsletter(e.target.checked)}
                    disabled={isSavingNewsletter}
                    className="sr-only"
                  />
                  <div
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      profile.emailPreferences.newsletter
                        ? "bg-primary"
                        : "bg-gray-300 dark:bg-gray-600"
                    } ${isSavingNewsletter ? "opacity-50 cursor-wait" : ""}`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                        profile.emailPreferences.newsletter
                          ? "translate-x-6"
                          : "translate-x-0"
                      }`}
                    >
                      {isSavingNewsletter && (
                        <Loader2 className="w-full h-full animate-spin text-primary p-1" />
                      )}
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="space-y-1">
                  <Label htmlFor="messages" className="text-base">
                    Notifications de messages
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recevez un email lorsqu'un nouveau message arrive
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="messages"
                    checked={profile.emailPreferences.messages ?? true}
                    onChange={(e) => handleToggleMessages(e.target.checked)}
                    disabled={isSavingMessages}
                    className="sr-only"
                  />
                  <div
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      profile.emailPreferences.messages ?? true
                        ? "bg-primary"
                        : "bg-gray-300 dark:bg-gray-600"
                    } ${isSavingMessages ? "opacity-50 cursor-wait" : ""}`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                        profile.emailPreferences.messages ?? true
                          ? "translate-x-6"
                          : "translate-x-0"
                      }`}
                    >
                      {isSavingMessages && (
                        <Loader2 className="w-full h-full animate-spin text-primary p-1" />
                      )}
                    </div>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* 3. Sécurité */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-11 pr-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-11 pr-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-11 pr-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                {newPassword.length > 0 && (
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
                  disabled={
                    isSavingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    !passwordChecks.length ||
                    !passwordChecks.match
                  }
                  className="w-full md:w-auto"
                >
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Changer le mot de passe
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 4. Affichage */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {theme === "dark" ? (
                  <Moon className="w-5 h-5 text-primary" />
                ) : (
                  <Sun className="w-5 h-5 text-primary" />
                )}
                Affichage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="darkMode" className="text-base">
                    Mode sombre
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Activez le thème sombre pour une meilleure expérience en faible luminosité
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="darkMode"
                    checked={profile.darkMode}
                    onChange={(e) => handleToggleDarkMode(e.target.checked)}
                    disabled={isSavingTheme}
                    className="sr-only"
                  />
                  <div
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      profile.darkMode
                        ? "bg-primary"
                        : "bg-gray-300 dark:bg-gray-600"
                    } ${isSavingTheme ? "opacity-50 cursor-wait" : ""}`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                        profile.darkMode ? "translate-x-6" : "translate-x-0"
                      }`}
                    >
                      {isSavingTheme && (
                        <Loader2 className="w-full h-full animate-spin text-primary p-1" />
                      )}
                    </div>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

