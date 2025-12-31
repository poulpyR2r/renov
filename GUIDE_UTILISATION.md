# 🚀 Guide d'utilisation - Création de 100 annonces

## 📦 Fichiers créés

✅ `listings_100.json` - 100 annonces prêtes à être créées
✅ `scripts/generate-listings.js` - Script de génération
✅ `scripts/create-listings.js` - Script de création via API
✅ `create-listings.bat` - Script Windows pour faciliter l'exécution

## 🔧 Étapes d'utilisation

### 1️⃣ Modifier le fichier JSON

Ouvrez `listings_100.json` et remplacez **TOUS** les `"YOUR_AGENCY_ID_HERE"` par votre vrai ID d'agence.

**Astuce :** Utilisez la fonction "Remplacer tout" de votre éditeur :
- Rechercher : `"YOUR_AGENCY_ID_HERE"`
- Remplacer par : `"votre_vrai_agency_id"`

### 2️⃣ Obtenir votre token de session

1. Connectez-vous sur votre application (http://localhost:3000)
2. Ouvrez les DevTools (F12)
3. Onglet **Application** (ou **Stockage**)
4. **Cookies** > `http://localhost:3000`
5. Copiez la valeur de `next-auth.session-token`

### 3️⃣ Créer les annonces

#### Option A : Utiliser le script batch (Windows - le plus simple)

Double-cliquez sur `create-listings.bat` et suivez les instructions.

#### Option B : Ligne de commande

**Windows PowerShell :**
```powershell
$env:SESSION_TOKEN="votre_token"; $env:API_URL="http://localhost:3000"; node scripts/create-listings.js
```

**Windows CMD :**
```cmd
set SESSION_TOKEN=votre_token && set API_URL=http://localhost:3000 && node scripts/create-listings.js
```

**Linux/Mac :**
```bash
SESSION_TOKEN=votre_token API_URL=http://localhost:3000 node scripts/create-listings.js
```

## 📊 Caractéristiques des annonces

Les 100 annonces générées incluent :
- ✅ **20 villes différentes** (Paris, Lyon, Marseille, Toulouse, etc.)
- ✅ **5 types de biens** (Maison, Appartement, Immeuble, Terrain, Autre)
- ✅ **Prix variés** selon le type et la surface
- ✅ **Surfaces** de 30m² à 200m²
- ✅ **Niveaux de rénovation** de 1 à 5
- ✅ **Classes DPE** A à G
- ✅ **Travaux variés** selon le niveau
- ✅ **Copropriété** pour les appartements
- ✅ **Tous les diagnostics** avec états variés

## ⏱️ Temps d'exécution

- Environ **50 secondes** pour créer les 100 annonces
- Délai de 500ms entre chaque création pour éviter la surcharge

## ❌ En cas d'erreur

Le script affichera :
- ✅ Les annonces créées avec succès
- ❌ Les erreurs avec détails
- 📊 Un résumé final

## 🔄 Régénérer les annonces

Si vous voulez créer de nouvelles annonces différentes :

```bash
npm run generate-listings
```

Puis suivez les étapes 1 à 3.

