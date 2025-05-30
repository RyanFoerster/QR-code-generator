# 🏷️ Changement de nom : QR Generator → Wipay

## 📋 Résumé des modifications

L'application a été entièrement renommée de "QR Generator" vers **"Wipay"** pour une meilleure identité de marque.

## 🔄 Fichiers modifiés

### 📄 Pages principales

- `src/pages/dashboard.astro` - Titre de page
- `src/pages/pricing.astro` - Titre, header, footer
- `src/pages/auth/register.astro` - Titre et header
- `src/pages/auth/signin.astro` - Titre de page
- `src/pages/auth/success.astro` - Titre et header
- `src/pages/auth/confirm.astro` - Titre de page

### 🧩 Composants

- `src/components/Header.astro` - Logo et titre principal
- `src/components/QRPaymentGenerator.astro` - Titre principal et nom de fichier d'export

### 🎨 Layout et configuration

- `src/layouts/Layout.astro` - Titre par défaut
- `package.json` - Nom du package
- `supabase-schema.sql` - Commentaire d'en-tête

### 📚 Documentation

- `README.md` - Entièrement réécrit pour Wipay
- `WEBHOOKS-GUIDE.md` - Titre principal
- `MIGRATION-GUIDE-NOUVEAUX-PLANS.md` - Titre principal
- `SAAS-SETUP.md` - Noms des produits Stripe

## ✅ Éléments conservés

Les éléments suivants ont été **conservés** car ils décrivent la fonctionnalité :

- Références aux "QR codes" dans le contenu (descriptions, fonctionnalités)
- Nom du composant `QRPaymentGenerator` (décrit la fonction)
- Métadonnées techniques (`Astro.generator`)

## 🎯 Résultat final

- **Nom de l'application** : Wipay
- **Slogan** : "Générateur de QR codes de paiement"
- **Identité visuelle** : Conservée (gradient violet/rose)
- **Fonctionnalités** : Inchangées

## 🚀 Prochaines étapes recommandées

1. **Favicon personnalisé** : Créer un favicon spécifique à Wipay
2. **Logo SVG** : Remplacer l'icône générique par un logo Wipay
3. **Domaine** : Configurer un domaine personnalisé (ex: wipay.be)
4. **SEO** : Mettre à jour les métadonnées pour le référencement
5. **Stripe** : Mettre à jour les noms de produits dans le dashboard Stripe

---

**Wipay** est maintenant prêt avec sa nouvelle identité ! 🎉
