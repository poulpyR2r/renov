"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Home,
  MapPin,
  Euro,
  Maximize2,
  CheckCircle2,
  Shield,
  Loader2,
  ImagePlus,
  Phone,
  ChevronLeft,
  Star,
  X,
  Upload,
  Building2,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Mail,
  FileText,
  Wrench,
  Building,
  Info,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";

// Composant pour les agences rejetées
function RejectedAgencyView() {
  const router = useRouter();
  const [agency, setAgency] = useState<{
    companyName: string;
    rejectionReason?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReapplying, setIsReapplying] = useState(false);

  useEffect(() => {
    fetchAgencyInfo();
  }, []);

  const fetchAgencyInfo = async () => {
    try {
      const res = await fetch("/api/agency/me");
      const data = await res.json();
      if (data.success) {
        setAgency(data.agency);
      }
    } catch (error) {
      console.error("Error fetching agency info:", error);
    }
    setIsLoading(false);
  };

  const handleReapply = async () => {
    setIsReapplying(true);
    try {
      const res = await fetch("/api/agency/reapply", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        // Forcer le refresh de la session
        window.location.reload();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Erreur lors de la soumission");
    }
    setIsReapplying(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="max-w-lg w-full border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Demande non approuvée</h1>
              <p className="text-muted-foreground">
                Votre demande d'inscription en tant qu'agence n'a pas été
                acceptée.
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : agency?.rejectionReason ? (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <h3 className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Motif du rejet
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300">
                  {agency.rejectionReason}
                </p>
              </div>
            ) : (
              <div className="mb-6 p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Aucun motif spécifique n'a été indiqué.
                </p>
              </div>
            )}

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 mb-6">
              <h3 className="font-medium text-blue-700 dark:text-blue-400 mb-2">
                Que faire maintenant ?
              </h3>
              <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-2">
                <li>• Vérifiez que votre carte professionnelle est valide</li>
                <li>• Assurez-vous que votre SIRET est correct</li>
                <li>• Confirmez que votre garantie financière est à jour</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleReapply}
                disabled={isReapplying}
                className="w-full"
              >
                {isReapplying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Soumettre à nouveau ma demande
                  </>
                )}
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link href="/contact">
                  <Mail className="w-4 h-4 mr-2" />
                  Contacter le support
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

type Step =
  | "general"
  | "price"
  | "diagnostics"
  | "renovation"
  | "copropriety"
  | "photos"
  | "validation";

export default function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editListingId = searchParams.get("edit");
  const isEditMode = !!editListingId;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingListing, setLoadingListing] = useState(false);
  const [step, setStep] = useState<Step>("general");
  const [agencyName, setAgencyName] = useState<string | null>(null);
  const [agencyInfo, setAgencyInfo] = useState<{
    companyName: string;
    cardNumber: string;
    cardPrefecture: string;
    rcpProvider?: string;
    rcpPolicyNumber?: string;
  } | null>(null);

  // Autocomplétion
  const [addressSuggestions, setAddressSuggestions] = useState<
    Array<{
      label: string;
      city: string;
      postalCode: string;
      department: string;
      address: string;
      coordinates?: { lat: number; lng: number };
    }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const addressInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Titres suggérés pour le titre
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);

  // États pour les erreurs de validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    propertyType: "",
    surface: "",
    rooms: "",
    bedrooms: "",
    bathrooms: "",
    constructionYear: "",
    address: "",
    city: "",
    postalCode: "",
    department: "",
    contactPhone: "",
    images: [] as string[],
    acceptTerms: false,
    acceptDataProcessing: false,
    // Prix & Honoraires
    feesIncluded: false,
    feesAmount: "",
    feesPercentage: "",
    feesPaidBy: "seller" as "seller" | "buyer",
    // Diagnostics
    dpeEnergyClass: "",
    dpeGesClass: "",
    dpeEnergyCostMin: "",
    dpeEnergyCostMax: "",
    dpeReferenceYear: "",
    dpeDate: "",
    asbestos: "",
    lead: "",
    electricity: "",
    gas: "",
    termites: "",
    erp: "",
    // Rénovation
    renovationLevel: "",
    requiredWorks: [] as string[],
    estimatedBudget: "",
    // Copropriété
    coproprietySubject: false,
    coproprietyLots: "",
    coproprietyCharges: "",
    coproprietyProcedure: false,
    // Validation
    agencyCertified: false,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formData.images.length + files.length > 10) {
      toast.error("Maximum 10 images autorisées");
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    Array.from(files).forEach((file) => {
      formDataUpload.append("files", file);
    });

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const data = await res.json();

      if (data.success) {
        updateField("images", [...formData.images, ...data.urls]);
        toast.success(data.message);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Erreur lors de l'upload");
    }
    setUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateField("images", newImages);
  };

  const setMainImage = (index: number) => {
    if (index === 0) return; // Déjà principale
    const newImages = [
      formData.images[index],
      ...formData.images.filter((_, i) => i !== index),
    ];
    updateField("images", newImages);
    toast.success("Image principale définie");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation des champs obligatoires
    if (!formData.propertyType) {
      toast.error("Le type de bien est obligatoire");
      return;
    }
    if (!formData.surface) {
      toast.error("La surface est obligatoire");
      return;
    }
    if (!formData.rooms) {
      toast.error("Le nombre de pièces principales est obligatoire");
      return;
    }
    if (!formData.city) {
      toast.error("La ville est obligatoire");
      return;
    }
    if (!formData.dpeEnergyClass || !formData.dpeGesClass) {
      toast.error("Les classes DPE (énergie et GES) sont obligatoires");
      return;
    }
    if (!formData.renovationLevel) {
      toast.error("Le niveau de rénovation est obligatoire");
      return;
    }
    if (!formData.acceptTerms || !formData.acceptDataProcessing) {
      toast.error("Veuillez accepter les conditions d'utilisation");
      return;
    }
    if (!formData.agencyCertified) {
      toast.error("Vous devez certifier l'exactitude des informations");
      return;
    }

    // Validation des dates
    if (
      formData.constructionYear &&
      !validateConstructionYear(formData.constructionYear)
    ) {
      toast.error(
        "L'année de construction n'est pas valide (doit être entre 1800 et l'année actuelle)"
      );
      return;
    }
    if (
      formData.dpeReferenceYear &&
      !validateDpeReferenceYear(formData.dpeReferenceYear)
    ) {
      toast.error(
        "L'année de référence DPE n'est pas valide (doit être entre 2000 et l'année actuelle)"
      );
      return;
    }
    if (formData.dpeDate && !validateDpeDate(formData.dpeDate)) {
      toast.error(
        "La date de réalisation du DPE n'est pas valide (doit être dans le passé et après le 1er janvier 2000)"
      );
      return;
    }

    // Validation des dépenses énergétiques
    if (
      formData.dpeEnergyCostMin &&
      !validateEnergyCostMin(
        formData.dpeEnergyCostMin,
        formData.dpeEnergyCostMax
      )
    ) {
      toast.error(
        "Le montant minimum des dépenses énergétiques n'est pas valide (doit être positif et inférieur ou égal au maximum)"
      );
      return;
    }
    if (
      formData.dpeEnergyCostMax &&
      !validateEnergyCostMax(
        formData.dpeEnergyCostMin,
        formData.dpeEnergyCostMax
      )
    ) {
      toast.error(
        "Le montant maximum des dépenses énergétiques n'est pas valide (doit être positif et supérieur ou égal au minimum)"
      );
      return;
    }

    setLoading(true);

    try {
      if (isEditMode && editListingId) {
        // Update existing listing
        const response = await fetch(`/api/agency/listings/${editListingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            price: parseInt(formData.price || "0"),
            propertyType: formData.propertyType,
            surface: formData.surface ? parseInt(formData.surface) : undefined,
            rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
            bedrooms: formData.bedrooms
              ? parseInt(formData.bedrooms)
              : undefined,
            bathrooms: formData.bathrooms
              ? parseInt(formData.bathrooms)
              : undefined,
            contactPhone: formData.contactPhone,
            location: {
              city: formData.city,
              postalCode: formData.postalCode,
              department: formData.department,
              address: formData.address,
            },
            images: formData.images,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success("Annonce modifiée avec succès !");
          router.push("/agency/listings");
        } else {
          toast.error(data.error || "Erreur lors de la modification");
        }
      } else {
        // Create new listing
        const response = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            transactionType: "sale",
            location: {
              city: formData.city,
              postalCode: formData.postalCode,
              department: formData.department,
              address: formData.address,
            },
            agencyId: session?.user?.agencyId,
            // Prix & Honoraires
            fees: {
              included: formData.feesIncluded,
              amount: formData.feesAmount
                ? parseFloat(formData.feesAmount)
                : undefined,
              percentage: formData.feesPercentage
                ? parseFloat(formData.feesPercentage)
                : undefined,
              paidBy: formData.feesPaidBy,
            },
            currency: "EUR",
            // Diagnostics
            diagnostics: {
              dpe: {
                energyClass: formData.dpeEnergyClass as
                  | "A"
                  | "B"
                  | "C"
                  | "D"
                  | "E"
                  | "F"
                  | "G",
                gesClass: formData.dpeGesClass as
                  | "A"
                  | "B"
                  | "C"
                  | "D"
                  | "E"
                  | "F"
                  | "G",
                energyCost:
                  formData.dpeEnergyCostMin && formData.dpeEnergyCostMax
                    ? {
                        min: parseFloat(formData.dpeEnergyCostMin || "0"),
                        max: parseFloat(formData.dpeEnergyCostMax || "0"),
                      }
                    : undefined,
                referenceYear: formData.dpeReferenceYear
                  ? parseInt(formData.dpeReferenceYear)
                  : undefined,
                date: formData.dpeDate ? new Date(formData.dpeDate) : undefined,
              },
              asbestos: formData.asbestos || undefined,
              lead: formData.lead || undefined,
              electricity: formData.electricity || undefined,
              gas: formData.gas || undefined,
              termites: formData.termites || undefined,
              erp: formData.erp || undefined,
            },
            // Rénovation
            renovation: {
              level: parseInt(formData.renovationLevel),
              requiredWorks: formData.requiredWorks,
              estimatedBudget: formData.estimatedBudget
                ? parseFloat(formData.estimatedBudget || "0")
                : undefined,
            },
            // Copropriété
            copropriety: formData.coproprietySubject
              ? {
                  isSubject: true,
                  lotsCount: formData.coproprietyLots
                    ? parseInt(formData.coproprietyLots)
                    : undefined,
                  annualCharges: formData.coproprietyCharges
                    ? parseFloat(formData.coproprietyCharges)
                    : undefined,
                  procedureInProgress: formData.coproprietyProcedure,
                }
              : undefined,
            // Informations agence
            agencyInfo: agencyInfo || undefined,
            // Certification
            agencyCertification: {
              certified: formData.agencyCertified,
              certifiedAt: new Date(),
              certifiedBy: session?.user?.email,
            },
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success("Annonce publiée avec succès !");
          router.push("/");
        } else {
          toast.error(data.error || "Erreur lors de la publication");
        }
      }
    } catch (error) {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Formater le prix avec des espaces pour les milliers (format français)
  const formatPrice = (value: string): string => {
    // Enlever tous les espaces existants
    const cleaned = value.replace(/\s/g, "");
    // Vérifier que c'est un nombre valide
    if (cleaned === "" || isNaN(Number(cleaned))) {
      return cleaned;
    }
    // Formater avec des espaces tous les 3 chiffres depuis la droite
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Parser le prix pour enlever les espaces avant le stockage
  const parsePrice = (value: string): string => {
    return value.replace(/\s/g, "");
  };

  // Valider l'année de construction
  const validateConstructionYear = (year: string): boolean => {
    if (!year) return true; // Vide est OK (pas obligatoire)
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    return yearNum >= 1800 && yearNum <= currentYear && year.length === 4;
  };

  // Valider l'année de référence DPE
  const validateDpeReferenceYear = (year: string): boolean => {
    if (!year) return true; // Vide est OK
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    return yearNum >= 2000 && yearNum <= currentYear && year.length === 4;
  };

  // Valider la date du DPE
  const validateDpeDate = (date: string): boolean => {
    if (!date) return true; // Vide est OK
    const dateObj = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fin de journée
    const minDate = new Date("2000-01-01");
    return dateObj <= today && dateObj >= minDate;
  };

  // Handler pour le prix avec formatage
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parsePrice(e.target.value);
    updateField("price", rawValue); // Stocker la valeur sans espaces dans le state
  };

  // Handler pour l'année de construction avec validation
  const handleConstructionYearChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    updateField("constructionYear", value);
    if (value && !validateConstructionYear(value)) {
      setErrors((prev) => ({
        ...prev,
        constructionYear:
          "L'année doit être entre 1800 et l'année actuelle (4 chiffres)",
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.constructionYear;
        return newErrors;
      });
    }
  };

  // Handler pour l'année de référence DPE avec validation
  const handleDpeReferenceYearChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    updateField("dpeReferenceYear", value);
    if (value && !validateDpeReferenceYear(value)) {
      setErrors((prev) => ({
        ...prev,
        dpeReferenceYear:
          "L'année doit être entre 2000 et l'année actuelle (4 chiffres)",
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.dpeReferenceYear;
        return newErrors;
      });
    }
  };

  // Handler pour la date DPE avec validation
  const handleDpeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateField("dpeDate", value);
    if (value && !validateDpeDate(value)) {
      setErrors((prev) => ({
        ...prev,
        dpeDate:
          "La date doit être dans le passé (pas dans le futur) et après le 1er janvier 2000",
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.dpeDate;
        return newErrors;
      });
    }
  };

  // Handler pour le montant des honoraires avec formatage
  const handleFeesAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parsePrice(e.target.value);
    updateField("feesAmount", rawValue); // Stocker la valeur sans espaces
    // Reset le pourcentage si on modifie le montant
    if (rawValue) {
      updateField("feesPercentage", "");
    }
  };

  // Handler pour le pourcentage des honoraires
  const handleFeesPercentageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    updateField("feesPercentage", value);
    // Reset le montant si on modifie le pourcentage
    if (value) {
      updateField("feesAmount", "");
    }
  };

  // Valider les dépenses énergétiques min
  const validateEnergyCostMin = (min: string, max: string): boolean => {
    if (!min) return true; // Vide est OK
    const minNum = parseFloat(min);
    if (isNaN(minNum) || minNum < 0) return false;
    if (max) {
      const maxNum = parseFloat(max);
      if (!isNaN(maxNum) && minNum > maxNum) return false;
    }
    return true;
  };

  // Valider les dépenses énergétiques max
  const validateEnergyCostMax = (min: string, max: string): boolean => {
    if (!max) return true; // Vide est OK
    const maxNum = parseFloat(max);
    if (isNaN(maxNum) || maxNum < 0) return false;
    if (min) {
      const minNum = parseFloat(min);
      if (!isNaN(minNum) && maxNum < minNum) return false;
    }
    return true;
  };

  // Handler pour les dépenses énergétiques min avec formatage
  const handleEnergyCostMinChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = parsePrice(e.target.value);
    updateField("dpeEnergyCostMin", rawValue); // Stocker la valeur sans espaces

    // Valider le min avec le max actuel
    if (
      rawValue &&
      !validateEnergyCostMin(rawValue, formData.dpeEnergyCostMax)
    ) {
      setErrors((prev) => ({
        ...prev,
        dpeEnergyCostMin:
          "Le minimum doit être positif et inférieur ou égal au maximum",
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.dpeEnergyCostMin;
        return newErrors;
      });
      // Révalider le max avec le nouveau min
      if (
        formData.dpeEnergyCostMax &&
        !validateEnergyCostMax(rawValue, formData.dpeEnergyCostMax)
      ) {
        setErrors((prev) => ({
          ...prev,
          dpeEnergyCostMax: "Le maximum doit être supérieur ou égal au minimum",
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.dpeEnergyCostMax;
          return newErrors;
        });
      }
    }
  };

  // Handler pour les dépenses énergétiques max avec formatage
  const handleEnergyCostMaxChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = parsePrice(e.target.value);
    updateField("dpeEnergyCostMax", rawValue); // Stocker la valeur sans espaces

    // Valider le max avec le min actuel
    if (
      rawValue &&
      !validateEnergyCostMax(formData.dpeEnergyCostMin, rawValue)
    ) {
      setErrors((prev) => ({
        ...prev,
        dpeEnergyCostMax:
          "Le maximum doit être positif et supérieur ou égal au minimum",
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.dpeEnergyCostMax;
        return newErrors;
      });
      // Révalider le min avec le nouveau max
      if (
        formData.dpeEnergyCostMin &&
        !validateEnergyCostMin(formData.dpeEnergyCostMin, rawValue)
      ) {
        setErrors((prev) => ({
          ...prev,
          dpeEnergyCostMin: "Le minimum doit être inférieur ou égal au maximum",
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.dpeEnergyCostMin;
          return newErrors;
        });
      }
    }
  };

  // Handler pour le budget estimatif avec formatage
  const handleEstimatedBudgetChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = parsePrice(e.target.value);
    updateField("estimatedBudget", rawValue); // Stocker la valeur sans espaces
  };

  // Fonction d'autocomplétion avec debounce
  const fetchAddressSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        `/api/geocode/autocomplete?q=${encodeURIComponent(query)}&limit=10`
      );
      const data = await response.json();

      if (data.suggestions) {
        setAddressSuggestions(data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setAddressSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Debounce pour l'autocomplétion
  useEffect(() => {
    const timer = setTimeout(() => {
      if (addressQuery) {
        fetchAddressSuggestions(addressQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [addressQuery, fetchAddressSuggestions]);

  // Fermer les suggestions en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        addressInputRef.current &&
        !addressInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionSelect = (suggestion: {
    label: string;
    city: string;
    postalCode: string;
    department: string;
    address: string;
  }) => {
    updateField("city", suggestion.city);
    updateField("postalCode", suggestion.postalCode);
    updateField("department", suggestion.department);
    updateField("address", suggestion.address);
    setAddressQuery(suggestion.label);
    setShowSuggestions(false);
  };

  // Générer les titres suggérés complets
  useEffect(() => {
    const titles: string[] = [];

    if (!formData.propertyType) {
      setSuggestedTitles([]);
      return;
    }

    // Types de biens
    const propertyTypes: Record<string, string[]> = {
      house: ["Maison", "Maison individuelle", "Villa"],
      apartment: ["Appartement", "Studio"],
      building: ["Immeuble", "Résidence", "Bâtiment"],
      land: ["Terrain", "Parcelle", "Lopin de terrain"],
      other: ["Bien immobilier", "Propriété"],
    };

    // Niveaux de rénovation
    const renovationLevels: Record<string, string[]> = {
      total: [
        "à rénover totalement",
        "à rénover complètement",
        "nécessitant une rénovation complète",
      ],
      partial: [
        "à rafraîchir",
        "nécessitant quelques travaux",
        "à rénover partiellement",
      ],
      good: ["en bon état", "bien entretenu", "nécessitant quelques travaux"],
      excellent: ["en très bon état", "en excellent état", "récent"],
    };

    // Éléments additionnels
    const additionalElements: string[] = [
      "avec jardin",
      "avec potentiel",
      "avec caractère",
      "proche commerces",
      "proche transports",
      "avec charme",
      "à restaurer",
      "avec beaucoup de potentiel",
      "proche centre-ville",
      "avec terrasse",
    ];

    const propertyTypeLabels = propertyTypes[formData.propertyType] || ["Bien"];
    const renovationLabels = formData.renovationLevel
      ? renovationLevels[formData.renovationLevel] || []
      : ["à rénover", "à restaurer"];

    // Générer des combinaisons de titres (plus intelligemment pour éviter trop de combinaisons)
    const primaryPropertyType = propertyTypeLabels[0]; // Prendre le premier type

    renovationLabels.slice(0, 2).forEach((renovation) => {
      // Titre simple : Type + rénovation
      titles.push(`${primaryPropertyType} ${renovation}`);

      // Avec nombre de chambres si disponible
      if (formData.bedrooms) {
        const bedrooms = parseInt(formData.bedrooms);
        if (bedrooms >= 1 && bedrooms <= 5) {
          const bedroomLabel =
            bedrooms === 1 ? "1 chambre" : `${bedrooms} chambres`;
          titles.push(`${primaryPropertyType} ${bedroomLabel} ${renovation}`);

          // Pour les appartements, ajouter variante F2, F3, etc.
          if (formData.propertyType === "apartment") {
            titles.push(`Appartement F${bedrooms} ${renovation}`);
          }
        }
      }

      // Avec surface si disponible
      if (formData.surface) {
        const surface = parseFloat(formData.surface);
        if (surface > 0) {
          titles.push(
            `${primaryPropertyType} de ${Math.round(surface)} m² ${renovation}`
          );
        }
      }

      // Combinaison chambres + surface
      if (formData.bedrooms && formData.surface) {
        const bedrooms = parseInt(formData.bedrooms);
        const surface = parseFloat(formData.surface);
        if (bedrooms >= 1 && bedrooms <= 5 && surface > 0) {
          const bedroomLabel =
            bedrooms === 1 ? "1 chambre" : `${bedrooms} chambres`;
          titles.push(
            `${primaryPropertyType} ${bedroomLabel} de ${Math.round(
              surface
            )} m² ${renovation}`
          );
        }
      }

      // Avec quelques éléments additionnels populaires
      additionalElements.slice(0, 2).forEach((element) => {
        titles.push(`${primaryPropertyType} ${renovation} ${element}`);
      });
    });

    // Ajouter quelques variantes supplémentaires si peu de titres
    if (titles.length < 6 && propertyTypeLabels.length > 1) {
      const secondPropertyType = propertyTypeLabels[1];
      if (renovationLabels.length > 0) {
        titles.push(`${secondPropertyType} ${renovationLabels[0]}`);
      }
    }

    // Filtrer les doublons et limiter à 12 titres
    const uniqueTitles = Array.from(new Set(titles)).slice(0, 12);
    setSuggestedTitles(uniqueTitles);
  }, [
    formData.propertyType,
    formData.renovationLevel,
    formData.surface,
    formData.bedrooms,
    formData.bathrooms,
  ]);

  // Gérer le clic sur un titre suggéré
  const handleSuggestedTitleClick = (suggestedTitle: string) => {
    updateField("title", suggestedTitle);
  };

  // Load listing data if in edit mode
  useEffect(() => {
    if (isEditMode && editListingId && session) {
      setLoadingListing(true);
      fetch(`/api/agency/listings/${editListingId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.listing) {
            const listing = data.listing;
            setFormData({
              title: listing.title || "",
              description: listing.description || "",
              price: listing.price?.toString() || "",
              propertyType: listing.propertyType || "",
              surface: listing.surface?.toString() || "",
              rooms: listing.rooms?.toString() || "",
              bedrooms: listing.bedrooms?.toString() || "",
              bathrooms: listing.bathrooms?.toString() || "",
              constructionYear: listing.constructionYear?.toString() || "",
              address: listing.location?.address || "",
              city: listing.location?.city || "",
              postalCode: listing.location?.postalCode || "",
              department: listing.location?.department || "",
              contactPhone: listing.contactPhone || "",
              images: listing.images || [],
              acceptTerms: true,
              acceptDataProcessing: true,
              // Prix & Honoraires
              feesIncluded: listing.fees?.included || false,
              feesAmount: listing.fees?.amount?.toString() || "",
              feesPercentage: listing.fees?.percentage?.toString() || "",
              feesPaidBy: listing.fees?.paidBy || "seller",
              // Diagnostics
              dpeEnergyClass: listing.diagnostics?.dpe?.energyClass || "",
              dpeGesClass: listing.diagnostics?.dpe?.gesClass || "",
              dpeEnergyCostMin:
                listing.diagnostics?.dpe?.energyCost?.min?.toString() || "",
              dpeEnergyCostMax:
                listing.diagnostics?.dpe?.energyCost?.max?.toString() || "",
              dpeReferenceYear:
                listing.diagnostics?.dpe?.referenceYear?.toString() || "",
              dpeDate: listing.diagnostics?.dpe?.date
                ? new Date(listing.diagnostics.dpe.date)
                    .toISOString()
                    .split("T")[0]
                : "",
              asbestos: listing.diagnostics?.asbestos || "",
              lead: listing.diagnostics?.lead || "",
              electricity: listing.diagnostics?.electricity || "",
              gas: listing.diagnostics?.gas || "",
              termites: listing.diagnostics?.termites || "",
              erp: listing.diagnostics?.erp || "",
              // Rénovation
              renovationLevel: listing.renovation?.level?.toString() || "",
              requiredWorks: listing.renovation?.requiredWorks || [],
              estimatedBudget:
                listing.renovation?.estimatedBudget?.toString() || "",
              // Copropriété
              coproprietySubject: listing.copropriety?.isSubject || false,
              coproprietyLots: listing.copropriety?.lotsCount?.toString() || "",
              coproprietyCharges:
                listing.copropriety?.annualCharges?.toString() || "",
              coproprietyProcedure:
                listing.copropriety?.procedureInProgress || false,
              // Validation
              agencyCertified: listing.agencyCertification?.certified || false,
            });
            // Initialiser l'adresse query pour l'autocomplétion
            const addressParts = [
              listing.location?.address,
              listing.location?.city,
              listing.location?.postalCode,
            ].filter(Boolean);
            setAddressQuery(addressParts.join(", ") || "");
          } else {
            toast.error("Annonce non trouvée");
            router.push("/agency/listings");
          }
        })
        .catch((error) => {
          console.error("Error loading listing:", error);
          toast.error("Erreur lors du chargement de l'annonce");
          router.push("/agency/listings");
        })
        .finally(() => {
          setLoadingListing(false);
        });
    }
  }, [isEditMode, editListingId, session, router]);

  // Load agency name and info
  useEffect(() => {
    if (session?.user?.role === "agency" && status === "authenticated") {
      fetch("/api/agency/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.agency) {
            setAgencyName(data.agency.companyName);
            setAgencyInfo({
              companyName: data.agency.companyName,
              cardNumber: data.agency.professionalCard?.number || "",
              cardPrefecture: data.agency.professionalCard?.prefecture || "",
              rcpProvider: data.agency.insurance?.provider,
              rcpPolicyNumber: data.agency.insurance?.policyNumber,
            });
          }
        })
        .catch((error) => {
          console.error("Error loading agency:", error);
        });
    }
  }, [session, status]);

  // Loading
  if (status === "loading" || (isEditMode && loadingListing)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Non connecté
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="max-w-md w-full border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Accès réservé</h1>
              <p className="text-muted-foreground mb-6">
                La publication d'annonces est réservée aux agences immobilières
                vérifiées.
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/register/agency">Devenir partenaire</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Se connecter</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Pas une agence
  if (session.user.role !== "agency" && session.user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="max-w-md w-full border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 text-orange-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Espace professionnel</h1>
              <p className="text-muted-foreground mb-6">
                La publication d'annonces est réservée aux agences immobilières
                partenaires.
              </p>
              <div className="p-4 rounded-lg bg-muted/50 mb-6 text-left">
                <h3 className="font-medium mb-2">
                  Pourquoi devenir partenaire ?
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>✓ Publiez vos annonces en illimité</li>
                  <li>✓ Touchez des acheteurs ciblés</li>
                  <li>✓ Badge "Agence vérifiée" sur vos annonces</li>
                  <li>✓ Statistiques détaillées</li>
                </ul>
              </div>
              <Button asChild className="w-full">
                <Link href="/register/agency">
                  Devenir partenaire
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Agence en attente de validation
  if (
    session.user.role === "agency" &&
    session.user.agencyStatus === "pending"
  ) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="max-w-md w-full border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Vérification en cours</h1>
              <p className="text-muted-foreground mb-6">
                Votre compte agence est en cours de vérification. Vous pourrez
                publier des annonces une fois votre compte validé.
              </p>
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-left">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Notre équipe examine votre dossier. Vous recevrez un email de
                  confirmation sous 48h ouvrées.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Agence rejetée
  if (
    session.user.role === "agency" &&
    session.user.agencyStatus === "rejected"
  ) {
    return <RejectedAgencyView />;
  }

  // Agence vérifiée - Formulaire de publication
  const steps = ["details", "photos", "validation"];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            {isEditMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/agency/listings")}
                className="mb-4"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Retour aux annonces
              </Button>
            )}
            <div className="text-center">
              {agencyName && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 text-sm font-medium">
                    <Building2 className="w-4 h-4" />
                    {agencyName}
                  </span>
                </div>
              )}
              <h1 className="text-3xl font-bold mb-2">
                {isEditMode ? "Modifier une annonce" : "Publier une annonce"}
              </h1>
              <p className="text-muted-foreground">
                {isEditMode
                  ? "Modifiez les informations de votre annonce"
                  : "Publiez un bien immobilier à rénover"}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {["Détails", "Photos", "Validation"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepIndex >= i
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {stepIndex > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-sm hidden sm:block ${
                    stepIndex >= i ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
                {i < 2 && (
                  <div
                    className={`w-6 h-0.5 ${
                      stepIndex > i ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step: General Information */}
            {step === "general" && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Home className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-semibold">
                      Informations générales du bien
                    </h2>
                  </div>

                  {/* Property Type */}
                  <div className="space-y-2">
                    <Label>Type de bien *</Label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(v) => updateField("propertyType", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="house">Maison</SelectItem>
                        <SelectItem value="apartment">Appartement</SelectItem>
                        <SelectItem value="building">Immeuble</SelectItem>
                        <SelectItem value="land">Terrain</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label>Titre *</Label>
                    <div className="relative">
                      <Input
                        ref={titleInputRef}
                        required
                        placeholder="Ex: Maison à rénover avec jardin"
                        value={formData.title}
                        onChange={(e) => updateField("title", e.target.value)}
                      />
                    </div>
                    {/* Titres suggérés */}
                    {suggestedTitles.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          Suggestions de titres :
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {suggestedTitles.map((suggestedTitle, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() =>
                                handleSuggestedTitleClick(suggestedTitle)
                              }
                              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors border border-border text-left max-w-full"
                              title={suggestedTitle}
                            >
                              <span className="truncate">{suggestedTitle}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea
                      required
                      rows={5}
                      placeholder="Rédigez une description complète du bien : caractéristiques principales, état général, travaux à prévoir, équipements, environnement (quartier, transport, commerces)... Plus la description est détaillée, plus elle attirera de candidats intéressés."
                      value={formData.description}
                      onChange={(e) =>
                        updateField("description", e.target.value)
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      La description doit être fidèle et non trompeuse.
                      Mentionnez les travaux à prévoir si applicable.
                    </p>
                  </div>

                  {/* Surface */}
                  <div className="space-y-2">
                    <Label>Surface habitable (m²) *</Label>
                    <div className="relative">
                      <Maximize2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        required
                        className="pl-9"
                        placeholder="120"
                        value={formData.surface}
                        onChange={(e) => updateField("surface", e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Surface mesurée selon la loi Carrez (hauteur sous plafond
                      ≥ 1,80 m, excluant les combles, caves, garages, terrasses,
                      balcons, loggias et vérandas).
                    </p>
                  </div>

                  {/* Rooms */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <Label>Pièces principales *</Label>
                      <Input
                        type="number"
                        required
                        placeholder="5"
                        value={formData.rooms}
                        onChange={(e) => updateField("rooms", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Chambres</Label>
                      <Input
                        type="number"
                        placeholder="3"
                        value={formData.bedrooms}
                        onChange={(e) =>
                          updateField("bedrooms", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SdB</Label>
                      <Input
                        type="number"
                        placeholder="1"
                        value={formData.bathrooms}
                        onChange={(e) =>
                          updateField("bathrooms", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Année</Label>
                      <Input
                        type="number"
                        placeholder="1970"
                        min="1800"
                        max={new Date().getFullYear()}
                        value={formData.constructionYear}
                        onChange={handleConstructionYearChange}
                      />
                      {errors.constructionYear && (
                        <p className="text-xs text-destructive">
                          {errors.constructionYear}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="pt-4 border-t space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Localisation
                    </h3>

                    {/* Adresse avec autocomplétion */}
                    <div className="space-y-2">
                      <Label>Rechercher une adresse ou une ville *</Label>
                      <div className="relative">
                        <Input
                          ref={addressInputRef}
                          required
                          placeholder="Commencez à taper une adresse ou une ville..."
                          value={
                            addressQuery ||
                            `${
                              formData.address ? formData.address + ", " : ""
                            }${formData.city || ""} ${
                              formData.postalCode || ""
                            }`.trim()
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setAddressQuery(value);
                            // Si l'utilisateur efface, réinitialiser les champs
                            if (!value) {
                              updateField("city", "");
                              updateField("postalCode", "");
                              updateField("address", "");
                              updateField("department", "");
                            }
                          }}
                          onFocus={() => {
                            if (addressSuggestions.length > 0) {
                              setShowSuggestions(true);
                            }
                          }}
                        />
                        {isLoadingSuggestions && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                        )}

                        {/* Suggestions */}
                        {showSuggestions && addressSuggestions.length > 0 && (
                          <div
                            ref={suggestionsRef}
                            className="absolute z-50 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-60 overflow-auto"
                          >
                            {addressSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() =>
                                  handleSuggestionSelect(suggestion)
                                }
                                className="w-full text-left px-4 py-2 hover:bg-muted transition-colors border-b last:border-b-0"
                              >
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">
                                      {suggestion.label}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {suggestion.city} {suggestion.postalCode}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        L'adresse précise sera masquée publiquement, seule la
                        ville sera visible.
                      </p>
                    </div>

                    {/* Champs séparés (pré-remplis par l'autocomplétion) */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Ville *</Label>
                        <Input
                          required
                          placeholder="Paris"
                          value={formData.city}
                          onChange={(e) => {
                            updateField("city", e.target.value);
                            setAddressQuery("");
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Code postal *</Label>
                        <Input
                          required
                          placeholder="75001"
                          value={formData.postalCode}
                          onChange={(e) => {
                            updateField("postalCode", e.target.value);
                            setAddressQuery("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Adresse précise (optionnelle, masquée publiquement)
                      </Label>
                      <Input
                        placeholder="123 rue de la République"
                        value={formData.address}
                        onChange={(e) => {
                          updateField("address", e.target.value);
                          setAddressQuery("");
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // Pas de retour possible depuis la première section
                      }}
                      disabled
                    >
                      Retour
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        // Validation des champs obligatoires
                        if (!formData.propertyType) {
                          toast.error("Le type de bien est obligatoire");
                          return;
                        }
                        if (!formData.title) {
                          toast.error("Le titre est obligatoire");
                          return;
                        }
                        if (!formData.description) {
                          toast.error("La description est obligatoire");
                          return;
                        }
                        if (!formData.surface) {
                          toast.error("La surface habitable est obligatoire");
                          return;
                        }
                        if (!formData.rooms) {
                          toast.error(
                            "Le nombre de pièces principales est obligatoire"
                          );
                          return;
                        }
                        if (!formData.city || !formData.postalCode) {
                          toast.error(
                            "La ville et le code postal sont obligatoires"
                          );
                          return;
                        }
                        setStep("price");
                      }}
                    >
                      Continuer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step: Price & Fees */}
            {step === "price" && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Euro className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h2 className="font-semibold">Prix & Honoraires</h2>
                  </div>

                  {/* Prix */}
                  <div className="space-y-2">
                    <Label>Prix de vente TTC (€) *</Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        required
                        className="pl-9"
                        placeholder="150 000"
                        value={formatPrice(formData.price)}
                        onChange={handlePriceChange}
                      />
                    </div>
                  </div>

                  {/* Honoraires */}
                  <div className="pt-4 border-t space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Euro className="w-4 h-4" />
                      Honoraires
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="feesIncluded"
                          checked={formData.feesIncluded}
                          onChange={(e) =>
                            updateField("feesIncluded", e.target.checked)
                          }
                          className="rounded"
                        />
                        <Label
                          htmlFor="feesIncluded"
                          className="cursor-pointer"
                        >
                          Honoraires inclus dans le prix
                        </Label>
                      </div>
                      {!formData.feesIncluded && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Montant des honoraires (€)</Label>
                            <Input
                              type="text"
                              placeholder="5 000"
                              value={formatPrice(formData.feesAmount)}
                              onChange={handleFeesAmountChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Ou pourcentage (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="5.0"
                              value={formData.feesPercentage}
                              onChange={handleFeesPercentageChange}
                            />
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Honoraires à la charge de *</Label>
                        <Select
                          value={formData.feesPaidBy}
                          onValueChange={(v: "seller" | "buyer") =>
                            updateField("feesPaidBy", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="seller">Vendeur</SelectItem>
                            <SelectItem value="buyer">Acquéreur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("general")}
                    >
                      Retour
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!formData.price) {
                          toast.error("Le prix de vente est obligatoire");
                          return;
                        }
                        if (!formData.feesPaidBy) {
                          toast.error(
                            "Vous devez indiquer à qui incombent les honoraires"
                          );
                          return;
                        }
                        setStep("diagnostics");
                      }}
                    >
                      Continuer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step: Diagnostics */}
            {step === "diagnostics" && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <h2 className="font-semibold">Diagnostics immobiliers</h2>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Les diagnostics immobiliers sont obligatoires pour la
                      vente d'un bien immobilier en France.
                    </p>
                  </div>

                  {/* DPE */}
                  <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium">
                      DPE (Diagnostic de Performance Énergétique)
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Classe énergie *</Label>
                        <Select
                          value={formData.dpeEnergyClass}
                          onValueChange={(v) =>
                            updateField("dpeEnergyClass", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">
                              A - Très performant (0-70 kWh/m²/an)
                            </SelectItem>
                            <SelectItem value="B">
                              B - Performant (71-110 kWh/m²/an)
                            </SelectItem>
                            <SelectItem value="C">
                              C - Assez performant (111-180 kWh/m²/an)
                            </SelectItem>
                            <SelectItem value="D">
                              D - Moyennement performant (181-250 kWh/m²/an)
                            </SelectItem>
                            <SelectItem value="E">
                              E - Peu performant (251-330 kWh/m²/an)
                            </SelectItem>
                            <SelectItem value="F">
                              F - Très peu performant (331-450 kWh/m²/an)
                            </SelectItem>
                            <SelectItem value="G">
                              G - Extrêmement peu performant (&gt;450 kWh/m²/an)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Classe de performance énergétique du bien (de A à G).
                          Indique la consommation d'énergie primaire pour le
                          chauffage, l'eau chaude et le refroidissement.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Classe GES *</Label>
                        <Select
                          value={formData.dpeGesClass}
                          onValueChange={(v) => updateField("dpeGesClass", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">
                              A - Très faible émission (0-6 kg CO₂/m²/an)
                            </SelectItem>
                            <SelectItem value="B">
                              B - Faible émission (7-11 kg CO₂/m²/an)
                            </SelectItem>
                            <SelectItem value="C">
                              C - Assez faible émission (12-30 kg CO₂/m²/an)
                            </SelectItem>
                            <SelectItem value="D">
                              D - Émission modérée (31-50 kg CO₂/m²/an)
                            </SelectItem>
                            <SelectItem value="E">
                              E - Émission élevée (51-70 kg CO₂/m²/an)
                            </SelectItem>
                            <SelectItem value="F">
                              F - Très élevée émission (71-100 kg CO₂/m²/an)
                            </SelectItem>
                            <SelectItem value="G">
                              G - Extrêmement élevée émission (&gt;100 kg
                              CO₂/m²/an)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Classe d'émission de gaz à effet de serre (de A à G).
                          Indique l'impact du bien sur le changement climatique.
                        </p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Dépenses énergétiques min (€/an)</Label>
                        <Input
                          type="text"
                          placeholder="500"
                          value={formatPrice(formData.dpeEnergyCostMin)}
                          onChange={handleEnergyCostMinChange}
                        />
                        {errors.dpeEnergyCostMin && (
                          <p className="text-xs text-destructive">
                            {errors.dpeEnergyCostMin}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Coût annuel minimum des dépenses énergétiques
                          (chauffage, eau chaude, climatisation, etc.) en euros.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Dépenses énergétiques max (€/an)</Label>
                        <Input
                          type="text"
                          placeholder="1 500"
                          value={formatPrice(formData.dpeEnergyCostMax)}
                          onChange={handleEnergyCostMaxChange}
                        />
                        {errors.dpeEnergyCostMax && (
                          <p className="text-xs text-destructive">
                            {errors.dpeEnergyCostMax}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Coût annuel maximum des dépenses énergétiques. Doit
                          être supérieur ou égal au minimum.
                        </p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Année de référence</Label>
                        <Input
                          type="number"
                          placeholder="2024"
                          min="2000"
                          max={new Date().getFullYear()}
                          value={formData.dpeReferenceYear}
                          onChange={handleDpeReferenceYearChange}
                        />
                        {errors.dpeReferenceYear && (
                          <p className="text-xs text-destructive">
                            {errors.dpeReferenceYear}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Année de référence utilisée pour le calcul du DPE
                          (généralement l'année de réalisation du diagnostic).
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Date de réalisation du DPE</Label>
                        <Input
                          type="date"
                          max={new Date().toISOString().split("T")[0]}
                          value={formData.dpeDate}
                          onChange={handleDpeDateChange}
                        />
                        {errors.dpeDate && (
                          <p className="text-xs text-destructive">
                            {errors.dpeDate}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Date à laquelle le diagnostic de performance
                          énergétique a été réalisé. Valable 10 ans (5 ans pour
                          les biens mis en vente depuis 2021).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Autres diagnostics */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Autres diagnostics</h4>
                    {[
                      {
                        key: "asbestos",
                        label: "Amiante",
                        description:
                          "Diagnostic amiante obligatoire pour les biens construits avant le 1er juillet 1997. Valable sans limite de temps si aucun matériau contenant de l'amiante n'est détecté.",
                      },
                      {
                        key: "lead",
                        label: "Plomb (CREP)",
                        description:
                          "Constat de Risque d'Exposition au Plomb obligatoire pour les biens construits avant 1949. Valable 1 an si présence de plomb, illimité sinon.",
                      },
                      {
                        key: "electricity",
                        label: "Électricité",
                        description:
                          "État de l'installation intérieure d'électricité obligatoire si l'installation a plus de 15 ans. Valable 3 ans.",
                      },
                      {
                        key: "gas",
                        label: "Gaz",
                        description:
                          "État de l'installation intérieure de gaz obligatoire si l'installation a plus de 15 ans. Valable 3 ans.",
                      },
                      {
                        key: "termites",
                        label: "Termites",
                        description:
                          "État relatif à la présence de termites obligatoire dans certaines zones géographiques. Valable 6 mois.",
                      },
                      {
                        key: "erp",
                        label: "ERP (Établissement Recevant du Public)",
                        description:
                          "Diagnostic accessibilité ERP obligatoire pour certains types de biens. Valable selon la réglementation en vigueur.",
                      },
                    ].map(({ key, label, description }) => (
                      <div key={key} className="space-y-2">
                        <Label>{label}</Label>
                        <Select
                          value={
                            formData[key as keyof typeof formData] as string
                          }
                          onValueChange={(v) => updateField(key, v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">
                              Disponible
                            </SelectItem>
                            <SelectItem value="in_progress">
                              En cours
                            </SelectItem>
                            <SelectItem value="not_applicable">
                              Non applicable
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("price")}
                    >
                      Retour
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!formData.dpeEnergyClass || !formData.dpeGesClass) {
                          toast.error(
                            "Les classes DPE (énergie et GES) sont obligatoires"
                          );
                          return;
                        }
                        setStep("renovation");
                      }}
                    >
                      Continuer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step: Renovation */}
            {step === "renovation" && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-orange-500" />
                    </div>
                    <h2 className="font-semibold">Rénovation & Travaux</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Niveau de rénovation (1 à 5) *</Label>
                      <Select
                        value={formData.renovationLevel}
                        onValueChange={(v) => updateField("renovationLevel", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">
                            1 - À rénover entièrement
                          </SelectItem>
                          <SelectItem value="2">
                            2 - Rénovation importante
                          </SelectItem>
                          <SelectItem value="3">
                            3 - Rénovation partielle
                          </SelectItem>
                          <SelectItem value="4">
                            4 - Rénovation légère
                          </SelectItem>
                          <SelectItem value="5">5 - Bon état</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Niveau de rénovation estimé par l'agence, à titre
                        indicatif et non contractuel.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Travaux à prévoir (optionnel)</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          "électricité",
                          "plomberie",
                          "isolation",
                          "cuisine",
                          "salle de bain",
                          "sols / murs",
                          "toiture / structure",
                        ].map((work) => (
                          <label
                            key={work}
                            className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50"
                          >
                            <input
                              type="checkbox"
                              checked={formData.requiredWorks.includes(work)}
                              onChange={(e) => {
                                const works = e.target.checked
                                  ? [...formData.requiredWorks, work]
                                  : formData.requiredWorks.filter(
                                      (w) => w !== work
                                    );
                                updateField("requiredWorks", works);
                              }}
                              className="rounded"
                            />
                            <span className="text-sm capitalize">{work}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Budget travaux estimatif (€, optionnel)</Label>
                      <Input
                        type="text"
                        placeholder="30 000"
                        value={formatPrice(formData.estimatedBudget)}
                        onChange={handleEstimatedBudgetChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        Estimation non contractuelle, donnée à titre indicatif.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("diagnostics")}
                    >
                      Retour
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!formData.renovationLevel) {
                          toast.error(
                            "Le niveau de rénovation est obligatoire"
                          );
                          return;
                        }
                        setStep("copropriety");
                      }}
                    >
                      Continuer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step: Copropriety */}
            {step === "copropriety" && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Building className="w-5 h-5 text-purple-500" />
                    </div>
                    <h2 className="font-semibold">Copropriété</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="coproprietySubject"
                        checked={formData.coproprietySubject}
                        onChange={(e) =>
                          updateField("coproprietySubject", e.target.checked)
                        }
                        className="rounded"
                      />
                      <Label
                        htmlFor="coproprietySubject"
                        className="cursor-pointer"
                      >
                        Bien soumis à la copropriété
                      </Label>
                    </div>
                    {formData.coproprietySubject && (
                      <>
                        <div className="space-y-2">
                          <Label>Nombre de lots</Label>
                          <Input
                            type="number"
                            placeholder="50"
                            value={formData.coproprietyLots}
                            onChange={(e) =>
                              updateField("coproprietyLots", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Charges annuelles moyennes (€)</Label>
                          <Input
                            type="number"
                            placeholder="2000"
                            value={formData.coproprietyCharges}
                            onChange={(e) =>
                              updateField("coproprietyCharges", e.target.value)
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="coproprietyProcedure"
                            checked={formData.coproprietyProcedure}
                            onChange={(e) =>
                              updateField(
                                "coproprietyProcedure",
                                e.target.checked
                              )
                            }
                            className="rounded"
                          />
                          <Label
                            htmlFor="coproprietyProcedure"
                            className="cursor-pointer"
                          >
                            Procédure en cours
                          </Label>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("renovation")}
                    >
                      Retour
                    </Button>
                    <Button type="button" onClick={() => setStep("photos")}>
                      Continuer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step: Photos */}
            {step === "photos" && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <ImagePlus className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h2 className="font-semibold">Photos du bien</h2>
                      <p className="text-sm text-muted-foreground">
                        Ajoutez jusqu'à 10 photos
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    {uploading ? (
                      <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                    ) : (
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    )}
                    <p className="mt-4 font-medium">
                      {uploading ? "Upload..." : "Ajouter des photos"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      JPG, PNG ou WebP • Max 5MB
                    </p>
                  </div>

                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {formData.images.map((url, index) => (
                        <div
                          key={index}
                          className="relative group aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                          onClick={() => setMainImage(index)}
                          title={
                            index === 0
                              ? "Image principale"
                              : "Cliquer pour définir comme principale"
                          }
                        >
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {index === 0 ? (
                            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-xs bg-primary text-primary-foreground flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              Principale
                            </span>
                          ) : (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="px-2 py-1 rounded bg-black/70 text-white text-xs flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                Définir principale
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("copropriety")}
                    >
                      Retour
                    </Button>
                    <Button type="button" onClick={() => setStep("validation")}>
                      Continuer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step: Validation */}
            {step === "validation" && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h2 className="font-semibold">Validation</h2>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <h3 className="font-medium">Récapitulatif</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Titre</div>
                      <div className="font-medium truncate">
                        {formData.title || "-"}
                      </div>
                      <div className="text-muted-foreground">Prix</div>
                      <div className="font-medium">
                        {parseInt(formData.price || "0").toLocaleString(
                          "fr-FR"
                        )}{" "}
                        €
                      </div>
                      <div className="text-muted-foreground">Surface</div>
                      <div className="font-medium">
                        {formData.surface || "-"} m²
                      </div>
                      <div className="text-muted-foreground">Localisation</div>
                      <div className="font-medium">
                        {formData.city} ({formData.postalCode})
                      </div>
                      <div className="text-muted-foreground">Photos</div>
                      <div className="font-medium">
                        {formData.images.length} image(s)
                      </div>
                    </div>
                  </div>

                  {/* Informations agence */}
                  {agencyInfo && (
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Informations agence (non modifiables)
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">
                          Nom de l'agence
                        </div>
                        <div className="font-medium">
                          {agencyInfo.companyName}
                        </div>
                        <div className="text-muted-foreground">
                          N° carte professionnelle
                        </div>
                        <div className="font-medium">
                          {agencyInfo.cardNumber}
                        </div>
                        <div className="text-muted-foreground">
                          Préfecture de délivrance
                        </div>
                        <div className="font-medium">
                          {agencyInfo.cardPrefecture}
                        </div>
                        {agencyInfo.rcpProvider && (
                          <>
                            <div className="text-muted-foreground">
                              RCP - Assureur
                            </div>
                            <div className="font-medium">
                              {agencyInfo.rcpProvider}
                            </div>
                          </>
                        )}
                        {agencyInfo.rcpPolicyNumber && (
                          <>
                            <div className="text-muted-foreground">
                              RCP - N° police
                            </div>
                            <div className="font-medium">
                              {agencyInfo.rcpPolicyNumber}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={(e) =>
                          updateField("acceptTerms", e.target.checked)
                        }
                        className="mt-1 rounded"
                      />
                      <span className="text-sm">
                        J'accepte les{" "}
                        <Link
                          href="/cgu"
                          className="text-primary hover:underline"
                          target="_blank"
                        >
                          conditions d'utilisation
                        </Link>{" "}
                        *
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={formData.acceptDataProcessing}
                        onChange={(e) =>
                          updateField("acceptDataProcessing", e.target.checked)
                        }
                        className="mt-1 rounded"
                      />
                      <span className="text-sm">
                        J'accepte le traitement des données (RGPD) *
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 border-2 border-primary/20">
                      <input
                        type="checkbox"
                        checked={formData.agencyCertified}
                        onChange={(e) =>
                          updateField("agencyCertified", e.target.checked)
                        }
                        className="mt-1 rounded"
                        required
                      />
                      <span className="text-sm font-medium">
                        Je certifie l'exactitude des informations renseignées et
                        reconnais que cette annonce est publiée sous la
                        responsabilité de l'agence. *
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("photos")}
                    >
                      Retour
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        loading ||
                        !formData.acceptTerms ||
                        !formData.acceptDataProcessing ||
                        !formData.agencyCertified
                      }
                      className="gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isEditMode ? "Enregistrement..." : "Publication..."}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          {isEditMode
                            ? "Enregistrer les modifications"
                            : "Publier l'annonce"}
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
