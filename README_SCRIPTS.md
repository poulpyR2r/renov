# Scripts de génération et création d'annonces

## 📋 Prérequis

1. Avoir un compte agence vérifié
2. Obtenir votre token de session NextAuth
3. Connaître votre `agencyId`

## 🚀 Utilisation

### Étape 1 : Générer les 100 annonces JSON

```bash
npm run generate-listings
```

ou

```bash
node scripts/generate-listings.js
```

Cela crée le fichier `listings_100.json` avec 100 annonces variées.

**⚠️ Important :** Modifiez le fichier `listings_100.json` et remplacez `"YOUR_AGENCY_ID_HERE"` par votre vrai ID d'agence.

### Étape 2 : Obtenir votre token de session

1. Connectez-vous sur votre application
2. Ouvrez les DevTools (F12)
3. Allez dans l'onglet "Application" > "Cookies"
4. Copiez la valeur du cookie `next-auth.session-token`

### Étape 3 : Créer les annonces via l'API

**Windows PowerShell :**
```powershell
$env:SESSION_TOKEN="votre_token_ici"; node scripts/create-listings.js
```

**Windows CMD :**
```cmd
set SESSION_TOKEN=votre_token_ici && node scripts/create-listings.js
```

**Linux/Mac :**
```bash
SESSION_TOKEN=votre_token_ici node scripts/create-listings.js
```

**Variables d'environnement optionnelles :**
- `API_URL` : URL de votre API (défaut: `http://localhost:3000`)
- `SESSION_TOKEN` : Token de session NextAuth (obligatoire)

## 📊 Caractéristiques des annonces générées

- **20 villes différentes** : Paris, Lyon, Marseille, Toulouse, Nice, etc.
- **5 types de biens** : Maison, Appartement, Immeuble, Terrain, Autre
- **Prix variés** : Calculés selon le type et la surface
- **Surfaces variées** : De 30m² à 200m²
- **Niveaux de rénovation** : De 1 (à rénover) à 5 (excellent état)
- **Classes DPE variées** : A à G
- **Travaux variés** : Selon le niveau de rénovation
- **Copropriété** : Gérée automatiquement pour les appartements
- **Diagnostics** : Tous les diagnostics avec états variés

## 📝 Structure des fichiers

- `scripts/generate-listings.js` : Script de génération des données
- `scripts/create-listings.js` : Script de création via l'API
- `listings_100.json` : Fichier JSON avec les 100 annonces

## ⚠️ Notes importantes

- Le script crée les annonces une par une avec un délai de 500ms entre chaque
- Environ 50 secondes pour créer les 100 annonces
- Les erreurs sont affichées à la fin avec un résumé
- Les images utilisent des URLs placeholder (picsum.photos)
