"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Loader2,
  ArrowLeft,
  Home,
  Building2,
  Warehouse,
  Euro,
  Maximize2,
  MapPin,
  Sparkles,
  Mail,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface AlertFilters {
  query: string;
  propertyTypes: string[];
  minPrice: string;
  maxPrice: string;
  minSurface: string;
  maxSurface: string;
  minRooms: string;
  maxRooms: string;
  departments: string[];
  cities: string[];
  minRenovationScore: string;
}

const PROPERTY_TYPES = [
  { value: "house", label: "Maison", icon: Home },
  { value: "apartment", label: "Appartement", icon: Building2 },
  { value: "building", label: "Immeuble", icon: Warehouse },
];

const POPULAR_DEPARTMENTS = [
  { code: "75", name: "Paris" },
  { code: "13", name: "Bouches-du-Rhône" },
  { code: "69", name: "Rhône" },
  { code: "33", name: "Gironde" },
  { code: "31", name: "Haute-Garonne" },
  { code: "44", name: "Loire-Atlantique" },
  { code: "59", name: "Nord" },
  { code: "34", name: "Hérault" },
  { code: "06", name: "Alpes-Maritimes" },
  { code: "67", name: "Bas-Rhin" },
];

export default function NewAlertPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<"instant" | "daily" | "weekly">(
    "daily"
  );
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [filters, setFilters] = useState<AlertFilters>({
    query: "",
    propertyTypes: [],
    minPrice: "",
    maxPrice: "",
    minSurface: "",
    maxSurface: "",
    minRooms: "",
    maxRooms: "",
    departments: [],
    cities: [],
    minRenovationScore: "",
  });

  const [cityInput, setCityInput] = useState("");

  const togglePropertyType = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter((t) => t !== type)
        : [...prev.propertyTypes, type],
    }));
  };

  const toggleDepartment = (code: string) => {
    setFilters((prev) => ({
      ...prev,
      departments: prev.departments.includes(code)
        ? prev.departments.filter((d) => d !== code)
        : [...prev.departments, code],
    }));
  };

  const addCity = () => {
    if (cityInput.trim() && !filters.cities.includes(cityInput.trim())) {
      setFilters((prev) => ({
        ...prev,
        cities: [...prev.cities, cityInput.trim()],
      }));
      setCityInput("");
    }
  };

  const removeCity = (city: string) => {
    setFilters((prev) => ({
      ...prev,
      cities: prev.cities.filter((c) => c !== city),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Veuillez donner un nom à votre alerte");
      return;
    }

    setIsLoading(true);

    try {
      const alertFilters: any = {};

      if (filters.query) alertFilters.query = filters.query;
      if (filters.propertyTypes.length)
        alertFilters.propertyTypes = filters.propertyTypes;
      if (filters.minPrice)
        alertFilters.minPrice = parseInt(filters.minPrice.replace(/\s/g, ""));
      if (filters.maxPrice)
        alertFilters.maxPrice = parseInt(filters.maxPrice.replace(/\s/g, ""));
      if (filters.minSurface)
        alertFilters.minSurface = parseInt(filters.minSurface);
      if (filters.maxSurface)
        alertFilters.maxSurface = parseInt(filters.maxSurface);
      if (filters.minRooms) alertFilters.minRooms = parseInt(filters.minRooms);
      if (filters.maxRooms) alertFilters.maxRooms = parseInt(filters.maxRooms);
      if (filters.departments.length)
        alertFilters.departments = filters.departments;
      if (filters.cities.length) alertFilters.cities = filters.cities;
      if (filters.minRenovationScore)
        alertFilters.minRenovationScore = parseInt(filters.minRenovationScore);

      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          filters: alertFilters,
          frequency,
          emailEnabled,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la création");
        return;
      }

      toast.success("Alerte créée avec succès !");
      router.push("/alerts");
    } catch (error) {
      toast.error("Erreur lors de la création de l'alerte");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPriceInput = (value: string): string => {
    const numbers = value.replace(/\s/g, "").replace(/[^0-9]/g, "");
    if (!numbers) return "";
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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

  if (!session) {
    router.push("/login?callbackUrl=/alerts/new");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/30 to-background">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto max-w-2xl px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-2 mb-4 -ml-2"
            >
              <Link href="/alerts">
                <ArrowLeft className="w-4 h-4" />
                Retour aux alertes
              </Link>
            </Button>

            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              Nouvelle alerte
            </h1>
            <p className="text-muted-foreground">
              Définissez vos critères pour être notifié des nouvelles annonces
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom de l'alerte */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <label className="block text-sm font-medium mb-2">
                  Nom de l'alerte *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Maison à rénover en Bretagne"
                  className="h-12 rounded-xl"
                  required
                />
              </CardContent>
            </Card>

            {/* Type de bien */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <label className="block text-sm font-medium mb-3">
                  Type de bien
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {PROPERTY_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => togglePropertyType(type.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        filters.propertyTypes.includes(type.value)
                          ? "border-primary bg-primary/10"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <type.icon
                        className={`w-6 h-6 ${
                          filters.propertyTypes.includes(type.value)
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span className="text-sm font-medium">{type.label}</span>
                      {filters.propertyTypes.includes(type.value) && (
                        <CheckCircle2 className="w-4 h-4 text-primary absolute top-2 right-2" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Laissez vide pour tous les types
                </p>
              </CardContent>
            </Card>

            {/* Prix */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                  <Euro className="w-4 h-4 text-muted-foreground" />
                  Budget
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Prix minimum
                    </label>
                    <div className="relative mt-1">
                      <Input
                        value={filters.minPrice}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            minPrice: formatPriceInput(e.target.value),
                          })
                        }
                        placeholder="50 000"
                        className="h-11 rounded-xl pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        €
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Prix maximum
                    </label>
                    <div className="relative mt-1">
                      <Input
                        value={filters.maxPrice}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            maxPrice: formatPriceInput(e.target.value),
                          })
                        }
                        placeholder="200 000"
                        className="h-11 rounded-xl pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        €
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Surface */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-muted-foreground" />
                  Surface
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Surface minimum
                    </label>
                    <div className="relative mt-1">
                      <Input
                        type="number"
                        value={filters.minSurface}
                        onChange={(e) =>
                          setFilters({ ...filters, minSurface: e.target.value })
                        }
                        placeholder="50"
                        className="h-11 rounded-xl pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        m²
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Surface maximum
                    </label>
                    <div className="relative mt-1">
                      <Input
                        type="number"
                        value={filters.maxSurface}
                        onChange={(e) =>
                          setFilters({ ...filters, maxSurface: e.target.value })
                        }
                        placeholder="200"
                        className="h-11 rounded-xl pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        m²
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Localisation */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Localisation
                </label>

                {/* Départements */}
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground block mb-2">
                    Départements
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_DEPARTMENTS.map((dept) => (
                      <button
                        key={dept.code}
                        type="button"
                        onClick={() => toggleDepartment(dept.code)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          filters.departments.includes(dept.code)
                            ? "bg-primary text-white"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        {dept.code} - {dept.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Villes */}
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    Villes spécifiques
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCity();
                        }
                      }}
                      placeholder="Ajouter une ville..."
                      className="h-10 rounded-xl"
                    />
                    <Button
                      type="button"
                      onClick={addCity}
                      variant="secondary"
                      className="shrink-0"
                    >
                      Ajouter
                    </Button>
                  </div>
                  {filters.cities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {filters.cities.map((city) => (
                        <span
                          key={city}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-sm"
                        >
                          {city}
                          <button
                            type="button"
                            onClick={() => removeCity(city)}
                            className="hover:text-primary/70"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Score rénovation */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  Score de rénovation minimum
                </label>
                <Select
                  value={filters.minRenovationScore || "all"}
                  onValueChange={(v) =>
                    setFilters({ ...filters, minRenovationScore: v === "all" ? "" : v })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Tous les scores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les scores</SelectItem>
                    <SelectItem value="20">20+ (Faible potentiel)</SelectItem>
                    <SelectItem value="40">40+ (Potentiel moyen)</SelectItem>
                    <SelectItem value="60">60+ (Bon potentiel)</SelectItem>
                    <SelectItem value="80">
                      80+ (Excellent potentiel)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Fréquence et notification */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Fréquence des alertes
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "instant", label: "Instantanée" },
                      { value: "daily", label: "Quotidienne" },
                      { value: "weekly", label: "Hebdomadaire" },
                    ].map((freq) => (
                      <button
                        key={freq.value}
                        type="button"
                        onClick={() =>
                          setFrequency(
                            freq.value as "instant" | "daily" | "weekly"
                          )
                        }
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          frequency === freq.value
                            ? "border-primary bg-primary/10"
                            : "border-muted hover:border-primary/50"
                        }`}
                      >
                        {freq.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Checkbox
                    id="emailEnabled"
                    checked={emailEnabled}
                    onCheckedChange={(checked) =>
                      setEmailEnabled(checked as boolean)
                    }
                  />
                  <label
                    htmlFor="emailEnabled"
                    className="text-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Recevoir les alertes par email
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full h-14 rounded-xl text-lg gap-2"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Bell className="w-5 h-5" />
                  Créer l'alerte
                </>
              )}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

