# 🔄 Guide de Migration - Nouveaux Plans Wipay

## 📋 Résumé des changements

Vous passez de **3 plans** (`free`, `pro`, `business`) à **2 plans** :

- **Paiement Unique** (`one_time`) : 4,99€ pour 1 QR code
- **Premium** (`premium`) : 8,99€/mois pour un accès illimité

## 🗂️ Fichiers modifiés

### ✅ Déjà mis à jour :

- `src/pages/pricing.astro` - Page de pricing avec les nouveaux plans
- `supabase-migration-new-plans.sql` - Script de migration SQL
- `src/lib/stripe-config.ts` - Configuration Stripe mise à jour
- `src/lib/supabase.ts` - Types TypeScript mis à jour
- `src/env.d.ts` - Types d'environnement mis à jour
- `src/components/Header.astro` - Affichage des plans mis à jour (partiellement)

### ⚠️ À vérifier/corriger :

- `src/components/QRPaymentGenerator.astro` - Logique de limitation
- `src/lib/stripe.ts` - Configuration Stripe (si différente de stripe-config.ts)
- `src/pages/api/webhooks/stripe.ts` - Gestion des webhooks
- Autres composants utilisant les anciens plans

## 🚀 Étapes de migration

### 1. **Base de données Supabase**

Exécutez le script `supabase-migration-new-plans.sql` dans votre SQL Editor Supabase :

```sql
-- Le script fait automatiquement :
-- ✅ Mise à jour des contraintes CHECK
-- ✅ Migration des données existantes
-- ✅ Mise à jour des fonctions PL/pgSQL
-- ✅ Ajout de nouvelles fonctions d'activation
```

### 2. **Configuration Stripe**

#### A. Créer les nouveaux produits/prix dans Stripe Dashboard :

```bash
# Produit pour paiement unique
stripe products create --name="QR Code Unique" --description="1 QR code personnalisé"

# Prix pour paiement unique (4,99€)
stripe prices create \
  --product=prod_XXXXX \
  --unit-amount=499 \
  --currency=eur

# Produit pour abonnement premium
stripe products create --name="QR Premium" --description="QR codes illimités"

# Prix pour abonnement premium (8,99€/mois)
stripe prices create \
  --product=prod_YYYYY \
  --unit-amount=899 \
  --currency=eur \
  --recurring[interval]=month
```

#### B. Mettre à jour `src/lib/stripe-config.ts` avec vos vrais Price IDs :

```typescript
export const STRIPE_PLANS = {
  one_time: {
    // ...
    stripe_price_id: "price_VOTRE_VRAI_ID_UNIQUE", // ⚠️ Remplacer
  },
  premium: {
    // ...
    stripe_price_id: "price_VOTRE_VRAI_ID_PREMIUM", // ⚠️ Remplacer
  },
};

export const PRICE_ID_TO_TIER = {
  price_VOTRE_VRAI_ID_UNIQUE: "one_time",
  price_VOTRE_VRAI_ID_PREMIUM: "premium",
};
```

### 3. **Webhooks Stripe**

Mettez à jour votre endpoint webhook pour gérer les nouveaux événements :

#### Événements à écouter :

- `checkout.session.completed` - ✅ Paiement unique réussi
- `payment_intent.succeeded` - ✅ Confirmation de paiement
- `customer.subscription.created` - ✅ Nouvel abonnement premium
- `customer.subscription.updated` - ✅ Modification abonnement
- `customer.subscription.deleted` - ✅ Annulation abonnement
- `invoice.payment_succeeded` - ✅ Renouvellement premium
- `invoice.payment_failed` - ✅ Échec de paiement

#### Logique de traitement :

```typescript
// Pour paiement unique
if (event.type === "checkout.session.completed") {
  const session = event.data.object;
  if (session.mode === "payment") {
    // Activer le plan one_time
    await supabase.rpc("activate_one_time_plan", {
      user_uuid: userId,
    });
  }
}

// Pour abonnement premium
if (event.type === "customer.subscription.created") {
  // Activer le plan premium
  await supabase.rpc("activate_premium_plan", {
    user_uuid: userId,
  });
}
```

### 4. **Interface utilisateur**

#### A. Vérifier les composants restants :

```bash
# Rechercher les références aux anciens plans
grep -r "free\|pro\|business" src/components/
grep -r "subscription_tier.*===" src/
```

#### B. Mettre à jour la logique de limitation :

```typescript
// Nouvelle logique
function canCreateQR(tier: string, used: number): boolean {
  if (tier === "premium") return true;
  if (tier === "one_time") return used < 1;
  return false; // Pas de plan actif
}
```

### 5. **Messages utilisateur**

Mettre à jour les messages d'erreur et d'information :

```typescript
function getLimitMessage(tier: string, used: number): string {
  if (tier === "one_time" && used >= 1) {
    return "Vous avez utilisé votre QR code unique. Passez au Premium pour un accès illimité.";
  }
  if (tier === "premium") {
    return "Plan Premium : QR codes illimités";
  }
  return "Aucun plan actif. Choisissez un plan pour commencer.";
}
```

## 🧪 Tests à effectuer

### 1. **Nouveaux utilisateurs**

- ✅ Inscription → statut `inactive` par défaut
- ✅ Achat plan unique → activation + 1 QR disponible
- ✅ Souscription premium → activation + QR illimités

### 2. **Utilisateurs existants**

- ✅ Migration automatique des données
- ✅ Anciens `free` → `one_time` avec 1 QR
- ✅ Anciens `pro`/`business` → `premium` illimité

### 3. **Fonctionnalités**

- ✅ Génération QR selon les nouvelles limites
- ✅ Affichage correct des plans dans l'interface
- ✅ Webhooks Stripe fonctionnels
- ✅ Gestion des paiements uniques et récurrents

## 🔧 Variables d'environnement

Assurez-vous d'avoir :

```env
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs Supabase** pour les erreurs SQL
2. **Consultez les webhooks Stripe** pour les événements manqués
3. **Testez avec des paiements de test** avant la production

## ✅ Checklist finale

- [ ] Script SQL exécuté dans Supabase
- [ ] Produits/prix créés dans Stripe
- [ ] Price IDs mis à jour dans le code
- [ ] Webhooks configurés et testés
- [ ] Interface utilisateur vérifiée
- [ ] Tests effectués avec comptes de test
- [ ] Déploiement en production

---

**Note importante** : Cette migration change la structure fondamentale de votre système de plans. Testez soigneusement en environnement de développement avant de déployer en production.
