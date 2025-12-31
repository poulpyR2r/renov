"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Loader2,
  CheckCircle2,
  Upload,
  FileText,
  Shield,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Info,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4;

export default function AgencyRegisterPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Compte utilisateur
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",

    // Informations entreprise
    companyName: "",
    tradeName: "",
    legalForm: "",
    siret: "",
    rcs: "",
    capital: "",

    // Adresse
    street: "",
    postalCode: "",
    city: "",

    // Carte professionnelle
    cardNumber: "",
    cardType: "",
    cardPrefecture: "",
    cardExpiration: "",
    guaranteeProvider: "",
    guaranteeAmount: "",

    // Assurance
    insuranceProvider: "",
    insurancePolicyNumber: "",
    insuranceCoverage: "",
    insuranceExpiration: "",

    // Acceptations
    acceptTerms: false,
    acceptDataProcessing: false,
    certifyInfo: false,
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.acceptTerms || !formData.acceptDataProcessing || !formData.certifyInfo) {
      toast.error("Veuillez accepter toutes les conditions");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register/agency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'inscription");
        return;
      }

      toast.success("Demande envoyée ! Nous examinerons votre dossier sous 48h.");
      router.push("/register/agency/pending");
    } catch (error) {
      toast.error("Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (currentStep: Step): boolean => {
    switch (currentStep) {
      case 1:
        return !!(
          formData.name &&
          formData.email &&
          formData.password &&
          formData.password === formData.confirmPassword &&
          formData.password.length >= 8
        );
      case 2:
        return !!(
          formData.companyName &&
          formData.legalForm &&
          formData.siret &&
          formData.siret.length === 14 &&
          formData.street &&
          formData.postalCode &&
          formData.city
        );
      case 3:
        return !!(
          formData.cardNumber &&
          formData.cardType &&
          formData.cardPrefecture &&
          formData.cardExpiration &&
          formData.guaranteeProvider &&
          formData.guaranteeAmount
        );
      case 4:
        return formData.acceptTerms && formData.acceptDataProcessing && formData.certifyInfo;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Inscription Agence</h1>
            <p className="text-muted-foreground">
              Créez votre compte professionnel pour publier des annonces
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {["Compte", "Entreprise", "Carte Pro", "Validation"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step > i + 1
                      ? "bg-emerald-500 text-white"
                      : step === i + 1
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${step >= i + 1 ? "text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
                {i < 3 && <div className={`w-4 h-0.5 ${step > i + 1 ? "bg-emerald-500" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Compte */}
            {step === 1 && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <Shield className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-semibold">Créer votre compte</h2>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom complet *</Label>
                      <Input
                        required
                        placeholder="Jean Dupont"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Téléphone *</Label>
                      <Input
                        type="tel"
                        required
                        placeholder="06 12 34 56 78"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Email professionnel *</Label>
                    <Input
                      type="email"
                      required
                      placeholder="contact@agence.fr"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mot de passe *</Label>
                      <Input
                        type="password"
                        required
                        placeholder="Minimum 8 caractères"
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirmer *</Label>
                      <Input
                        type="password"
                        required
                        placeholder="Confirmer le mot de passe"
                        value={formData.confirmPassword}
                        onChange={(e) => updateField("confirmPassword", e.target.value)}
                      />
                    </div>
                  </div>

                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-sm text-destructive">Les mots de passe ne correspondent pas</p>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" asChild>
                      <Link href="/register">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!validateStep(1)}
                    >
                      Continuer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Entreprise */}
            {step === 2 && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <Building2 className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-semibold">Informations de l'entreprise</h2>
                  </div>

                  <div className="space-y-2">
                    <Label>Raison sociale *</Label>
                    <Input
                      required
                      placeholder="SARL Mon Agence Immobilière"
                      value={formData.companyName}
                      onChange={(e) => updateField("companyName", e.target.value)}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom commercial</Label>
                      <Input
                        placeholder="Mon Agence"
                        value={formData.tradeName}
                        onChange={(e) => updateField("tradeName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Forme juridique *</Label>
                      <Select
                        value={formData.legalForm}
                        onValueChange={(v) => updateField("legalForm", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SARL">SARL</SelectItem>
                          <SelectItem value="SAS">SAS</SelectItem>
                          <SelectItem value="SASU">SASU</SelectItem>
                          <SelectItem value="EURL">EURL</SelectItem>
                          <SelectItem value="SA">SA</SelectItem>
                          <SelectItem value="SCI">SCI</SelectItem>
                          <SelectItem value="EI">Entreprise Individuelle</SelectItem>
                          <SelectItem value="Auto-entrepreneur">Auto-entrepreneur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SIRET * (14 chiffres)</Label>
                      <Input
                        required
                        placeholder="12345678901234"
                        maxLength={14}
                        value={formData.siret}
                        onChange={(e) => updateField("siret", e.target.value.replace(/\D/g, ""))}
                      />
                      {formData.siret && formData.siret.length !== 14 && (
                        <p className="text-xs text-destructive">Le SIRET doit contenir 14 chiffres</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Capital social (€)</Label>
                      <Input
                        type="number"
                        placeholder="10000"
                        value={formData.capital}
                        onChange={(e) => updateField("capital", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-4">
                    <h3 className="font-medium">Adresse du siège social</h3>
                    <div className="space-y-2">
                      <Label>Adresse *</Label>
                      <Input
                        required
                        placeholder="123 rue de l'Immobilier"
                        value={formData.street}
                        onChange={(e) => updateField("street", e.target.value)}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Code postal *</Label>
                        <Input
                          required
                          placeholder="75001"
                          value={formData.postalCode}
                          onChange={(e) => updateField("postalCode", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ville *</Label>
                        <Input
                          required
                          placeholder="Paris"
                          value={formData.city}
                          onChange={(e) => updateField("city", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={!validateStep(2)}
                    >
                      Continuer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Carte professionnelle */}
            {step === 3 && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <FileText className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-semibold">Carte professionnelle</h2>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium">Loi Hoguet</p>
                        <p className="mt-1">
                          Pour exercer l'activité d'agent immobilier en France, vous devez
                          détenir une carte professionnelle délivrée par la CCI.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Numéro de carte *</Label>
                      <Input
                        required
                        placeholder="CPI XXXX XXXX XXXX"
                        value={formData.cardNumber}
                        onChange={(e) => updateField("cardNumber", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type de carte *</Label>
                      <Select
                        value={formData.cardType}
                        onValueChange={(v) => updateField("cardType", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="T">T - Transaction</SelectItem>
                          <SelectItem value="G">G - Gestion</SelectItem>
                          <SelectItem value="TG">T+G - Transaction et Gestion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Préfecture de délivrance *</Label>
                      <Input
                        required
                        placeholder="CCI Paris"
                        value={formData.cardPrefecture}
                        onChange={(e) => updateField("cardPrefecture", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date d'expiration *</Label>
                      <Input
                        type="date"
                        required
                        value={formData.cardExpiration}
                        onChange={(e) => updateField("cardExpiration", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-4">
                    <h3 className="font-medium">Garantie financière</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Organisme de garantie *</Label>
                        <Input
                          required
                          placeholder="Ex: GALIAN, CEGC..."
                          value={formData.guaranteeProvider}
                          onChange={(e) => updateField("guaranteeProvider", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Montant de la garantie (€) *</Label>
                        <Input
                          type="number"
                          required
                          placeholder="110000"
                          value={formData.guaranteeAmount}
                          onChange={(e) => updateField("guaranteeAmount", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-4">
                    <h3 className="font-medium">Assurance RCP</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Assureur</Label>
                        <Input
                          placeholder="Nom de l'assureur"
                          value={formData.insuranceProvider}
                          onChange={(e) => updateField("insuranceProvider", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>N° de police</Label>
                        <Input
                          placeholder="Numéro de police"
                          value={formData.insurancePolicyNumber}
                          onChange={(e) => updateField("insurancePolicyNumber", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(4)}
                      disabled={!validateStep(3)}
                    >
                      Continuer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Validation */}
            {step === 4 && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <h2 className="text-xl font-semibold">Validation</h2>
                  </div>

                  {/* Résumé */}
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <h3 className="font-medium">Récapitulatif</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Entreprise</div>
                      <div className="font-medium">{formData.companyName}</div>
                      <div className="text-muted-foreground">SIRET</div>
                      <div className="font-medium">{formData.siret}</div>
                      <div className="text-muted-foreground">Carte pro</div>
                      <div className="font-medium">{formData.cardNumber}</div>
                      <div className="text-muted-foreground">Email</div>
                      <div className="font-medium">{formData.email}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-medium">Vérification requise</p>
                        <p className="mt-1">
                          Votre demande sera examinée sous 48h ouvrées. Nous pourrons vous
                          demander des documents justificatifs (Kbis, carte pro, attestation
                          d'assurance).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={formData.certifyInfo}
                        onChange={(e) => updateField("certifyInfo", e.target.checked)}
                        className="mt-1 rounded"
                      />
                      <span className="text-sm">
                        Je certifie l'exactitude des informations fournies et m'engage à
                        fournir les justificatifs sur demande *
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={(e) => updateField("acceptTerms", e.target.checked)}
                        className="mt-1 rounded"
                      />
                      <span className="text-sm">
                        J'accepte les{" "}
                        <Link href="/cgu" className="text-primary hover:underline" target="_blank">
                          conditions d'utilisation
                        </Link>{" "}
                        et les{" "}
                        <Link href="/cgu-pro" className="text-primary hover:underline" target="_blank">
                          conditions professionnelles
                        </Link>{" "}
                        *
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={formData.acceptDataProcessing}
                        onChange={(e) => updateField("acceptDataProcessing", e.target.checked)}
                        className="mt-1 rounded"
                      />
                      <span className="text-sm">
                        J'accepte le traitement de mes données conformément à la{" "}
                        <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                          politique de confidentialité
                        </Link>{" "}
                        *
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(3)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || !validateStep(4)}
                      className="gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Envoyer ma demande
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

