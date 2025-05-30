# 🔗 Guide Webhooks Stripe - Wipay SaaS

## 📋 Webhooks ESSENTIELS (à configurer absolument)

### 1. `customer.subscription.created` 🎯

**Quand** : Un utilisateur souscrit à un plan payant
**Action** : Upgrade immédiat vers Pro/Business

```typescript
// L'utilisateur passe de "free" à "pro" ou "business"
await updateUserSubscription(customerId, {
  subscription_tier: "pro", // ou 'business'
  subscription_status: "active",
  qr_codes_limit: 100, // ou -1 pour business
});
```

### 2. `invoice.payment_succeeded` 💰

**Quand** : Paiement mensuel réussi (renouvellement)
**Action** : Reset des compteurs + confirmation statut actif

```typescript
// Nouveau cycle de facturation = reset des compteurs
await updateUserSubscription(customerId, {
  subscription_status: "active",
  qr_codes_used_this_month: 0, // 🔄 Reset pour le nouveau mois
});
```

### 3. `customer.subscription.deleted` ❌

**Quand** : Utilisateur annule son abonnement
**Action** : Retour au plan gratuit

```typescript
// Downgrade vers le plan gratuit
await updateUserSubscription(customerId, {
  subscription_tier: "free",
  subscription_status: "canceled",
  qr_codes_limit: 5,
});
```

### 4. `invoice.payment_failed` ⚠️

**Quand** : Échec de paiement (carte expirée, fonds insuffisants)
**Action** : Marquer comme "en retard" mais garder l'accès temporairement

```typescript
// Statut "past_due" = accès limité
await updateUserSubscription(customerId, {
  subscription_status: "past_due",
  // Note: on garde le tier actuel temporairement
});
```

## 🔧 Configuration dans Stripe Dashboard

### Étapes de configuration :

1. **Aller dans Stripe Dashboard** → Developers → Webhooks
2. **Cliquer "Add endpoint"**
3. **URL de l'endpoint** : `https://votre-domaine.com/api/webhooks/stripe`
4. **Sélectionner ces événements** :

```
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ invoice.payment_succeeded
✅ invoice.payment_failed
```

5. **Événements optionnels** (pour améliorer l'UX) :

```
📧 customer.subscription.trial_will_end
📧 invoice.upcoming
📊 customer.created
```

6. **Copier le Webhook Secret** : `whsec_...`

## 🧪 Test en local avec Stripe CLI

### Installation et test :

```bash
# 1. Installer Stripe CLI
brew install stripe/stripe-cli/stripe
# ou
npm install -g stripe-cli

# 2. Se connecter à votre compte
stripe login

# 3. Écouter les webhooks en local
stripe listen --forward-to localhost:4321/api/webhooks/stripe

# 4. Dans un autre terminal, déclencher des événements de test
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.deleted
```

## 📊 Scénarios d'usage typiques

### Scénario 1 : Nouvel abonnement Pro

```
1. Utilisateur clique "Upgrade to Pro" → Stripe Checkout
2. Paiement réussi → `customer.subscription.created`
3. Webhook reçu → Upgrade vers tier "pro"
4. Utilisateur peut maintenant créer 100 QR/mois
```

### Scénario 2 : Renouvellement mensuel

```
1. 1er du mois → Stripe tente le paiement automatique
2. Paiement réussi → `invoice.payment_succeeded`
3. Webhook reçu → Reset `qr_codes_used_this_month = 0`
4. Utilisateur repart avec son quota complet
```

### Scénario 3 : Annulation d'abonnement

```
1. Utilisateur annule → `customer.subscription.deleted`
2. Webhook reçu → Downgrade vers "free"
3. Limite réduite à 5 QR codes/mois
4. Fonctionnalités premium désactivées
```

### Scénario 4 : Échec de paiement

```
1. Paiement échoue → `invoice.payment_failed`
2. Webhook reçu → Statut "past_due"
3. Email d'alerte envoyé (optionnel)
4. Accès maintenu 7 jours puis suspension
```

## 🔍 Debugging des webhooks

### Logs à surveiller :

```typescript
// Dans votre webhook handler
console.log(`🔔 Webhook reçu: ${event.type}`);
console.log(`👤 Customer: ${customerId}`);
console.log(`💰 Montant: ${invoice?.amount_paid || "N/A"}`);
console.log(
  `📅 Période: ${subscription?.current_period_start} - ${subscription?.current_period_end}`
);
```

### Erreurs courantes :

| Erreur                                  | Cause                         | Solution                         |
| --------------------------------------- | ----------------------------- | -------------------------------- |
| `Webhook signature verification failed` | Mauvais webhook secret        | Vérifier `STRIPE_WEBHOOK_SECRET` |
| `Customer not found`                    | Customer ID inexistant en BDD | Créer le customer d'abord        |
| `Price ID not mapped`                   | Price ID non configuré        | Ajouter dans `stripe-config.ts`  |

## 📈 Métriques importantes à tracker

### Événements business critiques :

- **Nouveaux abonnements** : `customer.subscription.created`
- **Churn rate** : `customer.subscription.deleted`
- **Échecs de paiement** : `invoice.payment_failed`
- **Revenus** : `invoice.payment_succeeded`

### Dashboard recommandé :

```typescript
// Exemples de métriques à calculer
const metrics = {
  mrr: "Monthly Recurring Revenue",
  churnRate: "Taux d'annulation mensuel",
  conversionRate: "Free → Paid conversion",
  failedPayments: "Paiements échoués ce mois",
};
```

## 🚀 Prochaines étapes

1. **Configurer les webhooks** dans Stripe Dashboard
2. **Tester en local** avec Stripe CLI
3. **Déployer** et tester en production
4. **Monitorer** les logs et métriques
5. **Ajouter** des notifications email (optionnel)

---

💡 **Conseil** : Commencez par les 4 webhooks essentiels, puis ajoutez les optionnels selon vos besoins.
