/**
 * Script pour corriger le pack d'une agence après un achat Stripe
 * 
 * Usage: npx ts-node scripts/fix-agency-pack.ts <agencyId ou email> <pack>
 * Exemple: npx ts-node scripts/fix-agency-pack.ts guewencarre@gmail.com STARTER
 */

import { dbConnect } from "../lib/mongodb";
import { ObjectId } from "mongodb";

async function fixAgencyPack() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error("Usage: npx ts-node scripts/fix-agency-pack.ts <agencyId ou email> <pack>");
    console.error("Packs disponibles: FREE, STARTER, PRO, PREMIUM");
    process.exit(1);
  }
  
  const identifier = args[0];
  const pack = args[1].toUpperCase();
  
  if (!["FREE", "STARTER", "PRO", "PREMIUM"].includes(pack)) {
    console.error("Pack invalide. Choisissez parmi: FREE, STARTER, PRO, PREMIUM");
    process.exit(1);
  }
  
  try {
    const db = await dbConnect();
    const agencies = db.collection("agencies");
    
    // Chercher par ID ou par email
    let query: any;
    if (ObjectId.isValid(identifier)) {
      query = { _id: new ObjectId(identifier) };
    } else {
      query = { email: identifier };
    }
    
    const agency = await agencies.findOne(query);
    
    if (!agency) {
      console.error("Agence non trouvée avec:", identifier);
      process.exit(1);
    }
    
    console.log("Agence trouvée:", agency.companyName);
    console.log("Pack actuel:", agency.subscription?.pack || "FREE");
    console.log("Nouveau pack:", pack);
    
    // Mettre à jour le pack
    const result = await agencies.updateOne(
      { _id: agency._id },
      {
        $set: {
          "subscription.pack": pack,
          "subscription.startDate": new Date(),
          updatedAt: new Date(),
        },
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log("✅ Pack mis à jour avec succès!");
    } else {
      console.log("⚠️ Aucune modification effectuée");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Erreur:", error);
    process.exit(1);
  }
}

fixAgencyPack();
