// Script pour remplacer YOUR_AGENCY_ID_HERE par un vrai ID d'agence
const fs = require('fs');
const path = require('path');

const LISTINGS_FILE = path.join(__dirname, '../listings_100.json');
const AGENCY_ID = process.env.AGENCY_ID || process.argv[2];

if (!AGENCY_ID) {
  console.error('❌ Veuillez fournir un ID d\'agence');
  console.log('💡 Usage: node scripts/update-agency-id.js YOUR_AGENCY_ID');
  console.log('💡 Ou: AGENCY_ID=your_id node scripts/update-agency-id.js');
  process.exit(1);
}

if (!fs.existsSync(LISTINGS_FILE)) {
  console.error(`❌ Fichier non trouvé: ${LISTINGS_FILE}`);
  console.log('💡 Exécutez d\'abord: node scripts/generate-listings.js');
  process.exit(1);
}

// Lire le fichier
let content = fs.readFileSync(LISTINGS_FILE, 'utf8');

// Compter les occurrences
const count = (content.match(/YOUR_AGENCY_ID_HERE/g) || []).length;

if (count === 0) {
  console.log('✅ Aucun "YOUR_AGENCY_ID_HERE" trouvé dans le fichier');
  console.log(`📋 Agency ID actuel: ${JSON.parse(content)[0]?.agencyId || 'non défini'}`);
  process.exit(0);
}

// Remplacer toutes les occurrences
content = content.replace(/YOUR_AGENCY_ID_HERE/g, AGENCY_ID);

// Sauvegarder
fs.writeFileSync(LISTINGS_FILE, content, 'utf8');

console.log(`✅ ${count} occurrence(s) de "YOUR_AGENCY_ID_HERE" remplacée(s) par "${AGENCY_ID}"`);
console.log(`📋 Fichier mis à jour: ${LISTINGS_FILE}`);

