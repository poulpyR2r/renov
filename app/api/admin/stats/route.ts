import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getUserStats } from "@/models/User";
import { getListingModel } from "@/models/Listing";
import { getAlertModel } from "@/models/Alert";
import { getActiveSubscribers } from "@/models/Newsletter";
import { dbConnect } from "@/lib/mongodb";

export async function GET() {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    // Get user stats
    const userStats = await getUserStats();

    // Get listing stats
    const Listing = await getListingModel();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalListings, activeListings, listingsThisMonth] =
      await Promise.all([
        Listing.countDocuments({}),
        Listing.countDocuments({ status: "active" }),
        Listing.countDocuments({ createdAt: { $gte: startOfMonth } }),
      ]);

    // Get alert stats
    const Alert = await getAlertModel();
    const [totalAlerts, activeAlerts] = await Promise.all([
      Alert.countDocuments({}),
      Alert.countDocuments({ isActive: true, isPaused: false }),
    ]);

    // Get newsletter subscribers
    const newsletterSubscribers = await getActiveSubscribers();
    const usersWithNewsletter = newsletterSubscribers.length;

    return NextResponse.json({
      success: true,
      stats: {
        users: userStats,
        listings: {
          total: totalListings,
          active: activeListings,
          thisMonth: listingsThisMonth,
        },
        alerts: {
          total: totalAlerts,
          active: activeAlerts,
        },
        newsletters: {
          subscribers: usersWithNewsletter,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

