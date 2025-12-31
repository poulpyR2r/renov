import {
  IAlert,
  IAlertFilters,
  getActiveAlerts,
  markAlertSent,
} from "@/models/Alert";
import { getListingModel } from "@/models/Listing";
import { getUserById } from "@/models/User";
import { sendAlertEmail, ListingAlert } from "@/lib/email";
import { ObjectId } from "mongodb";

export interface MatchedListing {
  _id: ObjectId;
  title: string;
  price?: number;
  surface?: number;
  rooms?: number;
  propertyType?: string;
  location?: {
    city?: string;
    department?: string;
    region?: string;
    postalCode?: string;
  };
  images?: string[];
  renovationScore?: number;
  createdAt: Date;
}

/**
 * Build MongoDB query from alert filters
 * @param filters - The alert filters
 * @param includeStatusFilter - Whether to include status filter (default: false for compatibility)
 */
export function buildQueryFromFilters(
  filters: IAlertFilters,
  includeStatusFilter: boolean = false
): any {
  // Don't filter by status by default - many listings may not have this field
  const query: any = includeStatusFilter ? { status: "active" } : {};

  // Text search
  if (filters.query) {
    query.$or = [
      { title: { $regex: filters.query, $options: "i" } },
      { description: { $regex: filters.query, $options: "i" } },
    ];
  }

  // Property types
  if (filters.propertyTypes?.length) {
    query.propertyType = { $in: filters.propertyTypes };
  }

  // Price range
  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = filters.minPrice;
    if (filters.maxPrice) query.price.$lte = filters.maxPrice;
  }

  // Surface range
  if (filters.minSurface || filters.maxSurface) {
    query.surface = {};
    if (filters.minSurface) query.surface.$gte = filters.minSurface;
    if (filters.maxSurface) query.surface.$lte = filters.maxSurface;
  }

  // Rooms range
  if (filters.minRooms || filters.maxRooms) {
    query.rooms = {};
    if (filters.minRooms) query.rooms.$gte = filters.minRooms;
    if (filters.maxRooms) query.rooms.$lte = filters.maxRooms;
  }

  // Cities
  if (filters.cities?.length) {
    query["location.city"] = {
      $in: filters.cities.map((c) => new RegExp(`^${c}$`, "i")),
    };
  }

  // Postal codes
  if (filters.postalCodes?.length) {
    query["location.postalCode"] = { $in: filters.postalCodes };
  }

  // Departments
  if (filters.departments?.length) {
    query["location.department"] = {
      $regex: `^(${filters.departments.join("|")})`,
      $options: "i",
    };
  }

  // Regions
  if (filters.regions?.length) {
    query["location.region"] = {
      $in: filters.regions.map((r) => new RegExp(r, "i")),
    };
  }

  // Renovation score
  if (filters.minRenovationScore) {
    query.renovationScore = { $gte: filters.minRenovationScore };
  }

  // Keywords in title or description
  if (filters.keywords?.length) {
    const keywordRegex = filters.keywords.join("|");
    query.$or = [
      ...(query.$or || []),
      { title: { $regex: keywordRegex, $options: "i" } },
      { description: { $regex: keywordRegex, $options: "i" } },
    ];
  }

  return query;
}

/**
 * Find new listings matching an alert's filters
 * @param alert - The alert to match
 * @param limit - Maximum number of listings to return
 * @param options - Additional options
 */
export async function findMatchingListings(
  alert: IAlert,
  limit: number = 10,
  options: {
    excludeSentListings?: boolean;
    onlyNewListings?: boolean;
  } = {}
): Promise<MatchedListing[]> {
  const { excludeSentListings = true, onlyNewListings = true } = options;

  const Listing = await getListingModel();
  const query = buildQueryFromFilters(alert.filters);

  // Exclude already sent listings
  if (excludeSentListings && alert.lastListingIds.length > 0) {
    query._id = {
      $nin: alert.lastListingIds
        .map((id) => {
          try {
            return new ObjectId(id);
          } catch {
            return null;
          }
        })
        .filter(Boolean),
    };
  }

  // Get only listings created after alert creation (or last sent)
  // Only apply this filter if explicitly requested (for cron jobs)
  if (onlyNewListings && alert.lastSentAt) {
    query.createdAt = { $gte: alert.lastSentAt };
  }

  const listings = await Listing.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return listings as MatchedListing[];
}

/**
 * Preview matching listings for an alert (no date filter, for testing)
 */
export async function previewMatchingListings(
  filters: IAlertFilters,
  limit: number = 10
): Promise<{ listings: MatchedListing[]; totalCount: number }> {
  const Listing = await getListingModel();
  const query = buildQueryFromFilters(filters);

  const totalCount = await Listing.countDocuments(query);

  const listings = await Listing.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return { listings: listings as MatchedListing[], totalCount };
}

/**
 * Process a single alert - find matches and send email
 */
export async function processAlert(alert: IAlert): Promise<{
  sent: boolean;
  matchCount: number;
  error?: string;
}> {
  try {
    // Find matching listings
    const listings = await findMatchingListings(alert, 20);

    if (listings.length === 0) {
      return { sent: false, matchCount: 0 };
    }

    // Get user info
    const user = await getUserById(alert.userId.toString());
    if (!user) {
      return { sent: false, matchCount: 0, error: "User not found" };
    }

    // Check if email is enabled
    if (!alert.emailEnabled) {
      // Just mark as sent without sending email
      await markAlertSent(
        alert._id!.toString(),
        listings.map((l) => l._id.toString()),
        listings.length
      );
      return { sent: false, matchCount: listings.length };
    }

    // Prepare email data
    const emailListings: ListingAlert[] = listings.slice(0, 5).map((l) => ({
      id: l._id.toString(),
      title: l.title,
      price: l.price || 0,
      city: l.location?.city || "Ville inconnue",
      surface: l.surface,
      imageUrl: l.images?.[0],
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/l/${
        l._id
      }`,
    }));

    // Send email
    const result = await sendAlertEmail(
      user.email,
      user.name || "Utilisateur",
      alert.name,
      emailListings
    );

    if (result.success) {
      // Mark alert as sent
      await markAlertSent(
        alert._id!.toString(),
        listings.map((l) => l._id.toString()),
        listings.length
      );
      return { sent: true, matchCount: listings.length };
    }

    return { sent: false, matchCount: listings.length, error: "Email failed" };
  } catch (error) {
    console.error("Error processing alert:", error);
    return { sent: false, matchCount: 0, error: String(error) };
  }
}

/**
 * Process all active alerts for a given frequency
 */
export async function processAlertsByFrequency(
  frequency: IAlert["frequency"]
): Promise<{
  processed: number;
  sent: number;
  totalMatches: number;
}> {
  const alerts = await getActiveAlerts(frequency);
  let processed = 0;
  let sent = 0;
  let totalMatches = 0;

  for (const alert of alerts) {
    const result = await processAlert(alert);
    processed++;
    if (result.sent) sent++;
    totalMatches += result.matchCount;

    // Small delay between emails to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { processed, sent, totalMatches };
}

/**
 * Process a specific user's instant alerts (called when new listing is added)
 */
export async function processInstantAlertsForListing(
  listingId: string
): Promise<void> {
  const alerts = await getActiveAlerts("instant");

  for (const alert of alerts) {
    const result = await processAlert(alert);
    if (result.matchCount > 0) {
      console.log(
        `[Alert] Sent instant alert "${alert.name}" with ${result.matchCount} matches`
      );
    }
  }
}
