"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  Globe,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface FetchJob {
  _id: string;
  sourceId: string;
  sourceName: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  itemsFound?: number;
  itemsAdded?: number;
  error?: string;
  createdAt: string;
}

interface Source {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  lastFetch?: string;
  totalListings?: number;
}

export default function AdminFetchPage() {
  const [jobs, setJobs] = useState<FetchJob[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runningFetches, setRunningFetches] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [jobsRes, sourcesRes] = await Promise.all([
        fetch("/api/admin/fetch/jobs"),
        fetch("/api/admin/fetch/sources"),
      ]);

      const jobsData = await jobsRes.json();
      const sourcesData = await sourcesRes.json();

      if (jobsData.success) setJobs(jobsData.jobs);
      if (sourcesData.success) setSources(sourcesData.sources);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement");
    }
    setIsLoading(false);
  };

  const handleRunFetch = async (sourceId: string) => {
    setRunningFetches((prev) => new Set([...prev, sourceId]));

    try {
      const res = await fetch("/api/admin/fetch/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Fetch lancé pour ${sourceId}`);
        // Refresh after a short delay
        setTimeout(fetchData, 2000);
      } else {
        toast.error(data.error || "Erreur lors du lancement");
      }
    } catch (error) {
      toast.error("Erreur lors du lancement");
    }

    setRunningFetches((prev) => {
      const next = new Set(prev);
      next.delete(sourceId);
      return next;
    });
  };

  const handleRunAllFetches = async () => {
    setRunningFetches(new Set(sources.map((s) => s.id)));

    try {
      const res = await fetch("/api/admin/fetch/run-all", {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Tous les fetches ont été lancés");
        setTimeout(fetchData, 2000);
      } else {
        toast.error(data.error || "Erreur lors du lancement");
      }
    } catch (error) {
      toast.error("Erreur lors du lancement");
    }

    setRunningFetches(new Set());
  };

  const getStatusIcon = (status: FetchJob["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: FetchJob["status"]) => {
    switch (status) {
      case "completed":
        return "Terminé";
      case "failed":
        return "Échoué";
      case "running":
        return "En cours";
      default:
        return "En attente";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fetch / Scraping</h2>
          <p className="text-muted-foreground">
            Gérez les sources de données et lancez des fetches
          </p>
        </div>
        <Button onClick={handleRunAllFetches} disabled={runningFetches.size > 0}>
          {runningFetches.size > 0 ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Lancer tous les fetches
        </Button>
      </div>

      {/* Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((source) => (
          <Card key={source.id} className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{source.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Globe className="w-3.5 h-3.5" />
                    {source.id}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    source.enabled
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {source.enabled ? "Actif" : "Inactif"}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" />
                    Annonces
                  </span>
                  <span className="font-medium">
                    {source.totalListings?.toLocaleString("fr-FR") || 0}
                  </span>
                </div>
                {source.lastFetch && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Dernier fetch
                    </span>
                    <span className="font-medium">
                      {new Date(source.lastFetch).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>

              <Button
                className="w-full mt-4"
                variant="outline"
                onClick={() => handleRunFetch(source.id)}
                disabled={runningFetches.has(source.id)}
              >
                {runningFetches.has(source.id) ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Lancer le fetch
              </Button>
            </CardContent>
          </Card>
        ))}

        {sources.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Database className="w-12 h-12 mx-auto mb-4" />
            <p>Aucune source configurée</p>
          </div>
        )}
      </div>

      {/* Recent Jobs */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Historique des fetches</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4" />
              <p>Aucun fetch effectué</p>
            </div>
          ) : (
            <div className="divide-y">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  className="p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <p className="font-medium">{job.sourceName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(job.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {job.status === "completed" && (
                      <div className="text-sm text-right">
                        <p className="text-muted-foreground">
                          {job.itemsFound} trouvées
                        </p>
                        <p className="text-emerald-600">
                          +{job.itemsAdded} ajoutées
                        </p>
                      </div>
                    )}
                    {job.status === "failed" && job.error && (
                      <p className="text-sm text-red-500 max-w-xs truncate">
                        {job.error}
                      </p>
                    )}
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        job.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : job.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : job.status === "running"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {getStatusLabel(job.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

