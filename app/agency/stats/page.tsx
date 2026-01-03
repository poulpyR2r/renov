"use client";

import useSWR from "swr";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Eye, MousePointerClick, Heart, Loader2, Lock, Phone, Mail, MessageSquare, ExternalLink } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StatsData {
  pack: {
    type: string;
    name: string;
    visibleStats: {
      views: boolean;
      clicks: boolean;
      contacts: boolean;
      performancePerListing: boolean;
      costPerContact: boolean;
      globalPerformance: boolean;
      performanceByZone: boolean;
    };
  };
  overview: {
    totalListings: number;
    totalViews: number;
    totalClicks: number;
    totalFavorites: number;
    totalContacts: number | null;
    contactsLocked: boolean;
    costPerContact: string | null;
    costPerContactLocked: boolean;
    avgViewsPerListing: number;
    avgClicksPerListing: number;
    ctr: string;
  };
  // ✅ Statistiques de contacts détaillées
  contacts: {
    total: number;
    byType: {
      message: number;
      form_submission: number;
      phone_click: number;
      email_click: number;
      whatsapp_click: number;
      external_link: number;
    };
    timeline: Array<{ date: string; count: number }>;
    byListing: Array<{ listingId: string; count: number }>;
  } | null;
  contactsLocked: boolean;
  dailyData: Array<{
    date: string;
    views: number;
    clicks: number;
    favorites: number;
    listings: number;
  }>;
  monthlyData: Array<{
    month: string;
    views: number;
    clicks: number;
    listings: number;
  }>;
  listingPerformance: Array<{
    id: string;
    title: string;
    views: number;
    clicks: number;
    favorites: number;
    isSponsored: boolean;
    createdAt: string;
    ctr: number;
  }> | null;
  listingPerformanceLocked: boolean;
  propertyTypeData: Array<{
    type: string;
    views: number;
    clicks: number;
    count: number;
    avgViews: number;
    avgClicks: number;
  }> | null;
  propertyTypeDataLocked: boolean;
  // ✅ NOUVELLES STATS PRO
  conversionFunnel: {
    views: number;
    clicks: number;
    contacts: number;
    viewToClickRate: string;
    clickToContactRate: string;
    viewToContactRate: string;
  } | null;
  conversionFunnelLocked: boolean;
  bestPerformingTimes: {
    byDayOfWeek: Array<{ day: string; dayIndex: number; views: number; clicks: number }>;
    byHour: Array<{ hour: string; views: number; clicks: number }>;
    bestDay: string;
    bestHour: string;
    peakPerformance: string;
  } | null;
  bestPerformingTimesLocked: boolean;
  cpcAnalysis: {
    totalSpent: number;
    currentBalance: number;
    avgCostPerClick: number;
    sponsored: {
      listings: number;
      views: number;
      clicks: number;
      avgViewsPerListing: number;
      avgClicksPerListing: number;
    };
    organic: {
      listings: number;
      views: number;
      clicks: number;
      avgViewsPerListing: number;
      avgClicksPerListing: number;
    };
    cpcBoostMultiplier: string;
    estimatedROI: string;
    recommendations: string[];
  } | null;
  cpcAnalysisLocked: boolean;
  // ✅ STATS PREMIUM EXCLUSIVES
  globalPerformance: {
    platformAverages: {
      avgViewsPerListing: number;
      avgClicksPerListing: number;
      avgCtr: number;
      avgContactRate: number;
    };
    yourPerformance: {
      avgViewsPerListing: number;
      avgClicksPerListing: number;
      avgCtr: number;
      avgContactRate: number;
    };
    comparison: {
      viewsVsPlatform: number;
      clicksVsPlatform: number;
      ctrVsPlatform: number;
    };
    ranking: {
      percentile: number;
      badge: string;
    };
    globalScore: number;
  } | null;
  globalPerformanceLocked: boolean;
  performanceByZone: {
    zones: Array<{
      department: string;
      listings: number;
      views: number;
      clicks: number;
      avgViews: number;
      avgClicks: number;
      ctr: number;
    }>;
    summary: {
      totalZones: number;
      bestPerforming: { department: string; views: number; avgViews: number } | null;
      leastPerforming: { department: string; views: number; avgViews: number } | null;
    };
    recommendations: string[];
  } | null;
  performanceByZoneLocked: boolean;
  costPerContactAnalysis: {
    totalContacts: number;
    totalSpent: number;
    costPerContact: number;
    industryAverage: number;
    comparison: number;
    trend: "up" | "down" | "stable";
    trendPercent: number;
    estimatedContactValue: number;
    estimatedTotalValue: number;
    roi: number;
  } | null;
  costPerContactAnalysisLocked: boolean;
  cpcComparison: {
    sponsored: {
      count: number;
      totalViews: number;
      totalClicks: number;
      avgViews: number;
      avgClicks: number;
    };
    nonSponsored: {
      count: number;
      totalViews: number;
      totalClicks: number;
      avgViews: number;
      avgClicks: number;
    };
  };
}

const COLORS = ["#f97316", "#fb923c", "#fdba74", "#fbbf24", "#f59e0b"];

export default function AgencyStatsPage() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: StatsData }>(
    "/api/agency/stats",
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Erreur lors du chargement des statistiques</p>
      </div>
    );
  }

  const stats = data.data;

  // Format daily data for chart
  const formattedDailyData = stats.dailyData.map((item) => ({
    date: new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    Vues: item.views,
    Clics: item.clicks,
    Favoris: item.favorites,
  }));

  // Format monthly data
  const formattedMonthlyData = stats.monthlyData.map((item) => ({
    mois: item.month,
    Vues: item.views,
    Clics: item.clicks,
    Annonces: item.listings,
  }));

  // Format property type data (peut être null selon le pack)
  const formattedPropertyData = stats.propertyTypeData?.map((item) => ({
    type: item.type,
    Vues: item.views,
    Clics: item.clicks,
    "Nb annonces": item.count,
  })) || [];

  // CPC comparison data
  const cpcData = [
    {
      name: "Sponsorisées",
      Vues: stats.cpcComparison.sponsored.totalViews,
      Clics: stats.cpcComparison.sponsored.totalClicks,
      "Nb annonces": stats.cpcComparison.sponsored.count,
    },
    {
      name: "Non sponsorisées",
      Vues: stats.cpcComparison.nonSponsored.totalViews,
      Clics: stats.cpcComparison.nonSponsored.totalClicks,
      "Nb annonces": stats.cpcComparison.nonSponsored.count,
    },
  ];

  // Contacts breakdown data for pie chart
  const CONTACT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6366f1"];
  const contactsBreakdownData = stats.contacts?.byType ? [
    { name: "Téléphone", value: stats.contacts.byType.phone_click, icon: Phone },
    { name: "Email", value: stats.contacts.byType.email_click, icon: Mail },
    { name: "Messagerie", value: stats.contacts.byType.message, icon: MessageSquare },
    { name: "Formulaire", value: stats.contacts.byType.form_submission, icon: ExternalLink },
    { name: "WhatsApp", value: stats.contacts.byType.whatsapp_click, icon: Phone },
    { name: "Autres", value: stats.contacts.byType.external_link, icon: ExternalLink },
  ].filter(item => item.value > 0) : [];

  // Contacts timeline
  const contactsTimelineData = stats.contacts?.timeline?.map(item => ({
    date: new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    Contacts: item.count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Statistiques</h1>
        <p className="text-muted-foreground mt-1">
          Analysez les performances de vos annonces
        </p>
      </div>

      {/* Overview Cards - Simplifié pour FREE */}
      {stats.pack.type === "FREE" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vues</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.overview.avgViewsPerListing} vues/annonce en moyenne
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clics</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalClicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.overview.avgClicksPerListing} clics/annonce en moyenne
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de clic (CTR)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.ctr}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.overview.totalClicks} clics / {stats.overview.totalViews} vues
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vues</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.overview.avgViewsPerListing} vues/annonce en moyenne
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clics</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalClicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.overview.avgClicksPerListing} clics/annonce en moyenne
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de clic (CTR)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.ctr}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.overview.totalClicks} clics / {stats.overview.totalViews} vues
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Favoris</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalFavorites.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.overview.totalListings} annonces au total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Daily Trends Chart - Cumulative */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution sur 30 jours (cumulé)</CardTitle>
          <CardDescription>
            {stats.pack.type === "FREE" 
              ? "Total cumulé des vues et clics" 
              : "Total cumulé des vues, clics et favoris"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={formattedDailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [value, `${name} (total)`]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Vues"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Vues"
              />
              <Line
                type="monotone"
                dataKey="Clics"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Clics"
              />
              {stats.pack.type !== "FREE" && (
                <Line
                  type="monotone"
                  dataKey="Favoris"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Favoris"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pour le pack FREE : Message d'upgrade et stats limitées */}
      {stats.pack.type === "FREE" ? (
        <>
          {/* Performance mensuelle simplifiée */}
          <Card>
            <CardHeader>
              <CardTitle>Performance mensuelle</CardTitle>
              <CardDescription>
                Vues et clics par mois (12 derniers mois)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formattedMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Vues" fill="#f97316" />
                  <Bar dataKey="Clics" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Message d'upgrade avec fonctionnalités verrouillées */}
          <Card className="border-dashed border-2 border-muted-foreground/20">
            <CardContent className="py-8">
              <div className="text-center">
                <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Débloquez toutes les statistiques
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Passez au pack Starter ou supérieur pour accéder aux statistiques avancées :
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 max-w-2xl mx-auto text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>Favoris</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>Contacts reçus</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>Comparaison CPC</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>Top annonces</span>
                  </div>
                </div>
                <Button asChild size="lg">
                  <Link href="/agency/subscription">Voir les packs disponibles</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Monthly Performance - Version complète pour packs payants */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance mensuelle</CardTitle>
                <CardDescription>
                  Vues et clics par mois (12 derniers mois)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formattedMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Vues" fill="#f97316" />
                    <Bar dataKey="Clics" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className={stats.propertyTypeDataLocked ? "opacity-75" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Performance par type de bien
                  {stats.propertyTypeDataLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                </CardTitle>
                <CardDescription>
                  {stats.propertyTypeDataLocked 
                    ? "Passez au pack Pro pour accéder à cette statistique"
                    : "Répartition des vues et clics par type"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.propertyTypeDataLocked ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Cette statistique est réservée au pack Pro</p>
                    <Button asChild>
                      <Link href="/agency/subscription">Passer au pack Pro</Link>
                    </Button>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={formattedPropertyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Vues" fill="#f97316" />
                      <Bar dataKey="Clics" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* CPC Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Comparaison CPC vs Non-CPC</CardTitle>
              <CardDescription>
                Performance des annonces sponsorisées vs non sponsorisées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-4">Vues et Clics</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={cpcData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Vues" fill="#f97316" />
                      <Bar dataKey="Clics" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-4">Statistiques détaillées</h3>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Annonces sponsorisées</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nombre:</span>
                          <span className="font-medium">{stats.cpcComparison.sponsored.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vues moyennes:</span>
                          <span className="font-medium">{stats.cpcComparison.sponsored.avgViews}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Clics moyens:</span>
                          <span className="font-medium">{stats.cpcComparison.sponsored.avgClicks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total vues:</span>
                          <span className="font-medium">{stats.cpcComparison.sponsored.totalViews.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total clics:</span>
                          <span className="font-medium">{stats.cpcComparison.sponsored.totalClicks.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Annonces non sponsorisées</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nombre:</span>
                          <span className="font-medium">{stats.cpcComparison.nonSponsored.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vues moyennes:</span>
                          <span className="font-medium">{stats.cpcComparison.nonSponsored.avgViews}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Clics moyens:</span>
                          <span className="font-medium">{stats.cpcComparison.nonSponsored.avgClicks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total vues:</span>
                          <span className="font-medium">{stats.cpcComparison.nonSponsored.totalViews.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total clics:</span>
                          <span className="font-medium">{stats.cpcComparison.nonSponsored.totalClicks.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ✅ Section Contacts reçus - STARTER+ */}
          <Card className={stats.contactsLocked ? "opacity-75" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Contacts reçus
                {stats.contactsLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
              </CardTitle>
              <CardDescription>
                {stats.contactsLocked 
                  ? "Passez au pack Starter pour voir vos contacts"
                  : "Détails des contacts par canal de communication"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.contactsLocked ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Le suivi des contacts est réservé aux packs payants
                  </p>
                  <Button asChild>
                    <Link href="/agency/subscription">Passer au pack Starter</Link>
                  </Button>
                </div>
              ) : stats.contacts && stats.contacts.total > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Répartition par type */}
                  <div>
                    <h3 className="text-sm font-medium mb-4">Répartition par canal</h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Phone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{stats.contacts.byType.phone_click}</p>
                          <p className="text-xs text-muted-foreground">Téléphone</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-emerald-600">{stats.contacts.byType.email_click}</p>
                          <p className="text-xs text-muted-foreground">Email</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-600">{stats.contacts.byType.message}</p>
                          <p className="text-xs text-muted-foreground">Messagerie</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-amber-600">
                            {(stats.contacts.byType.form_submission || 0) + 
                             (stats.contacts.byType.whatsapp_click || 0) + 
                             (stats.contacts.byType.external_link || 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">Autres</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Graphique camembert */}
                    {contactsBreakdownData.length > 0 && (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={contactsBreakdownData}
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {contactsBreakdownData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CONTACT_COLORS[index % CONTACT_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  
                  {/* Timeline des contacts */}
                  <div>
                    <h3 className="text-sm font-medium mb-4">Évolution des contacts (30 jours)</h3>
                    {contactsTimelineData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={contactsTimelineData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="Contacts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                        Aucun contact dans les 30 derniers jours
                      </div>
                    )}
                    
                    {/* Résumé */}
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total des contacts</span>
                        <span className="text-2xl font-bold">{stats.contacts.total}</span>
                      </div>
                      {stats.overview.costPerContact && (
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-muted-foreground">Coût par contact</span>
                          <span className="text-lg font-semibold text-emerald-600">{stats.overview.costPerContact}€</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">Aucun contact reçu pour le moment</p>
                  <p className="text-sm text-muted-foreground">
                    Les contacts sont comptabilisés quand un acheteur clique sur votre téléphone, email ou vous envoie un message.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className={stats.listingPerformanceLocked ? "opacity-75" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Top 10 des annonces
                {stats.listingPerformanceLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
              </CardTitle>
              <CardDescription>
                {stats.listingPerformanceLocked 
                  ? "Passez au pack Pro pour voir la performance par annonce"
                  : "Vos annonces les plus performantes"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.listingPerformanceLocked ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    La performance détaillée par annonce est réservée au pack Pro
                  </p>
                  <Button asChild>
                    <Link href="/agency/subscription">Passer au pack Pro</Link>
                  </Button>
                </div>
              ) : stats.listingPerformance && stats.listingPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Annonce</th>
                        <th className="text-right py-3 px-4 font-medium">Vues</th>
                        <th className="text-right py-3 px-4 font-medium">Clics</th>
                        <th className="text-right py-3 px-4 font-medium">Favoris</th>
                        <th className="text-right py-3 px-4 font-medium">CTR</th>
                        <th className="text-center py-3 px-4 font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.listingPerformance.map((listing, index) => (
                        <tr key={listing.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">#{index + 1}</span>
                              <span className="font-medium">{listing.title}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4">{listing.views.toLocaleString()}</td>
                          <td className="text-right py-3 px-4">{listing.clicks.toLocaleString()}</td>
                          <td className="text-right py-3 px-4">{listing.favorites.toLocaleString()}</td>
                          <td className="text-right py-3 px-4">{listing.ctr.toFixed(2)}%</td>
                          <td className="text-center py-3 px-4">
                            {listing.isSponsored ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600">
                                Sponsorisée
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                Standard
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune annonce à afficher
                </div>
              )}
            </CardContent>
          </Card>

          {/* ✅ NOUVELLES STATS PRO : Funnel de Conversion */}
          <Card className={stats.conversionFunnelLocked ? "opacity-75" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Funnel de Conversion
                {stats.conversionFunnelLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
              </CardTitle>
              <CardDescription>
                {stats.conversionFunnelLocked 
                  ? "Passez au pack Pro pour voir le funnel de conversion"
                  : "Visualisez le parcours de vos visiteurs"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.conversionFunnelLocked ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Le funnel de conversion est réservé au pack Pro
                  </p>
                  <Button asChild>
                    <Link href="/agency/subscription">Passer au pack Pro</Link>
                  </Button>
                </div>
              ) : stats.conversionFunnel ? (
                <div className="space-y-6">
                  {/* Funnel visuel */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-full max-w-md">
                      <div className="bg-blue-500 text-white p-4 rounded-t-lg text-center">
                        <div className="text-2xl font-bold">{stats.conversionFunnel.views.toLocaleString()}</div>
                        <div className="text-sm opacity-90">Vues</div>
                      </div>
                      <div className="flex justify-center">
                        <div className="w-0 h-0 border-l-[100px] border-l-transparent border-r-[100px] border-r-transparent border-t-[20px] border-t-blue-500"></div>
                      </div>
                      <div className="text-center text-sm text-muted-foreground py-1">
                        ↓ {stats.conversionFunnel.viewToClickRate}% cliquent
                      </div>
                      <div className="bg-orange-500 text-white p-4 text-center" style={{ marginLeft: '10%', marginRight: '10%' }}>
                        <div className="text-2xl font-bold">{stats.conversionFunnel.clicks.toLocaleString()}</div>
                        <div className="text-sm opacity-90">Clics</div>
                      </div>
                      <div className="flex justify-center">
                        <div className="w-0 h-0 border-l-[80px] border-l-transparent border-r-[80px] border-r-transparent border-t-[20px] border-t-orange-500"></div>
                      </div>
                      <div className="text-center text-sm text-muted-foreground py-1">
                        ↓ {stats.conversionFunnel.clickToContactRate}% contactent
                      </div>
                      <div className="bg-emerald-500 text-white p-4 rounded-b-lg text-center" style={{ marginLeft: '20%', marginRight: '20%' }}>
                        <div className="text-2xl font-bold">{stats.conversionFunnel.contacts}</div>
                        <div className="text-sm opacity-90">Contacts</div>
                      </div>
                    </div>
                  </div>

                  {/* Stats détaillées */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Taux de clic</div>
                      <div className="text-xl font-bold text-blue-600">{stats.conversionFunnel.viewToClickRate}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Taux de contact</div>
                      <div className="text-xl font-bold text-orange-600">{stats.conversionFunnel.clickToContactRate}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Conversion globale</div>
                      <div className="text-xl font-bold text-emerald-600">{stats.conversionFunnel.viewToContactRate}%</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Pas assez de données
                </div>
              )}
            </CardContent>
          </Card>

          {/* ✅ NOUVELLES STATS PRO : Meilleurs Créneaux */}
          <Card className={stats.bestPerformingTimesLocked ? "opacity-75" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Meilleurs Créneaux
                {stats.bestPerformingTimesLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
              </CardTitle>
              <CardDescription>
                {stats.bestPerformingTimesLocked 
                  ? "Passez au pack Pro pour voir les meilleurs créneaux"
                  : `Meilleur jour : ${stats.bestPerformingTimes?.bestDay} • Meilleure heure : ${stats.bestPerformingTimes?.bestHour}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.bestPerformingTimesLocked ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Les créneaux de performance sont réservés au pack Pro
                  </p>
                  <Button asChild>
                    <Link href="/agency/subscription">Passer au pack Pro</Link>
                  </Button>
                </div>
              ) : stats.bestPerformingTimes ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Par jour de la semaine */}
                  <div>
                    <h3 className="text-sm font-medium mb-4">Performance par jour</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats.bestPerformingTimes.byDayOfWeek}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="views" name="Vues" fill="#3b82f6" />
                        <Bar dataKey="clicks" name="Clics" fill="#f97316" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Par heure */}
                  <div>
                    <h3 className="text-sm font-medium mb-4">Performance par créneau horaire</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats.bestPerformingTimes.byHour}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="views" name="Vues" fill="#3b82f6" />
                        <Bar dataKey="clicks" name="Clics" fill="#f97316" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Pas assez de données
                </div>
              )}
            </CardContent>
          </Card>

          {/* ✅ NOUVELLES STATS PRO : Analyse CPC Approfondie */}
          <Card className={stats.cpcAnalysisLocked ? "opacity-75" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointerClick className="w-5 h-5" />
                Analyse CPC Approfondie
                {stats.cpcAnalysisLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
              </CardTitle>
              <CardDescription>
                {stats.cpcAnalysisLocked 
                  ? "Passez au pack Pro pour l'analyse CPC détaillée"
                  : "ROI et efficacité de vos campagnes sponsorisées"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.cpcAnalysisLocked ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    L'analyse CPC détaillée est réservée au pack Pro
                  </p>
                  <Button asChild>
                    <Link href="/agency/subscription">Passer au pack Pro</Link>
                  </Button>
                </div>
              ) : stats.cpcAnalysis ? (
                <div className="space-y-6">
                  {/* KPIs CPC */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-emerald-600">{stats.cpcAnalysis.currentBalance.toFixed(2)}€</div>
                      <div className="text-sm text-muted-foreground">Solde actuel</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.cpcAnalysis.totalSpent.toFixed(2)}€</div>
                      <div className="text-sm text-muted-foreground">Total dépensé</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">{stats.cpcAnalysis.cpcBoostMultiplier}x</div>
                      <div className="text-sm text-muted-foreground">Boost CPC</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.cpcAnalysis.estimatedROI}x</div>
                      <div className="text-sm text-muted-foreground">ROI estimé</div>
                    </div>
                  </div>

                  {/* Comparaison Sponsorisé vs Organique */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                      <h4 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                        <MousePointerClick className="w-4 h-4" />
                        Annonces Sponsorisées
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Annonces</div>
                          <div className="font-bold text-lg">{stats.cpcAnalysis.sponsored.listings}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Vues totales</div>
                          <div className="font-bold text-lg">{stats.cpcAnalysis.sponsored.views.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Moy. vues/annonce</div>
                          <div className="font-bold text-lg">{stats.cpcAnalysis.sponsored.avgViewsPerListing}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Moy. clics/annonce</div>
                          <div className="font-bold text-lg">{stats.cpcAnalysis.sponsored.avgClicksPerListing}</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Annonces Organiques
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Annonces</div>
                          <div className="font-bold text-lg">{stats.cpcAnalysis.organic.listings}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Vues totales</div>
                          <div className="font-bold text-lg">{stats.cpcAnalysis.organic.views.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Moy. vues/annonce</div>
                          <div className="font-bold text-lg">{stats.cpcAnalysis.organic.avgViewsPerListing}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Moy. clics/annonce</div>
                          <div className="font-bold text-lg">{stats.cpcAnalysis.organic.avgClicksPerListing}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommandations */}
                  {stats.cpcAnalysis.recommendations.length > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-700 mb-2">💡 Recommandations</h4>
                      <ul className="space-y-1">
                        {stats.cpcAnalysis.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-blue-600 flex items-start gap-2">
                            <span>•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Pas assez de données
                </div>
              )}
            </CardContent>
          </Card>

          {/* ✅ STATS PREMIUM : Performance Globale */}
          <Card className={`${stats.globalPerformanceLocked ? "opacity-75" : ""} border-2 ${!stats.globalPerformanceLocked ? "border-purple-200" : ""}`}>
            <CardHeader className={!stats.globalPerformanceLocked ? "bg-gradient-to-r from-purple-50 to-pink-50" : ""}>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Performance Globale
                {stats.globalPerformanceLocked ? (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">PREMIUM</span>
                )}
              </CardTitle>
              <CardDescription>
                {stats.globalPerformanceLocked 
                  ? "Passez au pack Premium pour voir votre performance vs la plateforme"
                  : "Comparez-vous aux autres agences de la plateforme"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.globalPerformanceLocked ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Les benchmarks plateforme sont réservés au pack Premium
                  </p>
                  <Button asChild className="bg-purple-600 hover:bg-purple-700">
                    <Link href="/agency/subscription">Passer au pack Premium</Link>
                  </Button>
                </div>
              ) : stats.globalPerformance ? (
                <div className="space-y-6">
                  {/* Score global */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-40 h-40">
                      <svg className="w-40 h-40 transform -rotate-90">
                        <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                        <circle 
                          cx="80" cy="80" r="70" fill="none" stroke="url(#gradient)" strokeWidth="12"
                          strokeDasharray={`${stats.globalPerformance.globalScore * 4.4} 440`}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-3xl font-bold">{stats.globalPerformance.globalScore}</div>
                        <div className="text-sm text-muted-foreground">/ 100</div>
                      </div>
                    </div>
                  </div>

                  {/* Badge et classement */}
                  <div className="text-center">
                    <div className="text-xl font-semibold mb-1">{stats.globalPerformance.ranking.badge}</div>
                    <div className="text-sm text-muted-foreground">
                      Top {100 - stats.globalPerformance.ranking.percentile}% des agences
                    </div>
                  </div>

                  {/* Comparaison vs plateforme */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground mb-1">Vues/annonce</div>
                      <div className="text-lg font-bold">{stats.globalPerformance.yourPerformance.avgViewsPerListing}</div>
                      <div className={`text-xs ${stats.globalPerformance.comparison.viewsVsPlatform >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {stats.globalPerformance.comparison.viewsVsPlatform >= 0 ? '+' : ''}{stats.globalPerformance.comparison.viewsVsPlatform}% vs moy.
                      </div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground mb-1">Clics/annonce</div>
                      <div className="text-lg font-bold">{stats.globalPerformance.yourPerformance.avgClicksPerListing}</div>
                      <div className={`text-xs ${stats.globalPerformance.comparison.clicksVsPlatform >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {stats.globalPerformance.comparison.clicksVsPlatform >= 0 ? '+' : ''}{stats.globalPerformance.comparison.clicksVsPlatform}% vs moy.
                      </div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground mb-1">CTR</div>
                      <div className="text-lg font-bold">{stats.globalPerformance.yourPerformance.avgCtr}%</div>
                      <div className={`text-xs ${stats.globalPerformance.comparison.ctrVsPlatform >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {stats.globalPerformance.comparison.ctrVsPlatform >= 0 ? '+' : ''}{stats.globalPerformance.comparison.ctrVsPlatform}% vs moy.
                      </div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground mb-1">Taux contact</div>
                      <div className="text-lg font-bold">{stats.globalPerformance.yourPerformance.avgContactRate}%</div>
                      <div className="text-xs text-muted-foreground">
                        Moy. {stats.globalPerformance.platformAverages.avgContactRate}%
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Pas assez de données
                </div>
              )}
            </CardContent>
          </Card>

          {/* ✅ STATS PREMIUM : Performance par Zone */}
          <Card className={`${stats.performanceByZoneLocked ? "opacity-75" : ""} border-2 ${!stats.performanceByZoneLocked ? "border-purple-200" : ""}`}>
            <CardHeader className={!stats.performanceByZoneLocked ? "bg-gradient-to-r from-purple-50 to-pink-50" : ""}>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-600" />
                Performance par Zone
                {stats.performanceByZoneLocked ? (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">PREMIUM</span>
                )}
              </CardTitle>
              <CardDescription>
                {stats.performanceByZoneLocked 
                  ? "Passez au pack Premium pour l'analyse géographique"
                  : `${stats.performanceByZone?.summary.totalZones || 0} zone(s) analysée(s)`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.performanceByZoneLocked ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    L'analyse géographique est réservée au pack Premium
                  </p>
                  <Button asChild className="bg-purple-600 hover:bg-purple-700">
                    <Link href="/agency/subscription">Passer au pack Premium</Link>
                  </Button>
                </div>
              ) : stats.performanceByZone && stats.performanceByZone.zones.length > 0 ? (
                <div className="space-y-6">
                  {/* Résumé zones */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.performanceByZone.summary.bestPerforming && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="text-sm text-emerald-600 mb-1">🏆 Meilleure zone</div>
                        <div className="text-xl font-bold text-emerald-700">
                          {stats.performanceByZone.summary.bestPerforming.department}
                        </div>
                        <div className="text-sm text-emerald-600">
                          {stats.performanceByZone.summary.bestPerforming.views} vues • {stats.performanceByZone.summary.bestPerforming.avgViews} moy/annonce
                        </div>
                      </div>
                    )}
                    {stats.performanceByZone.summary.leastPerforming && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="text-sm text-amber-600 mb-1">📈 À améliorer</div>
                        <div className="text-xl font-bold text-amber-700">
                          {stats.performanceByZone.summary.leastPerforming.department}
                        </div>
                        <div className="text-sm text-amber-600">
                          {stats.performanceByZone.summary.leastPerforming.views} vues • {stats.performanceByZone.summary.leastPerforming.avgViews} moy/annonce
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tableau des zones */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium">Département</th>
                          <th className="text-right py-2 px-3 font-medium">Annonces</th>
                          <th className="text-right py-2 px-3 font-medium">Vues</th>
                          <th className="text-right py-2 px-3 font-medium">Clics</th>
                          <th className="text-right py-2 px-3 font-medium">CTR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.performanceByZone.zones.map((zone, i) => (
                          <tr key={zone.department} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-3 font-medium">
                              {i === 0 && "🥇 "}
                              {i === 1 && "🥈 "}
                              {i === 2 && "🥉 "}
                              {zone.department}
                            </td>
                            <td className="text-right py-2 px-3">{zone.listings}</td>
                            <td className="text-right py-2 px-3">{zone.views.toLocaleString()}</td>
                            <td className="text-right py-2 px-3">{zone.clicks.toLocaleString()}</td>
                            <td className="text-right py-2 px-3">{zone.ctr}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Recommandations */}
                  {stats.performanceByZone.recommendations.length > 0 && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-semibold text-purple-700 mb-2">💡 Recommandations géographiques</h4>
                      <ul className="space-y-1">
                        {stats.performanceByZone.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-purple-600 flex items-start gap-2">
                            <span>•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune donnée géographique disponible
                </div>
              )}
            </CardContent>
          </Card>

          {/* ✅ STATS PREMIUM : Coût par Contact */}
          <Card className={`${stats.costPerContactAnalysisLocked ? "opacity-75" : ""} border-2 ${!stats.costPerContactAnalysisLocked ? "border-purple-200" : ""}`}>
            <CardHeader className={!stats.costPerContactAnalysisLocked ? "bg-gradient-to-r from-purple-50 to-pink-50" : ""}>
              <CardTitle className="flex items-center gap-2">
                <MousePointerClick className="w-5 h-5 text-purple-600" />
                Coût par Contact
                {stats.costPerContactAnalysisLocked ? (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">PREMIUM</span>
                )}
              </CardTitle>
              <CardDescription>
                {stats.costPerContactAnalysisLocked 
                  ? "Passez au pack Premium pour l'analyse du coût par contact"
                  : "Analysez le ROI de vos investissements publicitaires"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.costPerContactAnalysisLocked ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    L'analyse du coût par contact est réservée au pack Premium
                  </p>
                  <Button asChild className="bg-purple-600 hover:bg-purple-700">
                    <Link href="/agency/subscription">Passer au pack Premium</Link>
                  </Button>
                </div>
              ) : stats.costPerContactAnalysis ? (
                <div className="space-y-6">
                  {/* KPIs principaux */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg text-center">
                      <div className="text-3xl font-bold text-purple-700">{stats.costPerContactAnalysis.costPerContact.toFixed(2)}€</div>
                      <div className="text-sm text-purple-600">Coût/contact</div>
                      <div className={`text-xs mt-1 ${stats.costPerContactAnalysis.comparison >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {stats.costPerContactAnalysis.comparison >= 0 ? '+' : ''}{stats.costPerContactAnalysis.comparison}% vs industrie
                      </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-3xl font-bold">{stats.costPerContactAnalysis.totalContacts}</div>
                      <div className="text-sm text-muted-foreground">Contacts totaux</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-3xl font-bold">{stats.costPerContactAnalysis.totalSpent.toFixed(0)}€</div>
                      <div className="text-sm text-muted-foreground">Investi</div>
                    </div>
                    <div className="p-4 bg-emerald-100 rounded-lg text-center">
                      <div className="text-3xl font-bold text-emerald-700">{stats.costPerContactAnalysis.roi}x</div>
                      <div className="text-sm text-emerald-600">ROI</div>
                    </div>
                  </div>

                  {/* Valeur estimée */}
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-emerald-600 mb-1">💰 Valeur estimée générée</div>
                        <div className="text-2xl font-bold text-emerald-700">
                          {stats.costPerContactAnalysis.estimatedTotalValue.toLocaleString()}€
                        </div>
                        <div className="text-xs text-emerald-600">
                          Basé sur {stats.costPerContactAnalysis.estimatedContactValue}€/contact (valeur moyenne immobilier)
                        </div>
                      </div>
                      <div className="text-5xl">📈</div>
                    </div>
                  </div>

                  {/* Benchmark industrie */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3">Comparaison avec l'industrie</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Votre coût/contact</span>
                        <span className="font-bold">{stats.costPerContactAnalysis.costPerContact.toFixed(2)}€</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${stats.costPerContactAnalysis.costPerContact < stats.costPerContactAnalysis.industryAverage ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(100, (stats.costPerContactAnalysis.costPerContact / stats.costPerContactAnalysis.industryAverage) * 50)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Moyenne industrie</span>
                        <span>{stats.costPerContactAnalysis.industryAverage.toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Pas assez de données (générez des contacts pour voir cette analyse)
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

