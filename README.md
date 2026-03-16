# 🧮 Calculateur PLV — Outil de Chiffrage

Application web de calcul de prix de revient pour la **PLV** (Publicité sur Lieu de Vente).
Permet de créer des devis en estimant les coûts de matière, impression, découpe, façonnage, conditionnement et accessoires.

## Fonctionnalités

- **Calculateur de devis** avec calcul d'imposition automatique (optimisation de la découpe sur plaque)
- **Impression** : recto/verso, vernis, aplat, surfaces d'impression avec estimation encre + main d'œuvre
- **Découpe**, **Façonnage**, **Conditionnement** : temps par pièce configurable avec calcul horaire
- **Accessoires & Consommables** : ajout au devis avec calcul de coût automatique
- **Dashboard Admin** : gestion CRUD des matières, types de PLV, accessoires, consommables, utilisateurs
- **Authentification** : login par email/mot de passe avec rôles (Admin / User)
- **Changement de mot de passe forcé** à la première connexion
- **Récapitulatif & Export** : récap du devis avec mode impression optimisé (CSS `@media print`)

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | [Next.js 16](https://nextjs.org/) (App Router) + React 19 |
| Langage | TypeScript 5 |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Base de données | PostgreSQL via [Prisma ORM](https://www.prisma.io/) |
| Authentification | [NextAuth.js v5](https://authjs.dev/) (Credentials provider) |
| Validation | [Zod](https://zod.dev/) |
| Tests | [Vitest](https://vitest.dev/) |
| Linting | ESLint + Prettier |

## Prérequis

- **Node.js** ≥ 18
- **PostgreSQL** (serveur local ou distant)
- **npm** ou **pnpm**

## Installation

```bash
# Cloner le repo
git clone <url-du-repo>
cd simple-calculator

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs (DATABASE_URL, NEXTAUTH_SECRET, etc.)

# Créer les tables et appliquer les migrations Prisma
npx prisma migrate dev

# Générer le client Prisma
npx prisma generate

# Optionnel : peupler la base avec des données de test
npx prisma db seed
```

## Variables d'environnement

Créer un fichier `.env` à la racine :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/kontfeel"
NEXTAUTH_SECRET="<secret-généré-avec-openssl-rand-base64-32>"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
```

> ⚠️ **Ne jamais commiter le fichier `.env`.** Utiliser `.env.example` comme template.

Pour générer un secret NextAuth :
```bash
openssl rand -base64 32
```

## Lancement

```bash
# Mode développement
npm run dev

# L'application sera disponible sur http://localhost:3000
```

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarrer en mode développement |
| `npm run build` | Build de production |
| `npm run start` | Démarrer le build de production |
| `npm run lint` | Lancer ESLint |
| `npm run test` | Lancer les tests (Vitest) |
| `npm run test:watch` | Tests en mode watch |
| `npm run format` | Formater le code (Prettier) |
| `npm run format:check` | Vérifier le formatage |

## Structure du projet

```
├── app/
│   ├── actions/           # Server actions (CRUD, auth, stats)
│   │   ├── admin.ts       # CRUD plaques, types de PLV, éléments
│   │   ├── accessories.ts # CRUD accessoires
│   │   ├── consumables.ts # CRUD consommables
│   │   ├── get-data.ts    # Lecture des données + création de devis
│   │   ├── auth.ts        # Action de login
│   │   └── stats.ts       # Statistiques dashboard
│   ├── calculator/        # Composant calculateur principal
│   │   ├── Calculator.tsx
│   │   ├── screens/       # Écrans (succès, récapitulatif)
│   │   ├── sections/      # Sections du formulaire
│   │   └── shared.tsx     # Composants partagés
│   ├── dashboard/         # Pages admin (matières, produits, devis...)
│   ├── login/             # Page de connexion
│   ├── change-password/   # Changement de mot de passe
│   ├── settings/          # Paramètres admin
│   ├── components/        # Composants spécifiques à l'app
│   └── lib/               # Actions utilisateur
├── components/ui/         # Composants shadcn/ui
├── hooks/
│   ├── useCalculator.ts   # Hook principal du calculateur
│   └── useCostCalculation.ts # Hook des calculs de coûts additionnels
├── lib/
│   ├── calculation/
│   │   └── imposition.ts  # Algorithme de calcul d'imposition
│   ├── auth-guard.ts      # Utilitaire de protection des routes (requireAuth, requireAdmin)
│   ├── cache.ts           # Utilitaire de gestion détaillée du cache (Next.js tags)
│   ├── constants.ts       # Constantes globales métiers et tarifs par défaut
│   ├── prisma.ts          # Client Prisma singleton
│   └── utils.ts           # Utilitaires (cn)
├── prisma/
│   ├── schema.prisma      # Schéma de la base de données
│   ├── migrations/        # Migrations DB
│   └── seed.ts            # Données initiales
├── types/
│   ├── calculator.ts      # Types métier du calculateur
│   └── next-auth.d.ts     # Augmentation des types NextAuth
├── __tests__/             # Tests unitaires
├── auth.ts                # Configuration NextAuth
├── auth.config.ts         # Callbacks et pages auth
└── middleware.ts           # Middleware de protection des routes
```

## Base de données

Le schéma Prisma comprend les modèles suivants :

- **User** — Utilisateurs avec rôles (ADMIN/USER) et gestion de mot de passe
- **Study** — Études / projets regroupant des devis
- **Quote** — Devis complets avec toutes les options de chiffrage
- **ProductType** — Types de PLV (présentoir de comptoir, de sol, etc.)
- **Element** — Éléments constitutifs d'un type de PLV
- **Plate** — Matières premières / plaques avec dimensions et coûts
- **Accessory** / **QuoteAccessory** — Accessoires avec relation many-to-many
- **Consumable** / **QuoteConsumable** — Consommables (rubans, colles, etc.)
- **QuoteElement** — Éléments spécifiques à un devis

## Authentification

- Provider: **Credentials** (email + mot de passe hashé avec bcrypt)
- Rôles: `ADMIN` (accès complet) et `USER` (calculateur + mes devis)
- Middleware de protection sur toutes les routes sauf `/login` et les assets
- Changement de mot de passe forcé à la première connexion

## Compte par défaut

Après le seed initial :
- **Email** : `admin@kontfeel.fr`
- **Mot de passe** : `admin` (changement obligatoire à la première connexion)

## Tests

```bash
# Lancer tous les tests
npm run test

# Mode watch
npm run test:watch
```

Les tests couvrent actuellement :
- Algorithme d'imposition (`calculateImposition`, `calculateQuote`)
- Actions serveur de lecture (mocks Prisma)

## Licence

Projet privé — tous droits réservés.
