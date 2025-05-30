# 🚀 Transformation en SaaS - Guide Complet

Ce guide vous explique comment transformer votre générateur de QR codes en SaaS avec Astro, Supabase et Stripe.

## 📋 Prérequis

- [Compte Supabase](https://supabase.com)
- [Compte Stripe](https://stripe.com)
- Node.js 18+ et pnpm
- Projet Astro configuré

## 🏗️ Architecture SaaS

### Plans d'abonnement proposés :

- **Gratuit** : 5 QR codes/mois, couleurs de base
- **Pro** (9.99€/mois) : 100 QR codes/mois, couleurs personnalisées, tous formats
- **Business** (29.99€/mois) : QR codes illimités, API, analytics

## 🔧 Configuration Supabase

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre `Project URL` et `anon public key`

### 2. Configurer la base de données

1. Dans le dashboard Supabase, allez dans `SQL Editor`
2. Exécutez le script `supabase-schema.sql` fourni
3. Cela créera toutes les tables et fonctions nécessaires

**Note importante** : Le script a été corrigé pour éviter l'erreur `schema "cron" does not exist`. La réinitialisation mensuelle se fait maintenant automatiquement à chaque accès utilisateur, ou via une fonction Edge (voir section Automatisation).

### 3. Configurer l'authentification

1. Allez dans `Authentication > Settings`
2. Configurez les providers OAuth (Google, GitHub)
3. Ajoutez vos domaines autorisés dans `Site URL`

## 💳 Configuration Stripe

### 1. Créer les produits

Dans le dashboard Stripe :

```bash
# Créer le produit Pro
stripe products create \
  --name="Wipay Pro" \
  --description="100 QR codes par mois avec fonctionnalités avancées"

# Créer le prix Pro (récurrent)
stripe prices create \
  --product=prod_XXXXX \
  --unit-amount=999 \
  --currency=eur \
  --recurring[interval]=month

# Créer le produit Business
stripe products create \
  --name="Wipay Business" \
  --description="QR codes illimités avec API et analytics"

# Créer le prix Business (récurrent)
stripe prices create \
  --product=prod_YYYYY \
  --unit-amount=2999 \
  --currency=eur \
  --recurring[interval]=month
```

### 2. Configurer les webhooks

1. Dans Stripe Dashboard > Developers > Webhooks
2. Ajoutez un endpoint : `https://votre-domaine.com/api/webhooks/stripe`
3. Sélectionnez ces événements **ESSENTIELS** :
   - `customer.subscription.created` ✅ Nouvel abonnement
   - `customer.subscription.updated` ✅ Changement de plan
   - `customer.subscription.deleted` ✅ Annulation
   - `invoice.payment_succeeded` ✅ Paiement réussi
   - `invoice.payment_failed` ✅ Échec de paiement
4. Événements **OPTIONNELS** (recommandés) :
   - `customer.subscription.trial_will_end` 📧 Fin d'essai proche
   - `invoice.upcoming` 📧 Rappel de facturation
   - `customer.created` 📊 Analytics
5. Copiez le **Webhook Secret** : `whsec_...`

## 🔗 Webhooks Stripe - Guide détaillé

### Pourquoi ces webhooks sont importants ?

| Webhook                                | Priorité         | Description              | Action                       |
| -------------------------------------- | ---------------- | ------------------------ | ---------------------------- |
| `customer.subscription.created`        | 🔴 **CRITIQUE**  | Nouvel abonnement payant | Upgrade vers Pro/Business    |
| `customer.subscription.updated`        | 🔴 **CRITIQUE**  | Changement de plan       | Sync des limites             |
| `customer.subscription.deleted`        | 🔴 **CRITIQUE**  | Annulation d'abonnement  | Retour au plan gratuit       |
| `invoice.payment_succeeded`            | 🔴 **CRITIQUE**  | Paiement mensuel réussi  | Reset compteurs + activation |
| `invoice.payment_failed`               | 🟡 **IMPORTANT** | Échec de paiement        | Marquer comme "en retard"    |
| `customer.subscription.trial_will_end` | 🟢 **UTILE**     | Fin d'essai dans 3 jours | Email de rappel              |
| `invoice.upcoming`                     | 🟢 **UTILE**     | Facture dans 7 jours     | Email de rappel              |
| `customer.created`                     | 🔵 **ANALYTICS** | Nouveau client Stripe    | Tracking/métriques           |

### Test des webhooks en local

```bash
# Installer Stripe CLI
stripe listen --forward-to localhost:4321/api/webhooks/stripe

# Dans un autre terminal, tester un événement
stripe trigger customer.subscription.created
```

## 🌍 Variables d'environnement

Créez un fichier `.env` avec :

```env
# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
PUBLIC_APP_URL=http://localhost:4321
```

## 📁 Structure des fichiers créés

```
src/
├── lib/
│   ├── supabase.ts          # Configuration Supabase + types
│   └── stripe.ts            # Configuration Stripe + fonctions
├── pages/
│   ├── api/auth/
│   │   ├── signin.ts        # Connexion
│   │   ├── register.ts      # Inscription
│   │   ├── signout.ts       # Déconnexion
│   │   └── callback.ts      # Callback OAuth
│   ├── auth/
│   │   ├── signin.astro     # Page de connexion
│   │   └── register.astro   # Page d'inscription
│   └── dashboard.astro      # Dashboard utilisateur (à créer)
└── env.d.ts                 # Types TypeScript
```

## 🔐 Sécurité et authentification

### Middleware d'authentification

Créez `src/middleware.ts` :

```typescript
import { defineMiddleware } from "astro:middleware";
import { supabase } from "./lib/supabase";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  // Routes protégées
  const protectedRoutes = ["/dashboard", "/api/qr"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    url.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const accessToken = cookies.get("sb-access-token");
    const refreshToken = cookies.get("sb-refresh-token");

    if (!accessToken || !refreshToken) {
      return redirect("/auth/signin");
    }

    // Vérifier la validité du token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken.value);

    if (error || !user) {
      return redirect("/auth/signin");
    }

    // Ajouter l'utilisateur au contexte
    context.locals.user = user;
  }

  return next();
});
```

## 🎨 Modification du composant QR existant

Modifiez `src/components/QRPaymentGenerator.astro` pour intégrer l'authentification :

```typescript
// Au début du script
import {
  getUserProfile,
  canCreateQRCode,
  updateUserQRCodeUsage,
  saveQRCode,
} from "../lib/supabase";

// Dans la fonction de génération
const user = Astro.locals.user;
if (!user) {
  return redirect("/auth/signin");
}

const userProfile = await getUserProfile(user.id);
const canCreate = canCreateQRCode(
  userProfile.subscription_tier,
  userProfile.qr_codes_used_this_month
);

if (!canCreate) {
  // Afficher un message d'erreur ou rediriger vers l'upgrade
  return new Response("Limite atteinte", { status: 403 });
}

// Après génération réussie
await updateUserQRCodeUsage(user.id);
await saveQRCode({
  user_id: user.id,
  iban,
  amount: parseFloat(amount),
  communication,
  beneficiary,
  qr_data: qrData,
  custom_colors: {
    qr_color: qrColor,
    bg_color: bgColor,
    transparent: isTransparent,
  },
});
```

## 💰 Gestion des paiements

### Endpoint de création de session Stripe

Créez `src/pages/api/create-checkout-session.ts` :

```typescript
import type { APIRoute } from "astro";
import { createCheckoutSession } from "../../lib/stripe";
import { getUserProfile } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, redirect }) => {
  const { priceId } = await request.json();
  const user = Astro.locals.user;

  if (!user) {
    return new Response("Non autorisé", { status: 401 });
  }

  const userProfile = await getUserProfile(user.id);

  const session = await createCheckoutSession(
    priceId,
    userProfile.stripe_customer_id!,
    `${import.meta.env.PUBLIC_APP_URL}/dashboard?success=true`,
    `${import.meta.env.PUBLIC_APP_URL}/pricing?canceled=true`
  );

  return Response.json({ url: session.url });
};
```

### Webhook Stripe

Créez `src/pages/api/webhooks/stripe.ts` :

```typescript
import type { APIRoute } from "astro";
import { stripe } from "../../../lib/stripe";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      import.meta.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      const subscription = event.data.object;
      // Mettre à jour l'abonnement dans Supabase
      await updateSubscriptionInDatabase(subscription);
      break;

    case "customer.subscription.deleted":
      // Rétrograder vers le plan gratuit
      await downgradeToFree(event.data.object.customer);
      break;
  }

  return new Response("OK");
};
```

## 🎯 Prochaines étapes

1. **Créer le dashboard utilisateur** avec :

   - Statistiques d'utilisation
   - Historique des QR codes
   - Gestion de l'abonnement

2. **Ajouter une page de pricing** avec les plans

3. **Implémenter les limitations** selon les plans

4. **Ajouter des analytics** pour le plan Business

5. **Créer une API** pour les utilisateurs Business

## 🚀 Déploiement

1. **Vercel/Netlify** : Configurez les variables d'environnement
2. **Supabase** : Mettez à jour les URLs autorisées
3. **Stripe** : Configurez les webhooks en production

## 📊 Monitoring

- Utilisez Supabase Analytics pour les métriques de base
- Intégrez Stripe Dashboard pour les métriques de paiement
- Considérez Sentry pour le monitoring d'erreurs

## 🤖 Automatisation de la réinitialisation mensuelle

### Option 1 : Automatique à l'accès (Recommandé)

La fonction `auto_reset_if_needed()` vérifie et remet à zéro automatiquement les compteurs lors de chaque accès utilisateur. C'est la solution la plus simple et fiable.

### Option 2 : Fonction Edge Supabase + Cron externe

1. Déployez la fonction Edge fournie dans `supabase-edge-function.ts`
2. Configurez un cron job externe (GitHub Actions, Vercel Cron, etc.)
3. Appelez la fonction le 1er de chaque mois

### Option 3 : Activer pg_cron (si disponible)

Si votre plan Supabase le permet :

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('reset-monthly-usage', '0 0 1 * *', 'SELECT reset_monthly_usage();');
```

## 🔧 Maintenance

- Surveillez les limites d'usage
- Gérez les échecs de paiement
- Mettez à jour les prix selon le marché
- Analysez les métriques d'utilisation
- Vérifiez la réinitialisation mensuelle des compteurs

## ⚠️ Résolution des problèmes courants

### Erreur "schema cron does not exist"

✅ **Résolu** : Le script SQL a été mis à jour pour ne plus dépendre de pg_cron

### Compteurs non réinitialisés

- Vérifiez que la fonction `auto_reset_if_needed` est appelée
- Ou configurez la fonction Edge + cron externe

### Problèmes d'authentification OAuth

- Vérifiez les URLs de callback dans Supabase
- Configurez correctement les providers OAuth

---

**Note** : Ce guide fournit une base solide pour votre SaaS. Adaptez les fonctionnalités selon vos besoins spécifiques et votre marché cible.
