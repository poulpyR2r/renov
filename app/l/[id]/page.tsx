export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getListingModel } from "@/models/Listing";
import { ObjectId } from "mongodb";
import {
  MapPin,
  Home,
  Bed,
  ExternalLink,
  Maximize2,
  Calendar,
  Sparkles,
  ArrowLeft,
  Heart,
  AlertTriangle,
  Building2,
  DoorOpen,
  Euro,
  TrendingUp,
  Wrench,
  CheckCircle2,
  Bath,
  Ruler,
  Phone,
  Mail,
  Info,
  Zap,
  Droplets,
  Flame,
  Shield,
  FileText,
  Users,
  DollarSign,
  Percent,
  Award,
  Clock,
  Eye,
  MousePointerClick,
  Hash,
  FileCheck,
  Thermometer,
  Leaf,
  Factory,
  Hammer,
  Layers,
  Gavel,
  CreditCard,
  CheckCircle,
  XCircle,
  HelpCircle,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { ImagesCarousel } from "@/components/images-carousel";
import { FavoriteButton } from "@/components/favorite-button";
import { ListingViewTracker } from "@/components/listing-view-tracker";
import { TrackedLink } from "@/components/tracked-link";
import { ContactAgencyButton } from "@/components/contact-agency-button";
import { ShareButton } from "@/components/share-button";
import { getAgencyById } from "@/models/Agency";
import { auth } from "@/auth";

function formatPrice(price?: number): string {
  if (!price) return "Prix NC";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatNumber(num?: number): string {
  if (!num) return "NC";
  return new Intl.NumberFormat("fr-FR").format(num);
}

function getScoreColor(score?: number): string {
  if (score === undefined || score === null)
    return "bg-muted text-muted-foreground";
  if (score >= 80) return "bg-emerald-500 text-white";
  if (score >= 60) return "bg-amber-500 text-white";
  if (score >= 40) return "bg-orange-500 text-white";
  if (score >= 20) return "bg-red-500 text-white";
  return "bg-stone-500 text-white";
}

function getScoreLabel(score?: number): string {
  if (score === undefined || score === null) return "N/A";
  if (score >= 80) return "Excellent potentiel";
  if (score >= 60) return "Bon potentiel";
  if (score >= 40) return "Potentiel moyen";
  if (score >= 20) return "Faible potentiel";
  return "À évaluer";
}

function getPropertyTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    house: "Maison",
    apartment: "Appartement",
    building: "Immeuble",
    land: "Terrain",
    other: "Autre",
  };
  return labels[type || ""] || "Bien immobilier";
}

function getPropertyTypeIcon(type?: string) {
  switch (type) {
    case "house":
      return Home;
    case "apartment":
    case "building":
      return Building2;
    default:
      return Home;
  }
}

function formatDate(date?: Date | string): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getDpeClassColor(klass?: string): string {
  const colors: Record<string, string> = {
    A: "bg-emerald-500 text-white",
    B: "bg-green-500 text-white",
    C: "bg-yellow-500 text-white",
    D: "bg-amber-500 text-white",
    E: "bg-orange-500 text-white",
    F: "bg-red-500 text-white",
    G: "bg-red-700 text-white",
  };
  return colors[klass || ""] || "bg-muted text-muted-foreground";
}

function getDiagnosticStatusIcon(status?: string) {
  switch (status) {
    case "available":
      return CheckCircle;
    case "in_progress":
      return Clock;
    case "not_applicable":
      return XCircle;
    default:
      return HelpCircle;
  }
}

function getDiagnosticStatusColor(status?: string): string {
  switch (status) {
    case "available":
      return "text-emerald-500";
    case "in_progress":
      return "text-amber-500";
    case "not_applicable":
      return "text-muted-foreground";
    default:
      return "text-muted-foreground";
  }
}

function getDiagnosticStatusLabel(status?: string): string {
  switch (status) {
    case "available":
      return "Disponible";
    case "in_progress":
      return "En cours";
    case "not_applicable":
      return "Non applicable";
    default:
      return "Non renseigné";
  }
}

function getRenovationLevelLabel(level?: number): string {
  if (!level) return "Non renseigné";
  const labels: Record<number, string> = {
    1: "À rénover complètement",
    2: "Rénovation importante",
    3: "Rénovation partielle",
    4: "Bon état",
    5: "Excellent état",
  };
  return labels[level] || "Non renseigné";
}

function getRenovationLevelColor(level?: number): string {
  if (!level) return "bg-muted text-muted-foreground";
  if (level <= 2) return "bg-red-500 text-white";
  if (level === 3) return "bg-amber-500 text-white";
  return "bg-emerald-500 text-white";
}

function getRequiredWorkLabel(work?: string): string {
  const labels: Record<string, string> = {
    electricity: "Électricité",
    plumbing: "Plomberie",
    insulation: "Isolation",
    kitchen: "Cuisine",
    bathroom: "Salle de bain",
    floors: "Sols / Murs",
    roof: "Toiture / Structure",
  };
  return labels[work || ""] || work || "";
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let listing: any = null;
  const { id } = await params;

  try {
    const Listing = await getListingModel();
    listing = await Listing.findOne({
      _id: new ObjectId(id),
      status: "active",
    });
  } catch (error) {
    console.error("Error fetching listing:", error);
  }

  if (!listing) {
    notFound();
  }

  const PropertyIcon = getPropertyTypeIcon(listing.propertyType);
  const hasScore = typeof listing.renovationScore === "number";
  const pricePerSqm =
    listing.price && listing.surface
      ? Math.round(listing.price / listing.surface)
      : null;

  // Récupérer l'agence si l'annonce en a une
  let agency = null;
  let agencyListingsCount = 0;
  if (listing.agencyId) {
    try {
      agency = await getAgencyById(
        typeof listing.agencyId === "string"
          ? listing.agencyId
          : listing.agencyId.toString()
      );
      // Ne montrer que les agences vérifiées
      if (agency && agency.status !== "verified") {
        agency = null;
      } else if (agency) {
        // Compter les annonces actives de l'agence
        const Listing = await getListingModel();
        const agencyIdStr = agency._id?.toString();
        agencyListingsCount = await Listing.countDocuments({
          $or: [{ agencyId: agency._id }, { agencyId: agencyIdStr }],
          status: "active",
        } as any);
      }
    } catch (error) {
      console.error("Error fetching agency:", error);
    }
  }

  // Récupérer la session pour vérifier le rôle de l'utilisateur
  const session = await auth();
  const userRole = session?.user?.role;
  const showFavoriteButton = userRole !== "admin" && userRole !== "agency";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/30 to-background">
      <Header />

      {/* Tracker de vues pour les annonces d'agence */}
      <ListingViewTracker listingId={listing._id.toString()} />

      <main className="flex-1">
        {/* Top Navigation */}
        <div className="sticky top-0 z-40 glass border-b">
          <div className="container mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link href="/search">
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <ShareButton
                url={`${
                  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                }/l/${listing._id.toString()}`}
                title={listing.title}
                text={`${listing.title} - ${formatPrice(listing.price)}${
                  listing.location?.city ? ` à ${listing.location.city}` : ""
                }`}
              />
              {showFavoriteButton && (
                <FavoriteButton listingId={listing._id.toString()} />
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Images Carousel */}
              <ImagesCarousel images={listing.images || []} />

              {/* Title & Basic Info */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <PropertyIcon className="w-4 h-4" />
                        <span>
                          {getPropertyTypeLabel(listing.propertyType)}
                        </span>
                        {listing.transactionType && (
                          <>
                            <span className="text-muted-foreground/50">•</span>
                            <span className="capitalize">
                              {listing.transactionType}
                            </span>
                          </>
                        )}
                      </div>
                      <h1 className="text-3xl font-bold leading-tight mb-2">
                        {listing.title}
                      </h1>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {listing.location?.address && (
                            <>{listing.location.address}, </>
                          )}
                          {listing.location?.postalCode && (
                            <>{listing.location.postalCode} </>
                          )}
                          {listing.location?.city || "Ville inconnue"}
                          {listing.location?.department && (
                            <> ({listing.location.department})</>
                          )}
                        </span>
                      </div>
                    </div>
                    {listing.isSponsored && (
                      <Badge className="bg-primary text-primary-foreground">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Sponsorisé
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {listing.surface && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Ruler className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Surface
                          </p>
                          <p className="font-semibold">{listing.surface} m²</p>
                        </div>
                      </div>
                    )}
                    {listing.rooms && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <DoorOpen className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Pièces
                          </p>
                          <p className="font-semibold">{listing.rooms}</p>
                        </div>
                      </div>
                    )}
                    {listing.bedrooms && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Bed className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Chambres
                          </p>
                          <p className="font-semibold">{listing.bedrooms}</p>
                        </div>
                      </div>
                    )}
                    {listing.bathrooms && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Bath className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Salles de bain
                          </p>
                          <p className="font-semibold">{listing.bathrooms}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-stone dark:prose-invert max-w-none">
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {listing.description || "Aucune description disponible."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Diagnostics Immobiliers */}
              {listing.diagnostics && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Diagnostics Immobiliers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* DPE */}
                    {listing.diagnostics.dpe && (
                      <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Thermometer className="w-4 h-4" />
                          Diagnostic de Performance Énergétique (DPE)
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg border">
                            <p className="text-sm text-muted-foreground mb-2">
                              Classe Énergie
                            </p>
                            <Badge
                              className={`text-lg px-4 py-2 ${getDpeClassColor(
                                listing.diagnostics.dpe.energyClass
                              )}`}
                            >
                              {listing.diagnostics.dpe.energyClass || "NC"}
                            </Badge>
                          </div>
                          <div className="p-4 rounded-lg border">
                            <p className="text-sm text-muted-foreground mb-2">
                              Classe GES
                            </p>
                            <Badge
                              className={`text-lg px-4 py-2 ${getDpeClassColor(
                                listing.diagnostics.dpe.gesClass
                              )}`}
                            >
                              {listing.diagnostics.dpe.gesClass || "NC"}
                            </Badge>
                          </div>
                        </div>
                        {listing.diagnostics.dpe.energyCost && (
                          <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground mb-1">
                              Dépenses énergétiques estimées
                            </p>
                            <p className="font-semibold">
                              {formatPrice(
                                listing.diagnostics.dpe.energyCost.min
                              )}{" "}
                              à{" "}
                              {formatPrice(
                                listing.diagnostics.dpe.energyCost.max
                              )}
                              /an
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {listing.diagnostics.dpe.referenceYear && (
                            <div>
                              <p className="text-muted-foreground">
                                Année de référence
                              </p>
                              <p className="font-medium">
                                {listing.diagnostics.dpe.referenceYear}
                              </p>
                            </div>
                          )}
                          {listing.diagnostics.dpe.date && (
                            <div>
                              <p className="text-muted-foreground">
                                Date du DPE
                              </p>
                              <p className="font-medium">
                                {formatDate(listing.diagnostics.dpe.date)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Autres diagnostics */}
                    <div className="space-y-3">
                      <h3 className="font-semibold">Autres diagnostics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          {
                            key: "asbestos",
                            label: "Amiante",
                            icon: AlertTriangle,
                            value: listing.diagnostics.asbestos,
                          },
                          {
                            key: "lead",
                            label: "Plomb",
                            icon: AlertTriangle,
                            value: listing.diagnostics.lead,
                          },
                          {
                            key: "electricity",
                            label: "Électricité",
                            icon: Zap,
                            value: listing.diagnostics.electricity,
                          },
                          {
                            key: "gas",
                            label: "Gaz",
                            icon: Flame,
                            value: listing.diagnostics.gas,
                          },
                          {
                            key: "termites",
                            label: "Termites",
                            icon: AlertTriangle,
                            value: listing.diagnostics.termites,
                          },
                          {
                            key: "erp",
                            label: "ERP",
                            icon: Building2,
                            value: listing.diagnostics.erp,
                          },
                        ].map((diag) => {
                          if (!diag.value) return null;
                          const StatusIcon = getDiagnosticStatusIcon(
                            diag.value
                          );
                          return (
                            <div
                              key={diag.key}
                              className="flex items-center justify-between p-3 rounded-lg border"
                            >
                              <div className="flex items-center gap-2">
                                <diag.icon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {diag.label}
                                </span>
                              </div>
                              <div
                                className={`flex items-center gap-1 ${getDiagnosticStatusColor(
                                  diag.value
                                )}`}
                              >
                                <StatusIcon className="w-4 h-4" />
                                <span className="text-sm">
                                  {getDiagnosticStatusLabel(diag.value)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Rénovation & Travaux */}
              {listing.renovation && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hammer className="w-5 h-5 text-primary" />
                      Rénovation & Travaux
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {listing.renovation.level && (
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground mb-2">
                          Niveau de rénovation
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">
                            {getRenovationLevelLabel(listing.renovation.level)}
                          </p>
                          <Badge
                            className={`${getRenovationLevelColor(
                              listing.renovation.level
                            )}`}
                          >
                            Niveau {listing.renovation.level}/5
                          </Badge>
                        </div>
                      </div>
                    )}
                    {listing.renovation.requiredWorks &&
                      listing.renovation.requiredWorks.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Travaux à prévoir
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {listing.renovation.requiredWorks.map(
                              (work: string, idx: number) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="px-3 py-1.5"
                                >
                                  <Wrench className="w-3.5 h-3.5 mr-1.5" />
                                  {getRequiredWorkLabel(work)}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    {listing.renovation.estimatedBudget && (
                      <div className="p-4 rounded-lg border">
                        <p className="text-sm text-muted-foreground mb-1">
                          Budget travaux estimatif
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {formatPrice(listing.renovation.estimatedBudget)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Copropriété */}
              {listing.copropriety && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Copropriété
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <span className="font-medium">Bien en copropriété</span>
                      <Badge
                        variant={
                          listing.copropriety.isSubject
                            ? "default"
                            : "secondary"
                        }
                      >
                        {listing.copropriety.isSubject ? "Oui" : "Non"}
                      </Badge>
                    </div>
                    {listing.copropriety.isSubject && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {listing.copropriety.lotsCount && (
                          <div className="p-4 rounded-lg border">
                            <p className="text-sm text-muted-foreground mb-1">
                              Nombre de lots
                            </p>
                            <p className="text-xl font-semibold">
                              {formatNumber(listing.copropriety.lotsCount)}
                            </p>
                          </div>
                        )}
                        {listing.copropriety.annualCharges && (
                          <div className="p-4 rounded-lg border">
                            <p className="text-sm text-muted-foreground mb-1">
                              Charges annuelles
                            </p>
                            <p className="text-xl font-semibold">
                              {formatPrice(listing.copropriety.annualCharges)}
                            </p>
                          </div>
                        )}
                        {listing.copropriety.procedureInProgress !==
                          undefined && (
                          <div className="p-4 rounded-lg border">
                            <p className="text-sm text-muted-foreground mb-1">
                              Procédure en cours
                            </p>
                            <Badge
                              variant={
                                listing.copropriety.procedureInProgress
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {listing.copropriety.procedureInProgress
                                ? "Oui"
                                : "Non"}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Informations Agence */}
              {/* {listing.agencyInfo && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      Informations Agence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {listing.agencyInfo.companyName && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Raison sociale
                          </p>
                          <p className="font-semibold">
                            {listing.agencyInfo.companyName}
                          </p>
                        </div>
                      )}
                      {listing.agencyInfo.cardNumber && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Numéro de carte
                          </p>
                          <p className="font-semibold">
                            {listing.agencyInfo.cardNumber}
                          </p>
                        </div>
                      )}
                      {listing.agencyInfo.cardPrefecture && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Préfecture
                          </p>
                          <p className="font-semibold">
                            {listing.agencyInfo.cardPrefecture}
                          </p>
                        </div>
                      )}
                      {listing.agencyInfo.rcpProvider && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Assureur RCP
                          </p>
                          <p className="font-semibold">
                            {listing.agencyInfo.rcpProvider}
                          </p>
                        </div>
                      )}
                      {listing.agencyInfo.rcpPolicyNumber && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Numéro de police RCP
                          </p>
                          <p className="font-semibold">
                            {listing.agencyInfo.rcpPolicyNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )} */}

              {/* Certification */}
              {/* {listing.agencyCertification && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      Certification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <span className="font-medium">
                        Annonce certifiée par l'agence
                      </span>
                      <Badge
                        variant={listing.agencyCertification.certified ? "default" : "secondary"}
                        className="gap-2"
                      >
                        {listing.agencyCertification.certified ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Certifiée
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Non certifiée
                          </>
                        )}
                      </Badge>
                    </div>
                    {listing.agencyCertification.certifiedAt && (
                      <div className="mt-4 text-sm text-muted-foreground">
                        Certifiée le:{" "}
                        {formatDate(listing.agencyCertification.certifiedAt)}
                      </div>
                    )}
                    {listing.agencyCertification.certifiedBy && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Par: {listing.agencyCertification.certifiedBy}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )} */}

              {/* Métadonnées */}
              {/* <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    Informations complémentaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {listing.constructionYear && (
                      <div>
                        <p className="text-muted-foreground mb-1">
                          Année de construction
                        </p>
                        <p className="font-semibold">
                          {listing.constructionYear}
                        </p>
                      </div>
                    )}
                    {listing.createdAt && (
                      <div>
                        <p className="text-muted-foreground mb-1">
                          Date de création
                        </p>
                        <p className="font-semibold">
                          {formatDate(listing.createdAt)}
                        </p>
                      </div>
                    )}
                    {listing.updatedAt && (
                      <div>
                        <p className="text-muted-foreground mb-1">
                          Dernière mise à jour
                        </p>
                        <p className="font-semibold">
                          {formatDate(listing.updatedAt)}
                        </p>
                      </div>
                    )}
                    {listing.submittedAt && (
                      <div>
                        <p className="text-muted-foreground mb-1">
                          Date de soumission
                        </p>
                        <p className="font-semibold">
                          {formatDate(listing.submittedAt)}
                        </p>
                      </div>
                    )}
                    {listing.views !== undefined && (
                      <div>
                        <p className="text-muted-foreground mb-1 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Vues
                        </p>
                        <p className="font-semibold">
                          {formatNumber(listing.views)}
                        </p>
                      </div>
                    )}
                    {listing.clicks !== undefined && (
                      <div>
                        <p className="text-muted-foreground mb-1 flex items-center gap-2">
                          <MousePointerClick className="w-4 h-4" />
                          Clics
                        </p>
                        <p className="font-semibold">
                          {formatNumber(listing.clicks)}
                        </p>
                      </div>
                    )}
                    {listing.status && (
                      <div>
                        <p className="text-muted-foreground mb-1">Statut</p>
                        <Badge
                          variant={
                            listing.status === "active"
                              ? "default"
                              : listing.status === "pending"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {listing.status === "active"
                            ? "Active"
                            : listing.status === "pending"
                            ? "En attente"
                            : listing.status === "sold"
                            ? "Vendu"
                            : "Inactive"}
                        </Badge>
                      </div>
                    )}
                    {listing.fingerprint && (
                      <div>
                        <p className="text-muted-foreground mb-1 flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          Empreinte
                        </p>
                        <p className="font-mono text-xs break-all">
                          {listing.fingerprint.substring(0, 20)}...
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card> */}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Price Card */}
              <Card className="border-0 shadow-xl overflow-hidden sticky top-20">
                <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-white">
                  {/* Calcul du budget total */}
                  {(() => {
                    const basePrice = listing.price || 0;
                    let feesAmount = 0;
                    let totalBudget = basePrice;

                    // Calculer le montant des honoraires si non inclus
                    if (listing.fees && !listing.fees.included) {
                      if (listing.fees.amount) {
                        feesAmount = listing.fees.amount;
                      } else if (listing.fees.percentage && basePrice > 0) {
                        feesAmount = Math.round(
                          (basePrice * listing.fees.percentage) / 100
                        );
                      }
                      totalBudget = basePrice + feesAmount;
                    }

                    return (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-white/80 mb-1">
                            Prix du bien
                          </p>
                          <p className="text-4xl font-bold">
                            {formatPrice(basePrice)}
                          </p>
                        </div>

                        {/* Honoraires si non inclus */}
                        {listing.fees &&
                          !listing.fees.included &&
                          feesAmount > 0 && (
                            <div className="pt-3 border-t border-white/20">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm text-white/80">
                                  Honoraires
                                  {listing.fees.percentage &&
                                    ` (${listing.fees.percentage}%)`}
                                </p>
                                <p className="text-lg font-semibold">
                                  +{formatPrice(feesAmount)}
                                </p>
                              </div>
                              {listing.fees.paidBy && (
                                <p className="text-xs text-white/60">
                                  À la charge du{" "}
                                  {listing.fees.paidBy === "seller"
                                    ? "vendeur"
                                    : "acquéreur"}
                                </p>
                              )}
                            </div>
                          )}

                        {/* Budget total */}
                        {listing.fees &&
                          !listing.fees.included &&
                          feesAmount > 0 && (
                            <div className="pt-3 border-t border-white/30">
                              <p className="text-sm text-white/80 mb-1">
                                Budget total TTC
                              </p>
                              <p className="text-3xl font-bold">
                                {formatPrice(totalBudget)}
                              </p>
                              <p className="text-xs text-white/60 mt-1">
                                Toutes Taxes Comprises
                              </p>
                            </div>
                          )}

                        {/* Honoraires inclus */}
                        {listing.fees && listing.fees.included && (
                          <div className="pt-2">
                            <p className="text-xs text-white/60">
                              Honoraires inclus dans le prix
                            </p>
                          </div>
                        )}

                        {pricePerSqm && (
                          <p className="text-white/80 text-sm pt-2">
                            soit {pricePerSqm.toLocaleString("fr-FR")} €/m²
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Renovation Score */}
                  {/* {hasScore && (
                    <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary" />
                          <span className="font-medium">Score Rénovation</span>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(
                            listing.renovationScore
                          )}`}
                        >
                          {listing.renovationScore}/100
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            listing.renovationScore >= 80
                              ? "bg-emerald-500"
                              : listing.renovationScore >= 60
                              ? "bg-amber-500"
                              : listing.renovationScore >= 40
                              ? "bg-orange-500"
                              : listing.renovationScore >= 20
                              ? "bg-red-500"
                              : "bg-stone-500"
                          }`}
                          style={{
                            width: `${Math.max(listing.renovationScore, 5)}%`,
                          }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getScoreLabel(listing.renovationScore)}
                      </p>
                    </div>
                  )} */}

                  {/* Carte Agence */}
                  {agency && (
                    <Card className="border shadow-sm">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Header Agence */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {agency.logo ? (
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                                  <img
                                    src={agency.logo}
                                    alt={agency.companyName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Building2 className="w-6 h-6 text-primary" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-sm truncate">
                                    {agency.companyName}
                                  </p>
                                  <Badge
                                    variant="default"
                                    className="text-xs px-2 py-0.5"
                                  >
                                    Pro
                                  </Badge>
                                </div>
                                {agencyListingsCount > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    {agencyListingsCount}{" "}
                                    {agencyListingsCount === 1
                                      ? "annonce"
                                      : "annonces"}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Link href={`/agence/${agency._id?.toString()}`}>
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            </Button>
                          </div>

                          {/* Boutons de contact */}
                          <div className="space-y-2">
                            {agency && (
                              <ContactAgencyButton
                                listingId={listing._id.toString()}
                                agencyId={agency._id!.toString()}
                                className="w-full rounded-lg h-11"
                              />
                            )}
                            {(listing.contactPhone || agency.phone) && (
                              <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="w-full rounded-lg h-11"
                              >
                                <a
                                  href={`tel:${
                                    listing.contactPhone || agency.phone
                                  }`}
                                >
                                  <Phone className="w-4 h-4 mr-2" />
                                  Voir le numéro
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-2">
                    {showFavoriteButton && (
                      <FavoriteButton
                        listingId={listing._id.toString()}
                        variant="button"
                        className="w-full rounded-xl h-12"
                      />
                    )}

                    {listing.externalUrl && (
                      <Button
                        asChild
                        size="lg"
                        className="w-full rounded-xl h-12 shadow-lg shadow-primary/25"
                      >
                        <TrackedLink
                          listingId={listing._id.toString()}
                          href={listing.externalUrl}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Voir l'annonce originale
                        </TrackedLink>
                      </Button>
                    )}

                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="w-full rounded-xl h-12"
                    >
                      <Link href={`/optout?listing=${listing._id}`}>
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Signaler / Retirer
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
