# Checklist de configuration Stripe - Maisons à Rénover

## ✅ Étapes à suivre (dans l'ordre)

### 1. Configuration Stripe Dashboard

- [ ] Créer un compte Stripe (si pas déjà fait)
- [ ] Activer le mode Test
- [ ] Récupérer les clés API Test :
  - [ ] Publishable key (`pk_test_...`)
  - [ ] Secret key (`sk_test_...`)
- [ ] Créer les produits CPC (one-time) :
  - [ ] Pack 50€ → Copier le Price ID (`price_xxx`)
  - [ ] Pack 100€ → Copier le Price ID
  - [ ] Pack 200€ → Copier le Price ID
  - [ ] Pack 500€ → Copier le Price ID
- [ ] Créer les produits Abonnements (recurring) :
  - [ ] Starter Plan (49€/mois) → Copier le Price ID
  - [ ] Pro Plan (99€/mois) → Copier le Price ID
  - [ ] Enterprise Plan (199€/mois) → Copier le Price ID
- [ ] Activer le Customer Portal (Settings → Billing → Customer portal)

### 2. Configuration des variables d'environnement

Ajouter dans `.env.local` :

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_... # Remplacer par votre clé secrète
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Remplacer par votre clé publique
STRIPE_WEBHOOK_SECRET=whsec_... # Récupéré après configuration du webhook

# Price IDs (remplacer par vos vrais Price IDs)
STRIPE_PRICE_ID_STARTER=price_xxx
STRIPE_PRICE_ID_PRO=price_xxx
STRIPE_PRICE_ID_ENTERPRISE=price_xxx
STRIPE_PRICE_ID_CPC_50=price_xxx
STRIPE_PRICE_ID_CPC_100=price_xxx
STRIPE_PRICE_ID_CPC_200=price_xxx
STRIPE_PRICE_ID_CPC_500=price_xxx

# URL de base
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configuration des webhooks

#### En développement local (avec Stripe CLI)

1. Installer Stripe CLI : https://stripe.com/docs/stripe-cli
2. Se connecter :
   ```bash
   stripe login
   ```
3. Forwarder les webhooks :
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. **Copier le `whsec_...` affiché** et l'ajouter dans `.env.local` :
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

#### En production

1. Dashboard Stripe → Developers → Webhooks → Add endpoint
2. URL : `https://votre-domaine.com/api/stripe/webhook`
3. Sélectionner les events :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
4. **Copier le Signing secret** (`whsec_...`) dans les variables d'env de production

### 4. Mettre à jour le code avec les Price IDs

1. Ouvrir `lib/stripe-config.ts`
2. Remplacer les placeholders par vos vrais Price IDs :
   ```typescript
   export const STRIPE_PRICE_IDS = {
     subscription: {
       starter: process.env.STRIPE_PRICE_ID_STARTER || "price_VOTRE_ID_STARTER",
       pro: process.env.STRIPE_PRICE_ID_PRO || "price_VOTRE_ID_PRO",
       enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE || "price_VOTRE_ID_ENTERPRISE",
     },
     cpc: {
       pack50: process.env.STRIPE_PRICE_ID_CPC_50 || "price_VOTRE_ID_CPC_50",
       pack100: process.env.STRIPE_PRICE_ID_CPC_100 || "price_VOTRE_ID_CPC_100",
       pack200: process.env.STRIPE_PRICE_ID_CPC_200 || "price_VOTRE_ID_CPC_200",
       pack500: process.env.STRIPE_PRICE_ID_CPC_500 || "price_VOTRE_ID_CPC_500",
     },
   };
   ```

### 5. Intégrer dans les pages frontend

- [ ] Modifier `app/agency/subscription/page.tsx` (voir `INTEGRATION_EXAMPLES.md`)
- [ ] Créer/modifier `app/agency/cpc/page.tsx` (voir `INTEGRATION_EXAMPLES.md`)

### 6. Tests

- [ ] Tester un paiement CPC avec une carte de test (`4242 4242 4242 4242`)
- [ ] Vérifier que les crédits sont bien ajoutés
- [ ] Tester un abonnement avec une carte de test
- [ ] Vérifier que le plan est bien mis à jour
- [ ] Tester le Customer Portal
- [ ] Tester l'annulation d'un abonnement
- [ ] Vérifier les webhooks dans Stripe Dashboard (Events)

### 7. Migration de la base de données

Les nouveaux champs Stripe seront automatiquement ajoutés lors de la première utilisation. Cependant, si vous avez déjà des agences, vous pouvez laisser les champs optionnels.

### 8. Déploiement en production

- [ ] Passer en mode Live dans Stripe Dashboard
- [ ] Récupérer les clés API Live
- [ ] Mettre à jour les variables d'env en production
- [ ] Configurer le webhook en production
- [ ] Tester avec une vraie carte (petit montant)
- [ ] Monitorer les logs des webhooks

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers
- `STRIPE_INTEGRATION_GUIDE.md` - Guide complet d'intégration
- `STRIPE_SETUP_CHECKLIST.md` - Cette checklist
- `INTEGRATION_EXAMPLES.md` - Exemples de code pour intégrer dans les pages
- `lib/stripe-config.ts` - Configuration Stripe et Price IDs
- `lib/stripe-helpers.ts` - Helpers pour créer/récupérer les Customers
- `models/CpcTransaction.ts` - Modèle pour les transactions CPC
- `app/api/stripe/cpc/checkout-session/route.ts` - Endpoint CPC checkout
- `app/api/stripe/subscription/checkout-session/route.ts` - Endpoint subscription checkout
- `app/api/stripe/customer-portal/route.ts` - Endpoint Customer Portal
- `app/api/stripe/webhook/route.ts` - Handler webhook principal
- `app/stripe/success/page.tsx` - Page de succès
- `app/stripe/cancel/page.tsx` - Page d'annulation

### Fichiers modifiés
- `models/Agency.ts` - Ajout des champs Stripe (stripeCustomerId, stripeSubscriptionId, etc.)
- `package.json` - Ajout de `stripe` et `@stripe/stripe-js`

## 🔍 Points d'attention

1. **Webhook secret** : Utiliser le bon secret (test vs live)
2. **Price IDs** : S'assurer que tous les Price IDs sont corrects
3. **Idempotency** : Les transactions sont protégées contre les doublons
4. **Raw body** : Le webhook handler utilise `request.text()` pour obtenir le raw body
5. **Test en local** : Utiliser Stripe CLI pour tester les webhooks en local
6. **Customer Portal** : Permet aux clients de gérer leurs abonnements sans intervention backend

## 🆘 En cas de problème

1. Vérifier les logs du serveur (erreurs dans la console)
2. Vérifier les Events dans Stripe Dashboard
3. Vérifier que les webhooks sont bien reçus
4. Vérifier que les variables d'env sont bien définies
5. Vérifier que les Price IDs sont corrects

## 📚 Documentation

- Guide complet : `STRIPE_INTEGRATION_GUIDE.md`
- Exemples d'intégration : `INTEGRATION_EXAMPLES.md`
- Documentation Stripe : https://stripe.com/docs
