# Guide de test rapide Stripe

## ✅ Vérifications préalables

- [ ] Variables d'environnement configurées (`.env.local`)
- [ ] Stripe CLI installé (pour tester les webhooks en local)
- [ ] Serveur de développement lancé (`npm run dev`)

## 🧪 Tests à effectuer

### 1. Test d'un paiement CPC

1. Aller sur `/agency/cpc` (ou la page où vous avez mis les boutons de recharge)
2. Cliquer sur un pack (ex: Pack 50€)
3. Utiliser une carte de test : `4242 4242 4242 4242`
4. Date d'expiration : n'importe quelle date future (ex: 12/25)
5. CVC : n'importe quel code à 3 chiffres (ex: 123)
6. Vérifier que :
   - ✅ La redirection vers Stripe Checkout fonctionne
   - ✅ Après le paiement, redirection vers `/stripe/success`
   - ✅ Le solde CPC est crédité dans la base de données
   - ✅ Une transaction est enregistrée dans `cpcTransactions`

### 2. Test d'un abonnement

1. Aller sur `/agency/subscription`
2. Cliquer sur "Choisir ce plan" pour un plan (ex: Starter)
3. Utiliser une carte de test : `4242 4242 4242 4242`
4. Vérifier que :
   - ✅ La redirection vers Stripe Checkout fonctionne
   - ✅ Après le paiement, redirection vers `/stripe/success`
   - ✅ L'abonnement est activé dans la base de données
   - ✅ Le plan de l'agence est mis à jour
   - ✅ Le `stripeSubscriptionId` est enregistré

### 3. Test du Customer Portal

1. Avec un abonnement actif, cliquer sur "Gérer mon abonnement"
2. Vérifier que :
   - ✅ Le Customer Portal s'ouvre
   - ✅ On peut voir les détails de l'abonnement
   - ✅ On peut changer de plan
   - ✅ On peut annuler l'abonnement

### 4. Test des webhooks (en local avec Stripe CLI)

1. Lancer Stripe CLI :
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
2. Effectuer un paiement ou un abonnement
3. Vérifier dans la console Stripe CLI que les webhooks sont reçus
4. Vérifier dans les logs du serveur que les webhooks sont traités

### 5. Test d'annulation d'abonnement

1. Via le Customer Portal, annuler un abonnement
2. Vérifier que :
   - ✅ Le statut passe à "canceled" dans la base de données
   - ✅ Le plan revient à "free"
   - ✅ Le `autoRenew` passe à `false`

## 🐛 Problèmes courants

### Le webhook ne fonctionne pas en local

**Solution** : Utiliser Stripe CLI :
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Erreur "Price ID not found"

**Vérifier** :
- Les Price IDs dans `.env.local` sont corrects
- Les variables d'environnement sont bien chargées (redémarrer le serveur)

### Le paiement fonctionne mais les crédits ne sont pas ajoutés

**Vérifier** :
- Les webhooks sont bien configurés
- Le webhook secret est correct
- Les logs du serveur pour voir les erreurs

### Erreur "Customer not found"

**Causes possibles** :
- L'agence n'a pas de `stripeCustomerId`
- Le customer a été supprimé dans Stripe
- **Solution** : Le code crée automatiquement un nouveau customer si nécessaire

## 📊 Vérification dans Stripe Dashboard

1. **Dashboard → Customers** : Vérifier que les customers sont créés
2. **Dashboard → Payments** : Vérifier les paiements
3. **Dashboard → Subscriptions** : Vérifier les abonnements
4. **Dashboard → Events** : Vérifier que les webhooks sont envoyés et reçus

## 🎯 Checklist finale

- [ ] Paiement CPC fonctionne
- [ ] Abonnement fonctionne
- [ ] Customer Portal fonctionne
- [ ] Webhooks sont reçus et traités
- [ ] Annulation d'abonnement fonctionne
- [ ] Les données sont correctement enregistrées en base

Une fois tous ces tests passés, vous êtes prêt pour la production ! 🚀
