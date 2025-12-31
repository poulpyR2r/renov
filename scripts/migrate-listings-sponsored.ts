/**
 * Script de migration pour ajouter isSponsored, views, clicks aux annonces existantes
 * Usage: npx tsx scripts/migrate-listings-sponsored.ts
 */

import { getListingModel } from "@/models/Listing";
import { dbConnect } from "@/lib/mongodb";

async function migrateListings() {
  try {
    console.log("Connexion à la base de données...");
    await dbConnect();

    const Listing = await getListingModel();

    console.log("Recherche des annonces sans isSponsored, views ou clicks...");
    
    // Trouver les annonces qui n'ont pas ces champs
    const listingsToUpdate = await Listing.find({
      $or: [
        { isSponsored: { $exists: false } },
        { views: { $exists: false } },
        { clicks: { $exists: false } },
      ],
    }).toArray();

    console.log(`Trouvé ${listingsToUpdate.length} annonces à mettre à jour`);

    if (listingsToUpdate.length === 0) {
      console.log("Aucune annonce à mettre à jour. Migration terminée.");
      return;
    }

    let updated = 0;
    let errors = 0;

    for (const listing of listingsToUpdate) {
      try {
        const update: any = {};
        
        if (listing.isSponsored === undefined || listing.isSponsored === null) {
          update.isSponsored = false;
        }
        
        if (listing.views === undefined || listing.views === null) {
          update.views = 0;
        }
        
        if (listing.clicks === undefined || listing.clicks === null) {
          update.clicks = 0;
        }

        if (Object.keys(update).length > 0) {
          await Listing.updateOne(
            { _id: listing._id },
            { $set: update }
          );
          updated++;
        }
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de l'annonce ${listing._id}:`, error);
        errors++;
      }
    }

    console.log(`\nMigration terminée:`);
    console.log(`- ${updated} annonces mises à jour`);
    console.log(`- ${errors} erreurs`);
    
    process.exit(0);
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
    process.exit(1);
  }
}

migrateListings();

