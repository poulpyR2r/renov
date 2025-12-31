import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  ArrowLeft,
  Home,
  Maximize2,
  DoorOpen,
  Bed,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { getAgencyById } from "@/models/Agency";
import { getListingModel } from "@/models/Listing";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AgencyPublicPage({
  params,
}: {
  params: Promise<{ agencyId: string }>;
}) {
  const { agencyId } = await params;

  // Récupérer l'agence
  const agency = await getAgencyById(agencyId);

  if (!agency || agency.status !== "verified") {
    notFound();
  }

  // Récupérer les annonces actives de l'agence
  const Listing = await getListingModel();
  const agencyIdObj = agency._id;
  const agencyIdStr = agencyIdObj?.toString();

  const listings = await Listing.find({
    $or: [{ agencyId: agencyIdObj }, { agencyId: agencyIdStr }],
    status: "active",
  } as any)
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/30 to-background">
      <Header />

      <main className="flex-1">
        {/* Top Navigation */}
        <div className="sticky top-0 z-40 glass border-b">
          <div className="container mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link href="/search">
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Link>
            </Button>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl px-4 py-8">
          {/* Agency Header */}
          <Card className="border-0 shadow-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Logo */}
                {agency.logo && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white/20 backdrop-blur-sm border-2 border-white/30">
                    <Image
                      src={agency.logo}
                      alt={agency.companyName}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 text-white">
                  <h1 className="text-3xl font-bold mb-2">
                    {agency.tradeName || agency.companyName}
                  </h1>
                  {agency.tradeName && (
                    <p className="text-white/80 text-sm mb-4">
                      {agency.companyName}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {agency.address?.city}, {agency.address?.postalCode}
                      </span>
                    </div>
                    {agency.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <a
                          href={agency.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          Site web
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="text-white text-center">
                  <div className="text-3xl font-bold">{listings.length}</div>
                  <div className="text-sm text-white/80">Annonces</div>
                </div>
              </div>
            </div>

            {/* Description */}
            {agency.description && (
              <CardContent className="p-6">
                <p className="text-muted-foreground leading-relaxed">
                  {agency.description}
                </p>
              </CardContent>
            )}

            {/* Contact Info */}
            <CardContent className="p-6 border-t bg-muted/30">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <a
                      href={`tel:${agency.phone}`}
                      className="font-medium hover:text-primary"
                    >
                      {agency.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${agency.email}`}
                      className="font-medium hover:text-primary"
                    >
                      {agency.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Adresse</p>
                    <p className="font-medium">
                      {agency.address?.street}
                      <br />
                      {agency.address?.postalCode} {agency.address?.city}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listings */}
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Annonces ({listings.length})
            </h2>

            {listings.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucune annonce disponible pour le moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing._id?.toString()}
                    listing={{
                      ...listing,
                      _id: listing._id?.toString(),
                    }}
                    variant="default"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
