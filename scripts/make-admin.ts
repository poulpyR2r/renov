/**
 * Script pour donner le rôle admin à un utilisateur
 * 
 * Usage: npx tsx scripts/make-admin.ts <email>
 * Exemple: npx tsx scripts/make-admin.ts contact@taylora.fr
 */

import { dbConnect } from "../lib/mongodb";

async function makeAdmin(email: string) {
  if (!email) {
    console.error("❌ Usage: npx tsx scripts/make-admin.ts <email>");
    process.exit(1);
  }

  try {
    const db = await dbConnect();
    
    const result = await db.collection("users").updateOne(
      { email: email.toLowerCase() },
      { $set: { role: "admin", updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      process.exit(1);
    }

    if (result.modifiedCount === 0) {
      console.log(`ℹ️ L'utilisateur ${email} est déjà admin`);
    } else {
      console.log(`✅ L'utilisateur ${email} est maintenant admin !`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
}

const email = process.argv[2];
makeAdmin(email);

