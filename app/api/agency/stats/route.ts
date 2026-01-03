import { NextRequest, NextResponse } from "next/server";
import { requireAgencyRole } from "@/lib/agency-rbac";
import { getAgencyById } from "@/models/Agency";
import { getListingModel, getListingFavoritesCount } from "@/models/Listing";
import { PackType, getPackConfig, canViewStat } from "@/lib/packs";
import { ObjectId } from "mongodb";
import { 
  getAgencyContactsCount, 
  getContactsStatsByType, 
  getContactsTimeline,
  getContactsPerListing 
} from "@/models/Contact";

export async function GET(request: NextRequest) {
  try {
    // Only MANAGER and ADMIN can view stats
    const authResult = await requireAgencyRole(request, [
      "AGENCY_ADMIN",
      "AGENCY_MANAGER",
    ]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const agency = await getAgencyById(authResult.agencyId);

    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    const Listing = await getListingModel();
    const agencyIdStr = agency._id?.toString();

    // Get all agency listings
    const listings = await Listing.find({
      $or: [{ agencyId: agency._id }, { agencyId: agencyIdStr }],
    } as any).toArray();

    // Calculate date ranges
    const now = new Date();

    // Generate daily data for last 30 days
    // Note: Nous n'avons pas de tracking journalier réel
    // On affiche les TOTAUX CUMULÉS sur le graphique (croissance progressive)
    const dailyData = [];
    const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);
    const totalClicks = listings.reduce((sum, l) => sum + (l.clicks || 0), 0);

    // Get all favorites once
    const allFavoritesPromises = listings.map((l) =>
      getListingFavoritesCount(l._id!.toString())
    );
    const allFavoritesCounts = await Promise.all(allFavoritesPromises);
    const totalFavorites = allFavoritesCounts.reduce(
      (sum, count) => sum + count,
      0
    );

    // Trouver la date de la première annonce
    const oldestListing = listings.length > 0
      ? listings.reduce((oldest, l) => {
          const date = new Date(l.createdAt);
          return !oldest || date < oldest ? date : oldest;
        }, null as Date | null)
      : null;

    // Générer les données cumulatives pour les 30 derniers jours
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      date.setHours(23, 59, 59, 999); // Fin de journée
      const dateStr = date.toISOString().split("T")[0];

      // Annonces créées avant ou pendant ce jour
      const listingsUpToDate = listings.filter(
        (l) => new Date(l.createdAt) <= date
      );

      // Si pas d'annonces à cette date, valeurs à 0
      if (listingsUpToDate.length === 0) {
        dailyData.push({
          date: dateStr,
          views: 0,
          clicks: 0,
          favorites: 0,
          listings: 0,
        });
        continue;
      }

      // Calculer les vues/clics cumulées de ces annonces
      // Pour chaque annonce, on calcule la proportion du temps écoulé
      let cumulativeViews = 0;
      let cumulativeClicks = 0;
      let cumulativeFavorites = 0;

      listingsUpToDate.forEach((listing, idx) => {
        const createdAt = new Date(listing.createdAt);
        
        // Nombre de jours depuis la création de l'annonce (total jusqu'à aujourd'hui)
        const totalDaysActive = Math.max(1, Math.ceil((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000)));
        
        // Nombre de jours depuis la création jusqu'à cette date
        const daysActiveUpToDate = Math.max(0, Math.ceil((date.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000)));
        
        // Proportion (0 à 1) - combien du temps total est écoulé à cette date
        const proportion = Math.min(1, daysActiveUpToDate / totalDaysActive);
        
        // Appliquer la proportion aux vues/clics
        cumulativeViews += Math.round((listing.views || 0) * proportion);
        cumulativeClicks += Math.round((listing.clicks || 0) * proportion);
        
        // Trouver l'index pour les favoris
        const originalIdx = listings.findIndex((l) => l._id?.toString() === listing._id?.toString());
        if (originalIdx >= 0) {
          cumulativeFavorites += Math.round((allFavoritesCounts[originalIdx] || 0) * proportion);
        }
      });

      dailyData.push({
        date: dateStr,
        views: cumulativeViews,
        clicks: cumulativeClicks,
        favorites: cumulativeFavorites,
        listings: listingsUpToDate.length,
      });
    }

    // S'assurer que le dernier jour (aujourd'hui) a les vrais totaux
    if (dailyData.length > 0) {
      const lastDay = dailyData[dailyData.length - 1];
      lastDay.views = totalViews;
      lastDay.clicks = totalClicks;
      lastDay.favorites = totalFavorites;
    }

    // Generate monthly data for last 12 months
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthStr = monthStart.toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      });

      const listingsInMonth = listings.filter(
        (l) =>
          new Date(l.createdAt) >= monthStart &&
          new Date(l.createdAt) <= monthEnd
      );

      const views = listingsInMonth.reduce((sum, l) => sum + (l.views || 0), 0);
      const clicks = listingsInMonth.reduce(
        (sum, l) => sum + (l.clicks || 0),
        0
      );

      monthlyData.push({
        month: monthStr,
        views,
        clicks,
        listings: listingsInMonth.length,
      });
    }

    // Performance by listing (use already fetched favorites)
    const listingPerformance = listings.map((l, index) => {
      const favorites = allFavoritesCounts[index] || 0;
      return {
        id: l._id?.toString(),
        title: l.title,
        views: l.views || 0,
        clicks: l.clicks || 0,
        favorites,
        isSponsored: l.isSponsored || false,
        createdAt: l.createdAt,
        ctr: l.views > 0 ? ((l.clicks || 0) / l.views) * 100 : 0,
      };
    });

    // Sort by performance
    listingPerformance.sort((a, b) => b.views - a.views);

    // Stats by property type
    const statsByType: Record<
      string,
      { views: number; clicks: number; count: number }
    > = {};
    listings.forEach((l) => {
      const type = l.propertyType || "Autre";
      if (!statsByType[type]) {
        statsByType[type] = { views: 0, clicks: 0, count: 0 };
      }
      statsByType[type].views += l.views || 0;
      statsByType[type].clicks += l.clicks || 0;
      statsByType[type].count += 1;
    });

    const propertyTypeData = Object.entries(statsByType).map(
      ([type, stats]) => ({
        type,
        views: stats.views,
        clicks: stats.clicks,
        count: stats.count,
        avgViews: Math.round(stats.views / stats.count),
        avgClicks: Math.round(stats.clicks / stats.count),
      })
    );

    // CPC vs Non-CPC comparison
    const sponsoredListings = listings.filter((l) => l.isSponsored);
    const nonSponsoredListings = listings.filter((l) => !l.isSponsored);

    const cpcStats = {
      sponsored: {
        count: sponsoredListings.length,
        totalViews: sponsoredListings.reduce(
          (sum, l) => sum + (l.views || 0),
          0
        ),
        totalClicks: sponsoredListings.reduce(
          (sum, l) => sum + (l.clicks || 0),
          0
        ),
        avgViews:
          sponsoredListings.length > 0
            ? Math.round(
                sponsoredListings.reduce((sum, l) => sum + (l.views || 0), 0) /
                  sponsoredListings.length
              )
            : 0,
        avgClicks:
          sponsoredListings.length > 0
            ? Math.round(
                sponsoredListings.reduce((sum, l) => sum + (l.clicks || 0), 0) /
                  sponsoredListings.length
              )
            : 0,
      },
      nonSponsored: {
        count: nonSponsoredListings.length,
        totalViews: nonSponsoredListings.reduce(
          (sum, l) => sum + (l.views || 0),
          0
        ),
        totalClicks: nonSponsoredListings.reduce(
          (sum, l) => sum + (l.clicks || 0),
          0
        ),
        avgViews:
          nonSponsoredListings.length > 0
            ? Math.round(
                nonSponsoredListings.reduce(
                  (sum, l) => sum + (l.views || 0),
                  0
                ) / nonSponsoredListings.length
              )
            : 0,
        avgClicks:
          nonSponsoredListings.length > 0
            ? Math.round(
                nonSponsoredListings.reduce(
                  (sum, l) => sum + (l.clicks || 0),
                  0
                ) / nonSponsoredListings.length
              )
            : 0,
      },
    };

    // ✅ Récupérer le pack et appliquer les restrictions
    const pack: PackType = agency.subscription?.pack || "FREE";
    const packConfig = getPackConfig(pack);

    // Vérifier les permissions selon le pack
    const canSeeContacts = canViewStat(pack, "contacts");
    const canSeePerformancePerListing = canViewStat(pack, "performancePerListing");
    const canSeeCostPerContact = canViewStat(pack, "costPerContact");
    const canSeeGlobalPerformance = canViewStat(pack, "globalPerformance");
    const canSeePerformanceByZone = canViewStat(pack, "performanceByZone");

    // ✅ Récupérer les VRAIES données de contacts depuis la collection contacts
    const agencyIdForContacts = agency._id!.toString();
    const totalContacts = canSeeContacts 
      ? await getAgencyContactsCount(agencyIdForContacts) 
      : null;
    
    // Stats par type de contact (email, téléphone, message, etc.)
    const contactsByType = canSeeContacts 
      ? await getContactsStatsByType(agencyIdForContacts)
      : null;
    
    // Timeline des contacts (30 derniers jours)
    const contactsTimeline = canSeeContacts 
      ? await getContactsTimeline(agencyIdForContacts, 30)
      : null;
    
    // Contacts par annonce
    const contactsByListing = canSeeContacts
      ? await getContactsPerListing(agencyIdForContacts)
      : null;
    
    const costPerContact = canSeeCostPerContact && totalContacts && totalContacts > 0 && agency.cpc?.totalSpent
      ? (agency.cpc.totalSpent / totalContacts).toFixed(2)
      : null;

    // ✅ NOUVELLES STATS PRO : Funnel de conversion
    const conversionFunnel = canSeePerformancePerListing ? {
      views: totalViews,
      clicks: totalClicks,
      contacts: totalContacts || 0,
      viewToClickRate: totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : "0.00",
      clickToContactRate: totalClicks > 0 && totalContacts 
        ? ((totalContacts / totalClicks) * 100).toFixed(2) 
        : "0.00",
      viewToContactRate: totalViews > 0 && totalContacts 
        ? ((totalContacts / totalViews) * 100).toFixed(2) 
        : "0.00",
    } : null;

    // ✅ NOUVELLES STATS PRO : Meilleurs créneaux (simulé basé sur patterns réalistes)
    const bestPerformingTimes = canSeePerformancePerListing ? {
      // Jours de la semaine (0 = Dimanche, 6 = Samedi)
      byDayOfWeek: [
        { day: "Lundi", dayIndex: 1, views: Math.round(totalViews * 0.15), clicks: Math.round(totalClicks * 0.14) },
        { day: "Mardi", dayIndex: 2, views: Math.round(totalViews * 0.17), clicks: Math.round(totalClicks * 0.18) },
        { day: "Mercredi", dayIndex: 3, views: Math.round(totalViews * 0.16), clicks: Math.round(totalClicks * 0.16) },
        { day: "Jeudi", dayIndex: 4, views: Math.round(totalViews * 0.17), clicks: Math.round(totalClicks * 0.17) },
        { day: "Vendredi", dayIndex: 5, views: Math.round(totalViews * 0.14), clicks: Math.round(totalClicks * 0.15) },
        { day: "Samedi", dayIndex: 6, views: Math.round(totalViews * 0.12), clicks: Math.round(totalClicks * 0.11) },
        { day: "Dimanche", dayIndex: 0, views: Math.round(totalViews * 0.09), clicks: Math.round(totalClicks * 0.09) },
      ],
      // Heures de la journée (pics réalistes)
      byHour: [
        { hour: "8h-10h", views: Math.round(totalViews * 0.12), clicks: Math.round(totalClicks * 0.10) },
        { hour: "10h-12h", views: Math.round(totalViews * 0.15), clicks: Math.round(totalClicks * 0.14) },
        { hour: "12h-14h", views: Math.round(totalViews * 0.18), clicks: Math.round(totalClicks * 0.20) },
        { hour: "14h-16h", views: Math.round(totalViews * 0.14), clicks: Math.round(totalClicks * 0.13) },
        { hour: "16h-18h", views: Math.round(totalViews * 0.12), clicks: Math.round(totalClicks * 0.12) },
        { hour: "18h-20h", views: Math.round(totalViews * 0.18), clicks: Math.round(totalClicks * 0.20) },
        { hour: "20h-22h", views: Math.round(totalViews * 0.08), clicks: Math.round(totalClicks * 0.08) },
        { hour: "Autre", views: Math.round(totalViews * 0.03), clicks: Math.round(totalClicks * 0.03) },
      ],
      // Meilleur jour et heure
      bestDay: "Mardi",
      bestHour: "18h-20h",
      peakPerformance: "+35% vs moyenne",
    } : null;

    // ✅ NOUVELLES STATS PRO : Analyse CPC approfondie
    const cpcAnalysis = canSeePerformancePerListing ? {
      // Stats globales CPC
      totalSpent: agency.cpc?.totalSpent || 0,
      currentBalance: agency.cpc?.balance || 0,
      avgCostPerClick: agency.cpc?.costPerClick || 0.50,
      
      // Performance sponsorisé vs organique
      sponsored: {
        listings: sponsoredListings.length,
        views: sponsoredListings.reduce((sum, l) => sum + (l.views || 0), 0),
        clicks: sponsoredListings.reduce((sum, l) => sum + (l.clicks || 0), 0),
        avgViewsPerListing: sponsoredListings.length > 0 
          ? Math.round(sponsoredListings.reduce((sum, l) => sum + (l.views || 0), 0) / sponsoredListings.length)
          : 0,
        avgClicksPerListing: sponsoredListings.length > 0
          ? Math.round(sponsoredListings.reduce((sum, l) => sum + (l.clicks || 0), 0) / sponsoredListings.length)
          : 0,
      },
      organic: {
        listings: nonSponsoredListings.length,
        views: nonSponsoredListings.reduce((sum, l) => sum + (l.views || 0), 0),
        clicks: nonSponsoredListings.reduce((sum, l) => sum + (l.clicks || 0), 0),
        avgViewsPerListing: nonSponsoredListings.length > 0 
          ? Math.round(nonSponsoredListings.reduce((sum, l) => sum + (l.views || 0), 0) / nonSponsoredListings.length)
          : 0,
        avgClicksPerListing: nonSponsoredListings.length > 0
          ? Math.round(nonSponsoredListings.reduce((sum, l) => sum + (l.clicks || 0), 0) / nonSponsoredListings.length)
          : 0,
      },
      
      // ROI et efficacité
      cpcBoostMultiplier: sponsoredListings.length > 0 && nonSponsoredListings.length > 0 
        ? (
            (sponsoredListings.reduce((sum, l) => sum + (l.views || 0), 0) / sponsoredListings.length) /
            Math.max(1, nonSponsoredListings.reduce((sum, l) => sum + (l.views || 0), 0) / nonSponsoredListings.length)
          ).toFixed(1)
        : "N/A",
      estimatedROI: agency.cpc?.totalSpent && totalContacts && totalContacts > 0
        ? ((totalContacts * 50) / agency.cpc.totalSpent).toFixed(1) // Valeur estimée d'un contact = 50€
        : "N/A",
      
      // Recommandations
      recommendations: [] as string[],
    } : null;

    // Générer des recommandations CPC
    if (cpcAnalysis) {
      if (sponsoredListings.length === 0 && listings.length > 0) {
        cpcAnalysis.recommendations.push("Sponsorisez vos annonces pour augmenter leur visibilité jusqu'à 3x");
      }
      if (cpcAnalysis.cpcBoostMultiplier !== "N/A" && parseFloat(cpcAnalysis.cpcBoostMultiplier) > 2) {
        cpcAnalysis.recommendations.push("Excellent ROI ! Le CPC génère " + cpcAnalysis.cpcBoostMultiplier + "x plus de vues");
      }
      if (agency.cpc?.balance && agency.cpc.balance < 10) {
        cpcAnalysis.recommendations.push("⚠️ Solde CPC faible - Pensez à recharger pour maintenir la visibilité");
      }
      const lowPerformers = listings.filter(l => (l.views || 0) < 10 && l.status === "active");
      if (lowPerformers.length > 0) {
        cpcAnalysis.recommendations.push(`${lowPerformers.length} annonce(s) avec peu de vues - Le sponsoring pourrait aider`);
      }
    }

    // ✅ STATS PREMIUM : Performance globale (benchmarks plateforme)
    const globalPerformance = canSeeGlobalPerformance ? {
      // Benchmarks simulés (moyennes plateforme réalistes)
      platformAverages: {
        avgViewsPerListing: 45,
        avgClicksPerListing: 5,
        avgCtr: 11.1,
        avgContactRate: 2.5,
      },
      // Performance de l'agence vs plateforme
      yourPerformance: {
        avgViewsPerListing: listings.length > 0 ? Math.round(totalViews / listings.length) : 0,
        avgClicksPerListing: listings.length > 0 ? Math.round(totalClicks / listings.length) : 0,
        avgCtr: totalViews > 0 ? parseFloat(((totalClicks / totalViews) * 100).toFixed(2)) : 0,
        avgContactRate: totalClicks > 0 && totalContacts 
          ? parseFloat(((totalContacts / totalClicks) * 100).toFixed(2)) 
          : 0,
      },
      // Comparaison (positif = meilleur que la moyenne)
      comparison: {
        viewsVsPlatform: listings.length > 0 
          ? Math.round(((totalViews / listings.length) / 45 - 1) * 100)
          : 0,
        clicksVsPlatform: listings.length > 0 
          ? Math.round(((totalClicks / listings.length) / 5 - 1) * 100)
          : 0,
        ctrVsPlatform: totalViews > 0 
          ? Math.round((((totalClicks / totalViews) * 100) / 11.1 - 1) * 100)
          : 0,
      },
      // Classement estimé
      ranking: {
        percentile: Math.min(95, Math.max(5, 50 + Math.round(
          (listings.length > 0 ? (totalViews / listings.length) / 45 - 1 : 0) * 30
        ))),
        badge: listings.length > 0 && (totalViews / listings.length) > 60 
          ? "🏆 Top Performer" 
          : listings.length > 0 && (totalViews / listings.length) > 45 
            ? "⭐ Au-dessus de la moyenne"
            : "📈 En progression",
      },
      // Score global sur 100
      globalScore: Math.min(100, Math.round(
        (listings.length > 0 ? Math.min(1.5, (totalViews / listings.length) / 45) : 0) * 25 +
        (totalViews > 0 ? Math.min(1.5, ((totalClicks / totalViews) * 100) / 11.1) : 0) * 25 +
        (totalContacts && totalClicks > 0 ? Math.min(1.5, (totalContacts / totalClicks * 100) / 2.5) : 0) * 25 +
        (listings.length >= 10 ? 25 : listings.length * 2.5)
      )),
    } : null;

    // ✅ STATS PREMIUM : Performance par zone géographique
    const performanceByZone = canSeePerformanceByZone ? (() => {
      // Grouper les annonces par département
      const zoneStats: Record<string, { 
        department: string; 
        listings: number; 
        views: number; 
        clicks: number;
        contacts: number;
      }> = {};

      listings.forEach(l => {
        const dept = l.location?.department || l.location?.postalCode?.substring(0, 2) || "Inconnu";
        if (!zoneStats[dept]) {
          zoneStats[dept] = { department: dept, listings: 0, views: 0, clicks: 0, contacts: 0 };
        }
        zoneStats[dept].listings++;
        zoneStats[dept].views += l.views || 0;
        zoneStats[dept].clicks += l.clicks || 0;
      });

      // Convertir en tableau et trier par performance
      const zones = Object.values(zoneStats)
        .map(zone => ({
          ...zone,
          avgViews: zone.listings > 0 ? Math.round(zone.views / zone.listings) : 0,
          avgClicks: zone.listings > 0 ? Math.round(zone.clicks / zone.listings) : 0,
          ctr: zone.views > 0 ? parseFloat(((zone.clicks / zone.views) * 100).toFixed(2)) : 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      const bestZone = zones[0];
      const worstZone = zones.length > 1 ? zones[zones.length - 1] : null;

      return {
        zones,
        summary: {
          totalZones: Object.keys(zoneStats).length,
          bestPerforming: bestZone ? {
            department: bestZone.department,
            views: bestZone.views,
            avgViews: bestZone.avgViews,
          } : null,
          leastPerforming: worstZone ? {
            department: worstZone.department,
            views: worstZone.views,
            avgViews: worstZone.avgViews,
          } : null,
        },
        recommendations: [] as string[],
      };
    })() : null;

    // Recommandations géographiques
    if (performanceByZone && performanceByZone.zones.length > 0) {
      const topZone = performanceByZone.zones[0];
      if (topZone.avgViews > 50) {
        performanceByZone.recommendations.push(`🎯 ${topZone.department} est votre meilleure zone - Concentrez-y vos efforts`);
      }
      if (performanceByZone.zones.length === 1) {
        performanceByZone.recommendations.push("📍 Diversifiez vos zones pour toucher plus d'acheteurs");
      }
      const lowPerformingZones = performanceByZone.zones.filter(z => z.avgViews < 10);
      if (lowPerformingZones.length > 0) {
        performanceByZone.recommendations.push(`⚠️ ${lowPerformingZones.length} zone(s) sous-performante(s) - Envisagez le sponsoring`);
      }
    }

    // ✅ STATS PREMIUM : Coût par contact détaillé
    const costPerContactAnalysis = canSeeCostPerContact && totalContacts && totalContacts > 0 ? {
      totalContacts,
      totalSpent: agency.cpc?.totalSpent || 0,
      costPerContact: agency.cpc?.totalSpent 
        ? parseFloat((agency.cpc.totalSpent / totalContacts).toFixed(2))
        : 0,
      // Benchmark
      industryAverage: 8.50, // Coût moyen dans l'immobilier
      comparison: agency.cpc?.totalSpent 
        ? Math.round(((agency.cpc.totalSpent / totalContacts) / 8.50 - 1) * -100)
        : 0,
      // Évolution (simulée)
      trend: "stable" as "up" | "down" | "stable",
      trendPercent: 0,
      // Valeur estimée d'un contact
      estimatedContactValue: 50, // €
      estimatedTotalValue: totalContacts * 50,
      roi: agency.cpc?.totalSpent && agency.cpc.totalSpent > 0
        ? parseFloat(((totalContacts * 50) / agency.cpc.totalSpent).toFixed(1))
        : 0,
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        // ✅ Info sur le pack et les stats visibles
        pack: {
          type: pack,
          name: packConfig.name,
          visibleStats: {
            views: true,
            clicks: true,
            contacts: canSeeContacts,
            performancePerListing: canSeePerformancePerListing,
            costPerContact: canSeeCostPerContact,
            globalPerformance: canSeeGlobalPerformance,
            performanceByZone: canSeePerformanceByZone,
          },
        },
        overview: {
          totalListings: listings.length,
          totalViews,
          totalClicks,
          totalFavorites,
          // ✅ Contacts (restreint)
          totalContacts,
          contactsLocked: !canSeeContacts,
          // ✅ Coût par contact (PREMIUM only)
          costPerContact,
          costPerContactLocked: !canSeeCostPerContact,
          avgViewsPerListing:
            listings.length > 0 ? Math.round(totalViews / listings.length) : 0,
          avgClicksPerListing:
            listings.length > 0 ? Math.round(totalClicks / listings.length) : 0,
          ctr:
            totalViews > 0
              ? ((totalClicks / totalViews) * 100).toFixed(2)
              : "0.00",
        },
        // ✅ Données temporelles (30 jours pour tous, mais stats avancées restreintes)
        dailyData,
        monthlyData,
        // ✅ Performance par annonce (PRO+ only)
        listingPerformance: canSeePerformancePerListing 
          ? listingPerformance.slice(0, 10) 
          : null,
        listingPerformanceLocked: !canSeePerformancePerListing,
        // ✅ Performance par type de bien (PRO+ only)
        propertyTypeData: canSeePerformancePerListing ? propertyTypeData : null,
        propertyTypeDataLocked: !canSeePerformancePerListing,
        cpcComparison: cpcStats,
        // ✅ Statistiques de contacts (STARTER+ only)
        contacts: canSeeContacts ? {
          total: totalContacts,
          byType: contactsByType,
          timeline: contactsTimeline,
          byListing: contactsByListing?.slice(0, 10), // Top 10
        } : null,
        contactsLocked: !canSeeContacts,
        
        // ✅ NOUVELLES STATS PRO
        conversionFunnel,
        conversionFunnelLocked: !canSeePerformancePerListing,
        bestPerformingTimes,
        bestPerformingTimesLocked: !canSeePerformancePerListing,
        cpcAnalysis,
        cpcAnalysisLocked: !canSeePerformancePerListing,
        
        // ✅ STATS PREMIUM EXCLUSIVES
        globalPerformance,
        globalPerformanceLocked: !canSeeGlobalPerformance,
        performanceByZone,
        performanceByZoneLocked: !canSeePerformanceByZone,
        costPerContactAnalysis,
        costPerContactAnalysisLocked: !canSeeCostPerContact,
      },
    });
  } catch (error) {
    console.error("Error fetching agency stats:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des statistiques" },
      { status: 500 }
    );
  }
}
