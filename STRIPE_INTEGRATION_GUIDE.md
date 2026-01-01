# Guide d'intégration Stripe - Maisons à Rénover

## A) CONFIGURATION STRIPE DASHBOARD

### 1. Créer/paramétrer le compte Stripe

1. **Créer un compte Stripe** : https://dashboard.stripe.com/register
2. **Activer le mode Test** (recommandé pour commencer) :
   - Le mode Test est actif par défaut
   - Utilisez des cartes de test : https://stripe.com/docs/testing
   - Cartes de test utiles :
     - `4242 4242 4242 4242` (Visa, succès)
     - `4000 0000 0000 0002` (carte refusée)
     - `4000 0000 0000 9995` (insuffisant)
3. **Passer en mode Live** :
   - Une fois les tests validés, activez le mode Live
   - Remplissez les informations d'entreprise (obligatoire)
   - Vérifiez votre identité (KYC)

### 2. Récupérer les clés API

1. **Mode Test** :

   - Dashboard → Developers → API keys
   - **Publishable key** : `pk_test_...` (à mettre dans `.env.local`)
   - **Secret key** : `sk_test_...` (à mettre dans `.env.local`)

2. **Mode Live** :

   - Basculez en mode Live (toggle en haut à droite)
   - Récupérez `pk_live_...` et `sk_live_...`

3. **Variables d'environnement à ajouter** :

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_... # ou sk_live_... en production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # ou pk_live_... en production
STRIPE_WEBHOOK_SECRET=whsec_... # Récupéré après configuration du webhook

# URLs (pour les webhooks et redirections)
NEXT_PUBLIC_APP_URL=http://localhost:3000 # ou https://votre-domaine.com en production
```

### 3. Créer les Produits & Prices dans Stripe Dashboard

#### CPC (Paiement unique - One-time)

1. **Dashboard → Products → Add product**
2. Créer un produit "CPC Credits" :

   - **Name** : "CPC Credits"
   - **Description** : "Crédits pour le système Coût Par Clic"
   - **Type** : Service
   - **Pricing model** : Standard pricing
   - **Price** : Créer plusieurs prices selon les packs :
     - Pack 50€ : `50.00 EUR` (one-time)
     - Pack 100€ : `100.00 EUR` (one-time)
     - Pack 200€ : `200.00 EUR` (one-time)
     - Pack 500€ : `500.00 EUR` (one-time)
   - **Billing period** : One time
   - **Recurring** : Non

3. **Copier les Price IDs** (format `price_xxx`) :
   - Notez-les, ils seront utilisés dans le code

#### Abonnements (Recurring)

1. **Dashboard → Products → Add product**
2. Créer un produit par plan :

   **Starter Plan** :

   - **Name** : "Starter Plan"
   - **Description** : "20 annonces, statistiques avancées"
   - **Pricing model** : Standard pricing
   - **Price** : `49.00 EUR`
   - **Billing period** : Monthly (ou Yearly si vous proposez les deux)
   - **Recurring** : Yes
   - **Price ID** : Notez `price_1SkS9wLGaeN5g7y9F3zMNqUA`

   **Pro Plan** :

   - **Name** : "Pro Plan"
   - **Description** : "50 annonces, statistiques premium"
   - **Price** : `99.00 EUR`
   - **Billing period** : Monthly
   - **Recurring** : Yes
   - **Price ID** : Notez `price_1SkSBqLGaeN5g7y9DbXFXJIM`

   **Enterprise Plan** :

   - **Name** : "Enterprise Plan"
   - **Description** : "Annonces illimitées, API access"
   - **Price** : `199.00 EUR`
   - **Billing period** : Monthly
   - **Recurring** : Yes
   - **Price ID** : Notez `price_1SkSDGLGaeN5g7y9uLWwplav`

3. **Ajouter les Price IDs dans votre code** :
   - Créer un fichier `lib/stripe-config.ts` (voir section B)

### 4. Configuration facturation (optionnel)

1. **Taxes** :

   - Dashboard → Settings → Taxes
   - Si nécessaire, configurez les taxes (ex: TVA européenne)
   - Activez "Automatically calculate taxes"

2. **Emails de facturation** :
   - Dashboard → Settings → Email receipts
   - Configurez les emails automatiques envoyés aux clients

### 5. Customer Portal (recommandé)

1. **Dashboard → Settings → Billing → Customer portal**
2. **Activer le Customer Portal** :
   - Permet aux clients de gérer leurs abonnements (upgrade, cancel, update payment method)
   - Configuration recommandée :
     - ✅ Allow customers to update payment methods
     - ✅ Allow customers to cancel subscriptions
     - ✅ Allow customers to switch plans
     - ✅ Send email notifications for subscription updates

### 6. Configurer les Webhooks

#### En développement local (avec Stripe CLI)

1. **Installer Stripe CLI** :

   - Windows : https://stripe.com/docs/stripe-cli#install
   - macOS : `brew install stripe/stripe-cli/stripe`
   - Linux : voir la doc

2. **Login à Stripe CLI** :

   ```bash
   stripe login
   ```

3. **Forwarder les webhooks en local** :

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

   - Cela affichera un `whsec_...` (webhook signing secret)
   - **Copiez ce secret** dans `.env.local` : `STRIPE_WEBHOOK_SECRET=whsec_...`

4. **Tester un webhook** :
   ```bash
   stripe trigger checkout.session.completed
   stripe trigger customer.subscription.created
   ```

#### En production

1. **Dashboard → Developers → Webhooks → Add endpoint**
2. **Endpoint URL** :
   - `https://votre-domaine.com/api/stripe/webhook`
3. **Events à écouter** (sélectionner) :

   - `checkout.session.completed` (pour CPC et subscriptions)
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded` (paiement abonnement réussi)
   - `invoice.payment_failed` (paiement abonnement échoué)
   - `payment_intent.succeeded` (paiement CPC confirmé)
   - `payment_intent.payment_failed` (paiement CPC échoué)

4. **Copier le Signing secret** :
   - Cliquez sur l'endpoint créé
   - Section "Signing secret" → "Reveal"
   - **Copiez `whsec_...`** dans vos variables d'env : `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## B) STRUCTURE DES DONNÉES

### Modèle Agency (mises à jour nécessaires)

Ajouter dans `models/Agency.ts` :

```typescript
export interface IAgency {
  // ... champs existants ...

  // Stripe IDs
  stripeCustomerId?: string; // ID du Customer Stripe
  stripeSubscriptionId?: string; // ID de l'abonnement actif
  stripePriceId?: string; // Price ID du plan actuel
  stripeSubscriptionStatus?:
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "trialing";
  stripeSubscriptionCurrentPeriodEnd?: Date; // Date de fin de période

  // Abonnement (existant, à enrichir)
  subscription: {
    plan: "free" | "starter" | "pro" | "enterprise";
    maxListings: number;
    startDate: Date;
    endDate?: Date;
    autoRenew: boolean;
  };

  // CPC (existant)
  cpc: {
    balance: number;
    totalSpent: number;
    costPerClick: number;
    clicksThisMonth: number;
    lastRechargeAt?: Date;
  };
}
```

### Nouveau modèle : Transaction CPC (Ledger)

Créer `models/CpcTransaction.ts` :

```typescript
export interface ICpcTransaction {
  _id?: ObjectId;
  agencyId: ObjectId;
  type: "credit" | "debit";
  amount: number; // en euros
  currency: string; // "eur"
  creditsAdded?: number; // si type="credit"
  description: string;

  // Stripe IDs
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeCheckoutSessionId?: string;

  // Métadonnées
  metadata?: Record<string, any>;

  // Timestamps
  createdAt: Date;
}
```

---

## C) ENDPOINTS BACKEND À CRÉER

### 1. POST /api/stripe/cpc/checkout-session

**Créer** : `app/api/stripe/cpc/checkout-session/route.ts`

- Auth requise (agency user)
- Crée/retrouve Stripe Customer
- Crée Checkout Session (mode=payment)
- Retourne `checkoutUrl`

### 2. POST /api/stripe/subscription/checkout-session

**Créer** : `app/api/stripe/subscription/checkout-session/route.ts`

- Auth requise (agency user)
- Crée/retrouve Customer
- Crée Checkout Session (mode=subscription)
- Retourne `checkoutUrl`

### 3. POST /api/stripe/customer-portal

**Créer** : `app/api/stripe/customer-portal/route.ts`

- Auth requise
- Crée une session Customer Portal
- Retourne `portalUrl`

### 4. POST /api/stripe/webhook

**Créer** : `app/api/stripe/webhook/route.ts`

- **Pas d'auth** (signature Stripe uniquement)
- Valide la signature webhook
- Gère tous les events Stripe

---

## D) WEBHOOKS - ÉVÉNEMENTS À GÉRER

### Liste minimale recommandée

1. **`checkout.session.completed`**

   - Quand : Après paiement CPC ou souscription réussie
   - Action :
     - Si mode=payment (CPC) : créditer le compte
     - Si mode=subscription : activer l'abonnement

2. **`customer.subscription.created`**

   - Quand : Nouvel abonnement créé
   - Action : Mettre à jour `agency.stripeSubscriptionId`, `stripePriceId`, `subscription.plan`

3. **`customer.subscription.updated`**

   - Quand : Plan changé, statut modifié
   - Action : Mettre à jour le plan et le statut

4. **`customer.subscription.deleted`**

   - Quand : Abonnement annulé
   - Action : Passer à "free", mettre `autoRenew=false`

5. **`invoice.payment_succeeded`**

   - Quand : Paiement abonnement réussi (renouvellement)
   - Action : Mettre à jour `currentPeriodEnd`

6. **`invoice.payment_failed`**

   - Quand : Paiement abonnement échoué
   - Action : Marquer `subscriptionStatus="past_due"`, bloquer l'accès premium

7. **`payment_intent.succeeded`** (backup pour CPC)
   - Quand : Paiement CPC confirmé
   - Action : S'assurer que les crédits sont bien crédités (idempotency)

---

## E) PAGES FRONTEND

### 1. Success Page

**Créer** : `app/stripe/success/page.tsx`

- Affiche un message de succès
- Indique si c'est un paiement CPC ou un abonnement
- Redirige vers la page appropriée après quelques secondes

### 2. Cancel Page

**Créer** : `app/stripe/cancel/page.tsx`

- Affiche un message d'annulation
- Bouton pour réessayer

---

## F) INTÉGRATION DANS LES PAGES EXISTANTES

### Page Subscription (`app/agency/subscription/page.tsx`)

- Modifier le bouton "Choisir ce plan" pour appeler `/api/stripe/subscription/checkout-session`
- Ajouter un bouton "Gérer mon abonnement" (Customer Portal) si abonnement actif

### Page CPC (`app/agency/cpc/page.tsx` - si existe)

- Modifier les boutons de recharge pour appeler `/api/stripe/cpc/checkout-session`

---

## G) SÉCURITÉ & ROBUSTESSE

### 1. Signature Webhook (OBLIGATOIRE)

```typescript
const signature = request.headers.get("stripe-signature");
const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
);
```

### 2. Idempotency

- Utiliser `stripePaymentIntentId` ou `stripeChargeId` pour éviter les doublons
- Vérifier dans la DB avant de créditer : "Ce paymentIntent a-t-il déjà été traité ?"

### 3. Ne jamais faire confiance à `success_url`

- Le webhook est la source de vérité
- `success_url` peut être accédé même si le paiement échoue (en théorie)

### 4. Gestion des erreurs

- Toujours retourner `200` au webhook même en cas d'erreur (pour éviter les retries)
- Logger les erreurs pour debug

---

## H) STRATÉGIE DE TESTS

### Mode Test Stripe

1. **Cartes de test** :

   - `4242 4242 4242 4242` : Succès
   - `4000 0000 0000 0002` : Refusée
   - `4000 0000 0000 9995` : Insuffisant

2. **Stripe CLI** :

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   stripe trigger checkout.session.completed
   ```

3. **Dashboard Stripe Test** :
   - Vérifier les paiements, abonnements, customers créés
   - Vérifier les webhooks reçus (section Events)

---

## I) CHECKLIST DÉPLOIEMENT

- [ ] Clés API Stripe Live configurées
- [ ] Webhook endpoint configuré en production
- [ ] Webhook secret copié dans les variables d'env
- [ ] Price IDs Stripe ajoutés dans le code
- [ ] Customer Portal activé
- [ ] Tests end-to-end effectués
- [ ] Monitoring des webhooks configuré
- [ ] Logs d'erreurs en place

---

## J) PIÈGES COURANTS À ÉVITER

1. **Ne pas créditer deux fois** : Vérifier l'idempotency avec `stripePaymentIntentId`
2. **Gérer `past_due`** : Bloquer l'accès premium si abonnement en retard
3. **Gérer les annulations** : Mettre à jour le plan à "free" quand abonnement annulé
4. **Webhook secret** : Utiliser le bon secret (test vs live)
5. **Raw body** : Le body du webhook doit être brut (pas parsé en JSON)
6. **Timeout webhook** : Répondre rapidement (max 10-30s)
