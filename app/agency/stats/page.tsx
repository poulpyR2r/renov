"use client";

import useSWR from "swr";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Eye, MousePointerClick, Heart, Loader2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StatsData {
  overview: {
    totalListings: number;
    totalViews: number;
    totalClicks: number;
    totalFavorites: number;
    avgViewsPerListing: number;
    avgClicksPerListing: number;
    ctr: string;
  };
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
  }>;
  propertyTypeData: Array<{
    type: string;
    views: number;
    clicks: number;
    count: number;
    avgViews: number;
    avgClicks: number;
  }>;
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

  // Format property type data
  const formattedPropertyData = stats.propertyTypeData.map((item) => ({
    type: item.type,
    Vues: item.views,
    Clics: item.clicks,
    "Nb annonces": item.count,
  }));

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Statistiques</h1>
        <p className="text-muted-foreground mt-1">
          Analysez les performances de vos annonces
        </p>
      </div>

      {/* Overview Cards */}
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

      {/* Daily Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution sur 30 jours</CardTitle>
          <CardDescription>
            Vues, clics et favoris au fil des jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={formattedDailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Vues"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Clics"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Favoris"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Performance */}
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

        <Card>
          <CardHeader>
            <CardTitle>Performance par type de bien</CardTitle>
            <CardDescription>
              Répartition des vues et clics par type
            </CardDescription>
          </CardHeader>
          <CardContent>
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

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 des annonces</CardTitle>
          <CardDescription>
            Vos annonces les plus performantes
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}

