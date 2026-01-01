"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Save,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  Upload,
  CheckCircle2,
  X,
  Image as ImageIcon,
  Bell,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface AgencyData {
  _id: string;
  companyName: string;
  tradeName?: string;
  legalForm: string;
  siret: string;
  phone: string;
  email: string;
  website?: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  description?: string;
  logo?: string;
  status: string;
  requireApproval?: boolean;
  emailPreferences?: {
    messages: boolean;
  };
}

export default function AgencySettingsPage() {
  const [data, setData] = useState<AgencyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSavingApproval, setIsSavingApproval] = useState(false);
  const [isSavingMessages, setIsSavingMessages] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: "",
    tradeName: "",
    phone: "",
    email: "",
    website: "",
    address: {
      street: "",
      postalCode: "",
      city: "",
      country: "France",
    },
    description: "",
    logo: "",
    requireApproval: false,
    emailPreferences: { messages: true },
  });

  useEffect(() => {
    fetchAgencyData();
  }, []);

  const fetchAgencyData = async () => {
    try {
      const res = await fetch("/api/agency/me");
      const result = await res.json();
      if (result.success) {
        setUserRole(result.role);

        const settingsRes = await fetch("/api/agency/settings");
        const settingsResult = await settingsRes.json();
        if (settingsResult.success) {
          setData(settingsResult.agency);
          setFormData({
            companyName: settingsResult.agency.companyName || "",
            tradeName: settingsResult.agency.tradeName || "",
            phone: settingsResult.agency.phone || "",
            email: settingsResult.agency.email || "",
            website: settingsResult.agency.website || "",
            address: {
              street: settingsResult.agency.address?.street || "",
              postalCode: settingsResult.agency.address?.postalCode || "",
              city: settingsResult.agency.address?.city || "",
              country: settingsResult.agency.address?.country || "France",
            },
            description: settingsResult.agency.description || "",
            logo: settingsResult.agency.logo || "",
            requireApproval: settingsResult.agency.requireApproval || false,
            emailPreferences: settingsResult.agency.emailPreferences || {
              messages: true,
            },
          });
          setLogoPreview(settingsResult.agency.logo || null);
        }
      }
    } catch (error) {
      console.error("Error fetching agency data:", error);
      toast.error("Erreur lors du chargement");
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent non-admin from changing companyName
    if (userRole !== "AGENCY_ADMIN" && data) {
      formData.companyName = data.companyName;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/agency/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Informations mises à jour avec succès");
        fetchAgencyData();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
    setIsSaving(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez JPEG, PNG, WebP ou SVG");
      return;
    }

    // Vérifier la taille (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 2MB)");
      return;
    }

    setIsUploadingLogo(true);

    try {
      // Créer un FormData
      const formData = new FormData();
      formData.append("logo", file);

      // Upload
      const res = await fetch("/api/agency/upload-logo", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (res.ok && result.success) {
        // Mettre à jour le logo dans le formData
        setFormData((prev) => ({
          ...prev,
          logo: result.url,
        }));
        setLogoPreview(result.url);
        toast.success("Logo uploadé avec succès");
      } else {
        toast.error(result.error || "Erreur lors de l'upload");
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Erreur lors de l'upload du logo");
    }

    setIsUploadingLogo(false);
    // Réinitialiser l'input
    e.target.value = "";
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logo: "",
    }));
    setLogoPreview(null);
  };

  const handleRequireApprovalChange = async (checked: boolean) => {
    setIsSavingApproval(true);

    // Mise à jour optimiste
    setFormData((prev) => ({
      ...prev,
      requireApproval: checked,
    }));

    try {
      const res = await fetch("/api/agency/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          requireApproval: checked,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(
          checked
            ? "Validation des annonces activée"
            : "Validation des annonces désactivée"
        );
        // Mettre à jour les données
        if (data) {
          setData({ ...data, requireApproval: checked });
        }
      } else {
        // Restaurer l'ancienne valeur en cas d'erreur
        setFormData((prev) => ({
          ...prev,
          requireApproval: !checked,
        }));
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      // Restaurer l'ancienne valeur en cas d'erreur
      setFormData((prev) => ({
        ...prev,
        requireApproval: !checked,
      }));
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSavingApproval(false);
    }
  };

  const handleToggleMessages = async (checked: boolean) => {
    setIsSavingMessages(true);

    // Mise à jour optimiste
    setFormData((prev) => ({
      ...prev,
      emailPreferences: {
        ...prev.emailPreferences,
        messages: checked,
      },
    }));

    try {
      const res = await fetch("/api/agency/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          emailPreferences: {
            messages: checked,
          },
        }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(
          checked
            ? "Notifications par email activées"
            : "Notifications par email désactivées"
        );
        // Mettre à jour les données
        if (data) {
          setData({
            ...data,
            emailPreferences: { messages: checked },
          });
        }
      } else {
        // Restaurer l'ancienne valeur en cas d'erreur
        setFormData((prev) => ({
          ...prev,
          emailPreferences: {
            ...prev.emailPreferences,
            messages: !checked,
          },
        }));
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      // Restaurer l'ancienne valeur en cas d'erreur
      setFormData((prev) => ({
        ...prev,
        emailPreferences: {
          ...prev.emailPreferences,
          messages: !checked,
        },
      }));
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSavingMessages(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Erreur lors du chargement</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Paramètres de l'agence</h2>
        <p className="text-muted-foreground">
          Gérez les informations de votre agence immobilière
        </p>
      </div>

      {/* Status Badge */}
      {data.status === "verified" && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="font-medium text-emerald-700">
              Agence vérifiée
            </p>
            <p className="text-sm text-emerald-600">
              Votre agence a été vérifiée et est active
            </p>
          </div>
        </div>
      )}

      {userRole === "AGENCY_ADMIN" && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Validation des annonces
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="requireApproval" className="text-base">
                  Exiger une validation après soumission
                </Label>
                <p className="text-sm text-muted-foreground">
                  Si activé, les annonces créées par les utilisateurs de votre
                  agence devront être approuvées par un manager ou un
                  administrateur avant publication.
                </p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="requireApproval"
                  name="requireApproval"
                  checked={formData.requireApproval}
                  onChange={(e) =>
                    handleRequireApprovalChange(e.target.checked)
                  }
                  disabled={isSavingApproval}
                  className="sr-only"
                />
                <div
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    formData.requireApproval
                      ? "bg-orange-500"
                      : "bg-gray-300"
                  } ${isSavingApproval ? "opacity-50 cursor-wait" : ""}`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                      formData.requireApproval
                        ? "translate-x-6"
                        : "translate-x-0"
                    }`}
                  >
                    {isSavingApproval && (
                      <Loader2 className="w-full h-full animate-spin text-orange-500 p-1" />
                    )}
                  </div>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Communication */}
      {userRole === "AGENCY_ADMIN" && (
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
                  checked={formData.emailPreferences?.messages ?? true}
                  onChange={(e) => handleToggleMessages(e.target.checked)}
                  disabled={isSavingMessages}
                  className="sr-only"
                />
                <div
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    formData.emailPreferences?.messages ?? true
                      ? "bg-primary"
                      : "bg-gray-300"
                  } ${isSavingMessages ? "opacity-50 cursor-wait" : ""}`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                      formData.emailPreferences?.messages ?? true
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
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de l'entreprise */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Informations de l'entreprise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  Raison sociale <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                  disabled={userRole !== "AGENCY_ADMIN"}
                  placeholder="Ex: SASU Agence Immo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradeName">Nom commercial</Label>
                <Input
                  id="tradeName"
                  name="tradeName"
                  value={formData.tradeName}
                  onChange={handleInputChange}
                  disabled={userRole !== "AGENCY_ADMIN"}
                  placeholder="Si différent de la raison sociale"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forme juridique</Label>
                <Input value={data.legalForm} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Non modifiable après création
                </p>
              </div>

              <div className="space-y-2">
                <Label>SIRET</Label>
                <Input value={data.siret} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Non modifiable après création
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coordonnées */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Coordonnées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Téléphone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  disabled={userRole !== "AGENCY_ADMIN"}
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={userRole !== "AGENCY_ADMIN"}
                  placeholder="contact@agence.fr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Site web</Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleInputChange}
                disabled={userRole !== "AGENCY_ADMIN"}
                placeholder="https://www.agence.fr"
              />
            </div>
          </CardContent>
        </Card>

        {/* Adresse */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Adresse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address.street">
                Rue et numéro <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address.street"
                name="address.street"
                value={formData.address.street}
                onChange={handleInputChange}
                required
                disabled={userRole !== "AGENCY_ADMIN"}
                placeholder="123 Rue de la République"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address.postalCode">
                  Code postal <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address.postalCode"
                  name="address.postalCode"
                  value={formData.address.postalCode}
                  onChange={handleInputChange}
                  required
                  disabled={userRole !== "AGENCY_ADMIN"}
                  placeholder="75001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.city">
                  Ville <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address.city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  required
                  disabled={userRole !== "AGENCY_ADMIN"}
                  placeholder="Paris"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.country">Pays</Label>
                <Input
                  id="address.country"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleInputChange}
                  disabled={userRole !== "AGENCY_ADMIN"}
                  placeholder="France"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation des annonces */}

        {/* Présentation */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Présentation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description de l'agence</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                disabled={userRole !== "AGENCY_ADMIN"}
                placeholder="Décrivez votre agence, vos spécialités, votre zone d'intervention..."
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Cette description sera visible sur votre profil public
              </p>
            </div>

            <div className="space-y-4">
              <Label htmlFor="logo">Logo de l'agence</Label>

              {/* Preview du logo */}
              {logoPreview && (
                <div className="relative inline-block">
                  <div className="relative w-32 h-32 border-2 border-dashed border-muted rounded-lg overflow-hidden bg-muted/50">
                    <Image
                      src={logoPreview}
                      alt="Logo actuel"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Zone d'upload */}
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <label
                    htmlFor="logo-upload"
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Upload en cours...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Choisir un logo</span>
                      </>
                    )}
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg,image/svg+xml"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo || userRole !== "AGENCY_ADMIN"}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Formats acceptés: JPEG, PNG, WebP, SVG. Taille max: 2MB
                </p>
                {!logoPreview && (
                  <p className="text-xs text-muted-foreground">
                    Aucun logo actuellement. Téléchargez une image pour ajouter
                    votre logo.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {userRole === "AGENCY_ADMIN" && (
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchAgencyData()}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
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
          </div>
        )}
      </form>
    </div>
  );
}
