# 💳 Wipay - Générateur de QR Codes de Paiement

Wipay est une application SaaS moderne qui permet de générer facilement des QR codes pour les paiements bancaires instantanés en Belgique.

## ✨ Fonctionnalités

- 🎨 **Personnalisation avancée** : Couleurs, styles, formats d'export
- 💳 **Paiements sécurisés** : Intégration Stripe pour les abonnements
- 📱 **Interface moderne** : Design responsive avec Tailwind CSS
- 🔒 **Authentification** : Système complet avec Supabase Auth
- 📊 **Gestion des limites** : Système de quotas par plan d'abonnement
- 💾 **Historique** : Sauvegarde et réutilisation des QR codes générés

## 🚀 Plans disponibles

### Paiement Unique - 4,99€

- 1 QR code personnalisé
- Couleurs personnalisées
- Export PNG/SVG haute qualité
- Valide à vie

### Premium - 8,99€/mois

- QR codes illimités
- Toutes les personnalisations
- Historique complet
- Templates prédéfinis
- Support prioritaire
- API Access

## 🛠️ Technologies utilisées

- **Frontend** : Astro, TypeScript, Tailwind CSS
- **Backend** : Supabase (PostgreSQL, Auth, RLS)
- **Paiements** : Stripe
- **Déploiement** : Vercel/Netlify

## 📋 Installation

```bash
# Cloner le projet
git clone [repository-url]
cd wipay

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local

# Lancer le serveur de développement
npm run dev
```

## ⚙️ Configuration

1. **Supabase** : Créer un projet et configurer les tables (voir `supabase-schema.sql`)
2. **Stripe** : Configurer les produits et webhooks
3. **Variables d'environnement** : Renseigner toutes les clés API

## 📚 Documentation

- [Guide de migration des plans](MIGRATION-GUIDE-NOUVEAUX-PLANS.md)
- [Configuration des webhooks Stripe](WEBHOOKS-GUIDE.md)
- [Setup SaaS complet](SAAS-SETUP.md)

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

Ce projet est sous licence MIT.

---

**Wipay** - Simplifiez vos paiements avec des QR codes élégants 🎨

```sh
npm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
