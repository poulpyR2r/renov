"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Home,
  Bell,
  Mail,
  TrendingUp,
  Calendar,
  Loader2,
} from "lucide-react";

interface Stats {
  users: {
    total: number;
    admins: number;
    thisMonth: number;
    thisWeek: number;
  };
  listings: {
    total: number;
    active: number;
    thisMonth: number;
  };
  alerts: {
    total: number;
    active: number;
  };
  newsletters: {
    subscribers: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Utilisateurs",
      value: stats?.users.total || 0,
      subtitle: `+${stats?.users.thisMonth || 0} ce mois`,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Annonces",
      value: stats?.listings.total || 0,
      subtitle: `${stats?.listings.active || 0} actives`,
      icon: Home,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Alertes",
      value: stats?.alerts.total || 0,
      subtitle: `${stats?.alerts.active || 0} actives`,
      icon: Bell,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Newsletter",
      value: stats?.newsletters.subscribers || 0,
      subtitle: "abonnés",
      icon: Mail,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">
                    {stat.value.toLocaleString("fr-FR")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.subtitle}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Les statistiques détaillées seront bientôt disponibles.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Dernières inscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {stats?.users.thisWeek || 0} nouveaux utilisateurs cette semaine
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
