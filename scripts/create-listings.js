// Script pour créer les annonces via l'API
const fs = require("fs");
const path = require("path");

// Configuration
const API_URL = process.env.API_URL || "http://localhost:3000";
const LISTINGS_FILE = path.join(__dirname, "../listings_100.json");
const SESSION_TOKEN =
  process.env.SESSION_TOKEN ||
  "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoia1pmc3V3eC11RzktMFdDSEY5N1NxNDNZQU5KYlVnNThLdXM5dTIxZ25RSXdiZlZpbnpvRTF0MU1TSXB2Yl8yT1BGRVFfa2lnb0txT3NrWEpobW51bmcifQ..fzdWbghEGFPZ7CYOmSNMfg.QR6nfRT1lhsWjUy_xpTQMIvR14iZOmLQ5K0yM5rFodfnMNXgEgj4tk7gwBPesIOl3EwV6GSahM3jZ8RDzV9vUhGxgPA0UNC-oecGCLiFYVrsABWhKGunQ83eQy0V83ckiR0g98Vilf4GcmOVYHDxvrKF_QYrvivzOU3m-vF_WuEjU1TeUdS7JOCux_0qYXeZAGmNhDplZcMOnwbmpFkwXEYodSrElU1kYEXsPUA8mhxnSyB3de0dNrUvdUWzVh3z0_aUUZAY7EUqsLmNRvdOp9SAbcaSbfJ2a_SkFZWEXNVnw-wnJOCxqNMbOX9ZY89gS4-aaIYJFuhoKyFCs5yErPWXmLg81UFJ8rryA0LuSmgjs0biYKc6GO6myEOAkgT_lCiX4WS2eY_Q0zlBxjCkcBVwgdKFfumI-lyxAhAwX04.LwGpoPTgWYbezcI4YYHK8zQAb1c6SARUF3C9T1S3kEU";

async function createListing(listing, index, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Créer les headers avec le cookie correctement formaté
      // NextAuth v5 utilise: authjs.session-token (pas next-auth.session-token)
      const headers = {
        "Content-Type": "application/json",
        Cookie: `authjs.session-token=${SESSION_TOKEN}`,
      };

      const response = await fetch(`${API_URL}/api/submit`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(listing),
        // Timeout de 30 secondes
        signal: AbortSignal.timeout(30000),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(
          `✅ [${index + 1}/100] Annonce créée: ${listing.title.substring(
            0,
            50
          )}...`
        );
        return { success: true, id: data.id };
      } else {
        // Si erreur d'authentification, arrêter immédiatement
        if (response.status === 401 && data.error?.includes("connecté")) {
          console.error(
            `\n❌ [${index + 1}/100] Erreur d'authentification: ${data.error}`
          );
          console.error(
            "💡 Votre token de session est probablement expiré ou invalide"
          );
          console.error(
            "💡 Obtenez un nouveau token: F12 > Application > Cookies > authjs.session-token"
          );
          // Arrêter le script si c'est une erreur d'auth
          if (index === 0) {
            process.exit(1);
          }
        }
        const errorMsg = data.error || "Erreur inconnue";
        console.error(
          `❌ [${index + 1}/100] Erreur (${response.status}): ${errorMsg}`
        );

        // Afficher plus de détails pour la première erreur
        if (index === 0) {
          console.error(`   Status: ${response.status}`);
          console.error(`   Response:`, JSON.stringify(data, null, 2));
          if (data.error?.includes("agence")) {
            console.error(
              `   💡 Vérifiez que l'agencyId "${listing.agencyId}" est correct`
            );
          }
        }

        return { success: false, error: errorMsg };
      }
    } catch (error) {
      if (attempt < retries) {
        const waitTime = attempt * 2000; // 2s, 4s, 6s
        console.warn(
          `⚠️  [${
            index + 1
          }/100] Tentative ${attempt}/${retries} échouée, nouvelle tentative dans ${
            waitTime / 1000
          }s...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      } else {
        console.error(
          `❌ [${index + 1}/100] Erreur réseau après ${retries} tentatives:`,
          error.message
        );
        return { success: false, error: error.message };
      }
    }
  }
}

async function checkServerConnection() {
  try {
    console.log(`🔍 Vérification de la connexion au serveur (${API_URL})...`);
    const response = await fetch(`${API_URL}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);

    // Si /api/health n'existe pas, on essaie juste de se connecter
    if (!response) {
      // Test simple de connexion
      const testResponse = await fetch(`${API_URL}`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);

      if (!testResponse) {
        throw new Error("Impossible de se connecter au serveur");
      }
    }

    console.log("✅ Serveur accessible");
    return true;
  } catch (error) {
    console.error(`❌ Impossible de se connecter au serveur: ${error.message}`);
    console.error(
      `💡 Vérifiez que votre serveur Next.js est démarré sur ${API_URL}`
    );
    console.error(`💡 Lancez: npm run dev`);
    return false;
  }
}

async function testAuthentication() {
  try {
    console.log("🔐 Test de l'authentification...");
    const response = await fetch(`${API_URL}/api/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `authjs.session-token=${SESSION_TOKEN}`,
      },
      body: JSON.stringify({
        title: "Test",
        description: "Test",
        price: 100000,
        location: { city: "Test" },
        propertyType: "house",
        surface: 50,
        rooms: 2,
        diagnostics: {
          dpe: { energyClass: "D", gesClass: "D" },
        },
        renovation: { level: 1 },
        acceptTerms: true,
        acceptDataProcessing: true,
        agencyCertification: { certified: true },
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();

    if (response.status === 401) {
      console.error("❌ Authentification échouée");
      console.error(`💡 Erreur: ${data.error}`);
      console.error(
        "💡 Votre token de session est probablement expiré ou invalide"
      );
      console.error("💡 Obtenez un nouveau token:");
      console.error("   1. Connectez-vous sur votre application");
      console.error("   2. F12 > Application > Cookies > authjs.session-token");
      console.error(
        "   3. Copiez la valeur et mettez-la dans le script (ligne 10)"
      );
      return false;
    }

    if (response.status === 403) {
      console.warn("⚠️  Authentification OK mais permissions insuffisantes");
      console.warn(`💡 ${data.error}`);
      console.warn("💡 Vérifiez que votre agence est vérifiée");
      return false;
    }

    console.log("✅ Authentification réussie\n");
    return true;
  } catch (error) {
    console.error(
      `❌ Erreur lors du test d'authentification: ${error.message}`
    );
    return false;
  }
}

async function main() {
  console.log("🚀 Démarrage de la création des annonces...\n");

  // Vérifier la connexion au serveur
  const serverOk = await checkServerConnection();
  if (!serverOk) {
    process.exit(1);
  }

  // Tester l'authentification avant de commencer
  const authOk = await testAuthentication();
  if (!authOk) {
    process.exit(1);
  }

  // Vérifier que le fichier existe
  if (!fs.existsSync(LISTINGS_FILE)) {
    console.error(`❌ Fichier non trouvé: ${LISTINGS_FILE}`);
    console.log("💡 Exécutez d'abord: node scripts/generate-listings.js");
    process.exit(1);
  }

  // Lire le fichier JSON
  const listings = JSON.parse(fs.readFileSync(LISTINGS_FILE, "utf8"));

  // Vérifier que le token est valide
  // Le token est valide s'il est défini et n'est pas vide
  if (!SESSION_TOKEN || SESSION_TOKEN.trim() === "") {
    console.error("❌ SESSION_TOKEN est vide ou non défini");
    console.log("💡 Option 1: Modifiez la ligne 10 du script avec votre token");
    console.log(
      "💡 Option 2: Utilisez: SESSION_TOKEN=your_token node scripts/create-listings.js"
    );
    console.log(
      "💡 Pour obtenir votre token: F12 > Application > Cookies > authjs.session-token"
    );
    process.exit(1);
  }

  console.log(
    `🔑 Token de session détecté (${SESSION_TOKEN.substring(0, 20)}...)\n`
  );

  // Vérifier qu'au moins une annonce a un agencyId valide (ObjectId MongoDB = 24 caractères hex)
  const agencyId = listings[0]?.agencyId;
  if (
    !agencyId ||
    agencyId === "YOUR_AGENCY_ID_HERE" ||
    !/^[0-9a-fA-F]{24}$/.test(agencyId)
  ) {
    console.error(
      '❌ Veuillez remplacer "YOUR_AGENCY_ID_HERE" par votre vrai ID d\'agence (24 caractères hex) dans listings_100.json'
    );
    console.error(`💡 Trouvé: "${agencyId || "undefined"}"`);
    console.error(
      "💡 Utilisez le script: node scripts/update-agency-id.js <VOTRE_AGENCY_ID>"
    );
    process.exit(1);
  }

  console.log(`📋 Agency ID utilisé: ${listings[0].agencyId}\n`);

  console.log(`📦 ${listings.length} annonces à créer\n`);

  const results = {
    success: 0,
    errors: 0,
    errorsList: [],
  };

  // Créer les annonces une par une avec un délai pour éviter la surcharge
  for (let i = 0; i < listings.length; i++) {
    const result = await createListing(listings[i], i);

    if (result.success) {
      results.success++;
    } else {
      results.errors++;
      results.errorsList.push({
        index: i + 1,
        title: listings[i].title,
        error: result.error,
      });
    }

    // Délai de 1 seconde entre chaque requête pour éviter la surcharge
    if (i < listings.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Résumé
  console.log("\n" + "=".repeat(50));
  console.log("📊 RÉSUMÉ");
  console.log("=".repeat(50));
  console.log(`✅ Succès: ${results.success}/${listings.length}`);
  console.log(`❌ Erreurs: ${results.errors}/${listings.length}`);

  if (results.errorsList.length > 0) {
    console.log("\n❌ Erreurs détaillées:");
    results.errorsList.forEach((err) => {
      console.log(
        `  - [${err.index}] ${err.title.substring(0, 40)}... : ${err.error}`
      );
    });
  }
}

main().catch(console.error);
