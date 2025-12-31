// Script pour générer 100 annonces variées
const fs = require('fs');
const path = require('path');

// Données de base pour générer des annonces variées
const cities = [
  { city: "Paris", postalCode: "75001", department: "75" },
  { city: "Paris", postalCode: "75010", department: "75" },
  { city: "Paris", postalCode: "75015", department: "75" },
  { city: "Lyon", postalCode: "69001", department: "69" },
  { city: "Lyon", postalCode: "69003", department: "69" },
  { city: "Marseille", postalCode: "13001", department: "13" },
  { city: "Marseille", postalCode: "13008", department: "13" },
  { city: "Toulouse", postalCode: "31000", department: "31" },
  { city: "Nice", postalCode: "06000", department: "06" },
  { city: "Nantes", postalCode: "44000", department: "44" },
  { city: "Strasbourg", postalCode: "67000", department: "67" },
  { city: "Montpellier", postalCode: "34000", department: "34" },
  { city: "Bordeaux", postalCode: "33000", department: "33" },
  { city: "Lille", postalCode: "59000", department: "59" },
  { city: "Rennes", postalCode: "35000", department: "35" },
  { city: "Reims", postalCode: "51100", department: "51" },
  { city: "Le Havre", postalCode: "76600", department: "76" },
  { city: "Saint-Étienne", postalCode: "42000", department: "42" },
  { city: "Toulon", postalCode: "83000", department: "83" },
  { city: "Grenoble", postalCode: "38000", department: "38" },
];

const propertyTypes = ["house", "apartment", "building", "land", "other"];
const propertyTypeLabels = {
  house: "Maison",
  apartment: "Appartement",
  building: "Immeuble",
  land: "Terrain",
  other: "Autre"
};

const dpeClasses = ["A", "B", "C", "D", "E", "F", "G"];
const renovationLevels = [1, 2, 3, 4, 5];
const renovationLevelLabels = {
  1: "À rénover entièrement",
  2: "Rénovation importante",
  3: "Rénovation partielle",
  4: "Bon état",
  5: "Excellent état"
};

const requiredWorks = [
  "électricité",
  "plomberie",
  "isolation",
  "cuisine",
  "salle de bain",
  "sols / murs",
  "toiture / structure"
];

const adjectives = [
  "Belle", "Charmante", "Spacieuse", "Moderne", "Authentique",
  "Lumineuse", "Calme", "Exceptionnelle", "Prestigieuse", "Cosy"
];

const features = [
  "jardin", "balcon", "terrasse", "cave", "garage", "parking",
  "piscine", "vue dégagée", "exposition sud", "double vitrage",
  "cheminée", "parquet", "mezzanine", "veranda"
];

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPrice(propertyType, surface) {
  let basePrice;
  switch (propertyType) {
    case "house":
      basePrice = surface * 2500;
      break;
    case "apartment":
      basePrice = surface * 4000;
      break;
    case "building":
      basePrice = surface * 2000;
      break;
    case "land":
      basePrice = surface * 150;
      break;
    default:
      basePrice = surface * 2000;
  }
  // Variation de ±30%
  const variation = basePrice * 0.3;
  return Math.round(basePrice + (Math.random() * variation * 2 - variation));
}

function generateListing(index, agencyId) {
  const location = randomElement(cities);
  const propertyType = randomElement(propertyTypes);
  const surface = randomInt(30, 200);
  const rooms = randomInt(2, 8);
  const bedrooms = propertyType === "land" ? 0 : randomInt(1, rooms - 1);
  const bathrooms = propertyType === "land" ? 0 : randomInt(1, 3);
  const constructionYear = randomInt(1850, 2020);
  const renovationLevel = randomElement(renovationLevels);
  const dpeClass = randomElement(dpeClasses);
  const gesClass = randomElement(dpeClasses);
  
  const adjective = randomElement(adjectives);
  const feature = randomElement(features);
  const typeLabel = propertyTypeLabels[propertyType];
  
  const title = `${adjective} ${typeLabel.toLowerCase()} ${rooms} pièces ${surface}m² - ${location.city}`;
  
  const description = `${adjective} ${typeLabel.toLowerCase()} de ${surface}m² située à ${location.city} (${location.postalCode}).

Caractéristiques :
- ${rooms} pièces principales${bedrooms > 0 ? `, ${bedrooms} chambres` : ''}
- ${bathrooms} salle${bathrooms > 1 ? 's' : ''} de bain
- Surface : ${surface}m²
- Année de construction : ${constructionYear}
- ${feature}

État : ${renovationLevelLabels[renovationLevel]}

Diagnostics disponibles.`;

  // Générer des travaux à prévoir selon le niveau de rénovation
  const works = [];
  if (renovationLevel <= 2) {
    works.push(...requiredWorks.slice(0, randomInt(4, 7)));
  } else if (renovationLevel === 3) {
    works.push(...requiredWorks.slice(0, randomInt(2, 4)));
  }

  const price = randomPrice(propertyType, surface);
  const feesAmount = Math.round(price * 0.05); // 5% des honoraires

  return {
    title,
    description,
    price,
    location: {
      city: location.city,
      postalCode: location.postalCode,
      department: location.department,
      address: `${randomInt(1, 200)} ${randomElement(['Rue', 'Avenue', 'Boulevard', 'Place'])} ${randomElement(['de la République', 'Victor Hugo', 'Jean Jaurès', 'Gambetta', 'Clemenceau', 'de la Paix', 'du Commerce'])}`
    },
    propertyType,
    transactionType: "sale",
    surface,
    rooms,
    bedrooms: propertyType === "land" ? undefined : bedrooms,
    bathrooms: propertyType === "land" ? undefined : bathrooms,
    constructionYear,
    contactPhone: `+33${randomInt(6, 7)}${randomInt(10000000, 99999999)}`,
    hidePhone: false,
    acceptTerms: true,
    acceptDataProcessing: true,
    images: [
      `https://picsum.photos/800/600?random=${index + 1}`,
      `https://picsum.photos/800/600?random=${index + 2}`,
      `https://picsum.photos/800/600?random=${index + 3}`
    ],
    agencyId,
    fees: {
      included: Math.random() > 0.5,
      amount: feesAmount,
      percentage: 5,
      paidBy: randomElement(["seller", "buyer"])
    },
    currency: "EUR",
    diagnostics: {
      dpe: {
        energyClass: dpeClass,
        gesClass: gesClass,
        energyCost: {
          min: randomInt(800, 2000),
          max: randomInt(2000, 5000)
        },
        referenceYear: 2023,
        date: new Date(2023, randomInt(0, 11), randomInt(1, 28)).toISOString()
      },
      asbestos: randomElement(["available", "in_progress", "not_applicable"]),
      lead: randomElement(["available", "in_progress", "not_applicable"]),
      electricity: randomElement(["available", "in_progress", "not_applicable"]),
      gas: randomElement(["available", "in_progress", "not_applicable"]),
      termites: randomElement(["available", "in_progress", "not_applicable"]),
      erp: randomElement(["available", "in_progress", "not_applicable"])
    },
    renovation: {
      level: renovationLevel,
      requiredWorks: works.length > 0 ? works : undefined,
      estimatedBudget: renovationLevel <= 2 ? randomInt(30000, 100000) : renovationLevel === 3 ? randomInt(10000, 30000) : undefined
    },
    copropriety: propertyType === "apartment" ? {
      isSubject: true,
      lotsCount: randomInt(10, 100),
      annualCharges: randomInt(1000, 5000),
      procedureInProgress: Math.random() > 0.8
    } : {
      isSubject: false,
      procedureInProgress: false
    },
    agencyCertification: {
      certified: true,
      certifiedAt: new Date().toISOString()
    }
  };
}

// Générer 100 annonces
const listings = [];
const agencyId = process.env.AGENCY_ID || "YOUR_AGENCY_ID_HERE";

for (let i = 0; i < 100; i++) {
  listings.push(generateListing(i, agencyId));
}

// Sauvegarder dans un fichier JSON
const outputPath = path.join(__dirname, '../listings_100.json');
fs.writeFileSync(outputPath, JSON.stringify(listings, null, 2));

console.log(`✅ 100 annonces générées et sauvegardées dans ${outputPath}`);
console.log(`📝 N'oubliez pas de remplacer "YOUR_AGENCY_ID_HERE" par votre vrai ID d'agence`);

