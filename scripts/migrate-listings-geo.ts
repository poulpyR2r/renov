/**
 * Migration script pour ajouter location.geo (GeoJSON Point) aux listings existants
 * Remplit location.geo depuis location.coordinates (si présent)
 * 
 * Usage: npx tsx scripts/migrate-listings-geo.ts
 */

import { dbConnect } from "../lib/mongodb";
import { ObjectId } from "mongodb";

interface Listing {
  _id: ObjectId;
  location?: {
    coordinates?: {
      lat: number;
      lng: number;
    };
    geo?: {
      type: "Point";
      coordinates: [number, number];
    };
  };
}

async function migrateListingsGeo() {
  try {
    console.log("🔌 Connexion à MongoDB...");
    const db = await dbConnect();
    const collection = db.collection<Listing>("listings");

    console.log("📊 Recherche des listings à migrer...");
    
    // Trouver tous les listings qui ont location.coordinates mais pas location.geo
    const listingsToMigrate = await collection
      .find({
        "location.coordinates.lat": { $exists: true, $ne: null },
        "location.coordinates.lng": { $exists: true, $ne: null },
        $or: [
          { "location.geo": { $exists: false } },
          { "location.geo": null },
        ],
      })
      .toArray();

    console.log(`✅ Trouvé ${listingsToMigrate.length} listings à migrer`);

    if (listingsToMigrate.length === 0) {
      console.log("✨ Aucune migration nécessaire, tous les listings sont à jour");
      return;
    }

    let migrated = 0;
    let errors = 0;

    for (const listing of listingsToMigrate) {
      try {
        const lat = listing.location?.coordinates?.lat;
        const lng = listing.location?.coordinates?.lng;

        if (
          typeof lat === "number" &&
          typeof lng === "number" &&
          !isNaN(lat) &&
          !isNaN(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180
        ) {
          // GeoJSON Point: [lng, lat] (ordre important!)
          const geo = {
            type: "Point" as const,
            coordinates: [lng, lat] as [number, number],
          };

          await collection.updateOne(
            { _id: listing._id },
            {
              $set: {
                "location.geo": geo,
                updatedAt: new Date(),
              },
            }
          );

          migrated++;
          if (migrated % 100 === 0) {
            console.log(`⏳ Migré ${migrated}/${listingsToMigrate.length} listings...`);
          }
        } else {
          console.warn(
            `⚠️  Coordonnées invalides pour le listing ${listing._id}: lat=${lat}, lng=${lng}`
          );
          errors++;
        }
      } catch (error) {
        console.error(
          `❌ Erreur lors de la migration du listing ${listing._id}:`,
          error
        );
        errors++;
      }
    }

    console.log(`\n✨ Migration terminée:`);
    console.log(`   ✅ ${migrated} listings migrés avec succès`);
    if (errors > 0) {
      console.log(`   ❌ ${errors} erreurs`);
    }

    // Créer l'index 2dsphere si nécessaire
    console.log("\n🔍 Vérification de l'index 2dsphere...");
    const indexes = await collection.indexes();
    const hasGeoIndex = indexes.some(
      (idx) =>
        idx.key &&
        "location.geo" in idx.key &&
        (idx.key as any)["location.geo"] === "2dsphere"
    );

    if (!hasGeoIndex) {
      console.log("📇 Création de l'index 2dsphere sur location.geo...");
      await collection.createIndex(
        { "location.geo": "2dsphere" },
        { sparse: true }
      );
      console.log("✅ Index 2dsphere créé avec succès");
    } else {
      console.log("✅ Index 2dsphere existe déjà");
    }

    console.log("\n🎉 Migration terminée avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    process.exit(1);
  }
}

// Exécuter la migration
migrateListingsGeo()
  .then(() => {
    console.log("\n✅ Script terminé");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });

