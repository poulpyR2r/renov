# 🚀 Guide de Déploiement Production - Maisons à Rénover

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         TRAEFIK                              │
│              (Reverse Proxy + SSL Let's Encrypt)             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   maisons-a-renover.fr ─────┐                               │
│   www.maisons-a-renover.fr ─┼──► maisonsarenover-app:3000   │
│   api.maisons-a-renover.fr ─┘      (Next.js - Front + API)  │
│                                           │                  │
│                                           ▼                  │
│                              maisonsarenover-mongodb:27017   │
│                                   (Réseau interne)           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

> **Note importante:** Ce projet est une application Next.js monolithique.
> Les routes API sont gérées par Next.js (`/api/*`) et non par un serveur séparé.
> Le domaine `api.maisons-a-renover.fr` pointe vers la même application.

---

## 📋 Checklist Pré-déploiement

### 1. Prérequis serveur

- [ ] Docker et Docker Compose installés
- [ ] Traefik déjà opérationnel
- [ ] Réseau Docker `traefik` existant
- [ ] CertResolver `letsencrypt` configuré dans Traefik
- [ ] DNS configuré pour les domaines

### 2. Configuration DNS

Configurer les enregistrements DNS suivants :

| Type | Nom | Valeur |
|------|-----|--------|
| A | maisons-a-renover.fr | IP_DU_SERVEUR |
| A | www.maisons-a-renover.fr | IP_DU_SERVEUR |
| A | api.maisons-a-renover.fr | IP_DU_SERVEUR |

### 3. Configuration des services externes

#### Google OAuth

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer/sélectionner un projet
3. APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID
4. Type: **Web application**
5. **URIs de redirection autorisées** :
   ```
   https://maisons-a-renover.fr/api/auth/callback/google
   ```
6. **Origines JavaScript autorisées** :
   ```
   https://maisons-a-renover.fr
   https://www.maisons-a-renover.fr
   ```
7. Copier Client ID et Client Secret

#### Stripe

1. Aller sur [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Passer en mode LIVE** (pas test)
3. Récupérer les clés API :
   - API Keys > Clé secrète (`sk_live_...`)
   - API Keys > Clé publiable (`pk_live_...`)
4. Créer les **produits et prix** :
   - Pack Starter : 39€/mois (ou 49€/mois)
   - Pack Pro : 99€/mois
   - Pack Premium : 199€/mois
   - Packs CPC : 20€, 50€, 100€, 200€ (paiements uniques)
5. **Configurer le webhook** :
   - Webhooks > Add endpoint
   - URL : `https://maisons-a-renover.fr/api/stripe/webhook`
   - Événements à écouter :
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copier le **Signing secret** (`whsec_...`)

#### SMTP (Gmail exemple)

1. Activer la validation en 2 étapes sur le compte Google
2. Créer un mot de passe d'application :
   - Sécurité > Mots de passe des applications
   - Sélectionner "Autre" > Nommer "Maisons à Rénover"
   - Copier le mot de passe généré

---

## 🔧 Instructions de Déploiement

### Étape 1 : Préparer les fichiers

```bash
# Cloner le projet sur le serveur
git clone <votre-repo> /opt/maisonsarenover
cd /opt/maisonsarenover

# Copier et configurer l'environnement
cp env.prod.example .env.prod
nano .env.prod  # Remplir toutes les valeurs
```

### Étape 2 : Vérifier le réseau Traefik

```bash
# Vérifier que le réseau traefik existe
docker network ls | grep traefik

# Si le réseau n'existe pas, le créer
docker network create traefik
```

### Étape 3 : Build et démarrage

```bash
# Build des images (peut prendre quelques minutes)
docker compose -f docker-compose.prod.yml build --no-cache

# Démarrer les services
docker compose -f docker-compose.prod.yml up -d

# Vérifier les logs
docker compose -f docker-compose.prod.yml logs -f --tail=200
```

### Étape 4 : Vérifications

```bash
# Statut des containers
docker compose -f docker-compose.prod.yml ps

# Health check de l'application
curl -s https://maisons-a-renover.fr/api/health | jq

# Health check via le domaine API
curl -s https://api.maisons-a-renover.fr/api/health | jq

# Vérifier les certificats SSL
curl -I https://maisons-a-renover.fr
```

---

## ✅ Tests Post-déploiement

### Tests fonctionnels

| Test | URL/Action | Résultat attendu |
|------|------------|------------------|
| Page d'accueil | https://maisons-a-renover.fr | ✅ Page chargée |
| Health API | https://maisons-a-renover.fr/api/health | ✅ `{"status":"ok"}` |
| Redirection HTTP | http://maisons-a-renover.fr | ✅ Redirige vers HTTPS |
| Redirection www | https://www.maisons-a-renover.fr | ✅ Accessible |
| Recherche | https://maisons-a-renover.fr/search | ✅ Liste d'annonces |
| Connexion Google | Bouton "Se connecter avec Google" | ✅ Redirection OAuth |
| Inscription agence | /register/agency | ✅ Formulaire affiché |
| robots.txt | /robots.txt | ✅ Contenu valide |
| sitemap.xml | /sitemap.xml | ✅ Sitemap généré |

### Tests Stripe (Mode Live)

1. **Checkout abonnement** :
   - Se connecter en tant qu'agence
   - Aller sur /agency/subscription
   - Cliquer sur un pack
   - Utiliser une vraie carte pour un test minimal

2. **Webhooks** :
   - Vérifier les logs pour les événements reçus
   - Dashboard Stripe > Webhooks > Voir les tentatives

### Tests Email

```bash
# Déclencher un email de test (mot de passe oublié)
# Depuis le formulaire /forgot-password avec une vraie adresse
```

---

## 🔒 Sécurité

### À vérifier

- [ ] `.env.prod` n'est PAS dans le repo git
- [ ] MongoDB n'est PAS exposé publiquement (pas de ports:)
- [ ] Secrets uniques et forts (NEXTAUTH_SECRET, etc.)
- [ ] Mode LIVE de Stripe (pas test en prod)
- [ ] Webhook Stripe sécurisé (signature validée)
- [ ] HTTPS forcé sur tous les domaines
- [ ] Headers de sécurité actifs (vérifier avec securityheaders.com)

### Régénérer les secrets

```bash
# Générer un nouveau NEXTAUTH_SECRET
openssl rand -base64 32

# Générer un secret aléatoire
openssl rand -hex 32
```

---

## 🛠 Maintenance

### Logs

```bash
# Tous les logs
docker compose -f docker-compose.prod.yml logs -f

# Logs d'un service spécifique
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f db
```

### Mise à jour

```bash
# Récupérer les dernières modifications
git pull origin main

# Rebuild et redémarrer
docker compose -f docker-compose.prod.yml build --no-cache app
docker compose -f docker-compose.prod.yml up -d app

# Vérifier
docker compose -f docker-compose.prod.yml logs -f app --tail=100
```

### Sauvegarde MongoDB

```bash
# Backup
docker exec maisonsarenover-mongodb mongodump \
  --db maisonsarenover_prod \
  --out /data/backup/$(date +%Y%m%d)

# Copier le backup vers l'hôte
docker cp maisonsarenover-mongodb:/data/backup ./backups/

# Restore (si nécessaire)
docker exec maisonsarenover-mongodb mongorestore \
  --db maisonsarenover_prod \
  /data/backup/20240101/maisonsarenover_prod
```

### Redémarrage

```bash
# Redémarrer tous les services
docker compose -f docker-compose.prod.yml restart

# Redémarrer un service spécifique
docker compose -f docker-compose.prod.yml restart app
```

### Arrêt complet

```bash
# Arrêter sans supprimer les données
docker compose -f docker-compose.prod.yml down

# Arrêter ET supprimer les volumes (⚠️ PERTE DE DONNÉES)
docker compose -f docker-compose.prod.yml down -v
```

---

## 🐛 Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs détaillés
docker compose -f docker-compose.prod.yml logs app

# Erreurs courantes :
# - MONGODB_URI incorrect
# - Variables d'environnement manquantes
# - Port 3000 déjà utilisé
```

### Erreur 502 Bad Gateway

```bash
# L'application n'est pas encore prête
# Attendre quelques secondes et réessayer

# Vérifier que le container est healthy
docker compose -f docker-compose.prod.yml ps
```

### Certificat SSL non généré

```bash
# Vérifier les logs Traefik
docker logs traefik 2>&1 | grep -i "maisons-a-renover"

# Vérifier la configuration DNS
nslookup maisons-a-renover.fr
```

### Connexion Google échoue

1. Vérifier les URIs de redirection dans Google Cloud Console
2. S'assurer que les variables GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET sont correctes
3. Vérifier que NEXTAUTH_URL = https://maisons-a-renover.fr

### Webhook Stripe ne fonctionne pas

1. Vérifier que l'URL du webhook est correcte dans Stripe Dashboard
2. Vérifier le STRIPE_WEBHOOK_SECRET
3. Consulter les tentatives dans Stripe Dashboard > Webhooks

---

## 📞 Support

En cas de problème :
1. Consulter les logs Docker
2. Vérifier la configuration des variables d'environnement
3. Tester les endpoints un par un
4. Vérifier les services externes (Stripe, Google, SMTP)
