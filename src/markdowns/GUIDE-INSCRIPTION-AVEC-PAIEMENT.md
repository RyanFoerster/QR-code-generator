# 🚀 Guide : Inscription avec Paiement Intégré

## 📋 Vue d'ensemble

J'ai créé un système d'inscription complet qui intègre le choix du plan et le paiement **avant** de donner accès à l'application. Voici comment cela fonctionne :

### 🔄 Flux utilisateur

1. **Étape 1** : Saisie des informations (email, mot de passe)
2. **Étape 2** : Choix du plan (Paiement Unique 4,99€ ou Premium 8,99€/mois)
3. **Étape 3** : Paiement sécurisé via Stripe
4. **Redirection** : Page de succès puis accès au dashboard

## 🗂️ Fichiers créés/modifiés

### ✅ Nouveaux fichiers :

- `src/pages/auth/register.astro` - Page d'inscription en 3 étapes
- `src/pages/api/auth/signup.ts` - API pour créer le compte utilisateur
- `src/pages/api/create-checkout-session.ts` - API pour créer les sessions Stripe
- `src/pages/auth/success.astro` - Page de confirmation après paiement

### ✅ Fichiers modifiés :

- `src/components/QRPaymentGenerator.astro` - Correction des messages d'erreur
- `src/lib/stripe-config.ts` - Configuration des plans
- `supabase-migration-new-plans.sql` - Migration base de données

## 🛠️ Configuration requise

### 1. Variables d'environnement

Ajoutez ces variables à votre `.env` :

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
PUBLIC_APP_URL=http://localhost:4321
```

### 2. Configuration Stripe

#### A. Créer les produits dans Stripe Dashboard :

```bash
# 1. Produit pour paiement unique
stripe products create \
  --name="QR Code Unique" \
  --description="1 QR code personnalisé - Paiement unique"

# 2. Produit pour abonnement premium
stripe products create \
  --name="QR Premium" \
  --description="QR codes illimités - Abonnement mensuel"
```

#### B. Créer les prix :

```bash
# Prix pour paiement unique (4,99€)
stripe prices create \
  --product=prod_XXXXX \
  --unit-amount=499 \
  --currency=eur

# Prix pour abonnement premium (8,99€/mois)
stripe prices create \
  --product=prod_YYYYY \
  --unit-amount=899 \
  --currency=eur \
  --recurring[interval]=month
```

#### C. Configurer les webhooks :

URL webhook : `https://votre-domaine.com/api/webhooks/stripe`

Événements à écouter :

- `checkout.session.completed`
- `payment_intent.succeeded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 3. Base de données Supabase

Exécutez le script `supabase-migration-new-plans.sql` dans votre SQL Editor Supabase.

## 🎯 Fonctionnalités

### ✨ Page d'inscription (`/auth/register`)

**Étape 1 - Informations utilisateur :**

- Email et mot de passe
- Confirmation du mot de passe
- Acceptation des conditions

**Étape 2 - Choix du plan :**

- Plan Unique : 4,99€ pour 1 QR code
- Plan Premium : 8,99€/mois pour QR codes illimités
- Sélection visuelle avec indicateurs

**Étape 3 - Paiement :**

- Récapitulatif de la commande
- Redirection vers Stripe Checkout
- Paiement sécurisé

### 🔐 Sécurité

1. **Validation côté client et serveur**
2. **Création du compte AVANT le paiement**
3. **Activation du plan APRÈS paiement confirmé**
4. **Gestion des erreurs et des échecs de paiement**

### 📱 Responsive

- Interface adaptée mobile/desktop
- Animations fluides
- Indicateurs de progression
- Messages d'erreur clairs

## 🔧 APIs créées

### `POST /api/auth/signup`

Crée un compte utilisateur avec Supabase Auth.

**Body :**

```json
{
  "email": "user@example.com",
  "password": "motdepasse123"
}
```

**Réponse :**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailConfirmed": false
  }
}
```

### `POST /api/create-checkout-session`

Crée une session de paiement Stripe.

**Body :**

```json
{
  "planType": "one_time",
  "userEmail": "user@example.com",
  "userId": "uuid"
}
```

**Réponse :**

```json
{
  "success": true,
  "sessionId": "cs_...",
  "sessionUrl": "https://checkout.stripe.com/...",
  "customerId": "cus_..."
}
```

## 🎨 Interface utilisateur

### Design moderne avec :

- **Glassmorphism** : Effets de transparence et flou
- **Gradients** : Couleurs purple/pink cohérentes
- **Animations** : Transitions fluides entre étapes
- **Feedback visuel** : États de chargement et erreurs
- **Accessibilité** : Focus states et navigation clavier

### Responsive :

- **Mobile-first** : Optimisé pour tous les écrans
- **Touch-friendly** : Boutons adaptés au tactile
- **Progressive enhancement** : Fonctionne sans JavaScript

## 🚦 Gestion des états

### États possibles :

1. **Inscription en cours** : Formulaire actif
2. **Choix du plan** : Sélection visuelle
3. **Paiement en cours** : Redirection Stripe
4. **Paiement réussi** : Activation du plan
5. **Paiement échoué** : Gestion d'erreur

### Gestion d'erreurs :

- **Validation formulaire** : Messages en temps réel
- **Erreurs Stripe** : Messages utilisateur clairs
- **Erreurs serveur** : Fallbacks et retry
- **Timeouts** : Gestion des délais

## 📊 Avantages du nouveau système

### ✅ Pour l'utilisateur :

- **Processus fluide** : Tout en une seule session
- **Paiement sécurisé** : Via Stripe (leader du marché)
- **Accès immédiat** : Après paiement confirmé
- **Transparence** : Prix et fonctionnalités clairs

### ✅ Pour vous :

- **Conversion optimisée** : Moins d'abandon
- **Paiements garantis** : Avant accès à l'app
- **Gestion simplifiée** : Automatisation complète
- **Évolutivité** : Facile d'ajouter de nouveaux plans

## 🔄 Prochaines étapes

### 1. **Tests en développement**

```bash
# Démarrer le serveur
npm run dev

# Tester l'inscription
# Aller sur http://localhost:4321/auth/register
```

### 2. **Configuration Stripe**

- Créer les produits et prix
- Configurer les webhooks
- Tester avec des cartes de test

### 3. **Migration base de données**

- Exécuter le script SQL
- Vérifier les nouvelles fonctions
- Tester les activations de plans

### 4. **Déploiement**

- Variables d'environnement production
- URLs de redirection Stripe
- Tests de bout en bout

## 🆘 Dépannage

### Problèmes courants :

**Erreur "Plan invalide" :**

- Vérifiez `STRIPE_PLANS` dans `stripe-config.ts`
- Assurez-vous que les Price IDs sont corrects

**Erreur d'activation du plan :**

- Vérifiez que les fonctions SQL sont créées
- Consultez les logs Supabase

**Redirection échouée :**

- Vérifiez `PUBLIC_APP_URL`
- Assurez-vous que les URLs de succès/annulation sont correctes

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs** dans la console navigateur
2. **Consultez les logs Stripe** dans le dashboard
3. **Vérifiez les logs Supabase** dans l'interface admin
4. **Testez avec des données de test** avant la production

---

**🎉 Félicitations !** Vous avez maintenant un système d'inscription complet avec paiement intégré qui garantit que seuls les utilisateurs ayant payé peuvent accéder à votre application.
