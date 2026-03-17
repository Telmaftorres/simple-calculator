# Kontfeel Calculator V2
 
Application web de calcul de devis pour la PLV (Publicité sur Lieu de Vente), développée pour Kontfeel.
 
---
 
## 🛠 Stack technique
 
| Technologie | Version | Usage |
|---|---|---|
| **Next.js** | 15.x (nommé 16.1.6 dans package.json) | Framework Fullstack, App Router |
| **React** | 19.2.3 | UI |
| **Prisma** | 5.22 | ORM PostgreSQL |
| **Tailwind CSS** | 4 | Styles |
| **Shadcn/UI** | New-York style | Composants UI (Radix UI) |
| **Auth.js (next-auth)** | v5 beta.30 ⚠️ | Authentification (bêta en production) |
| **Vitest** | 4.0 | Tests unitaires |
| **TypeScript** | 5, strict mode | Typage |
| **bcryptjs** | 3.0 | Hashing mots de passe |
| **Zod** | v4 | Validation des données |
| **Sonner** | latest | Toasts notifications |
| **@react-pdf/renderer** | latest | Export PDF |
 
---
 
## 📂 Structure du projet
 
```
├── app/
│   ├── actions/
│   │   ├── admin.ts          # CRUD Plates, ProductTypes, Elements (requireAuth)
│   │   ├── accessories.ts    # CRUD Accessories (requireAuth — ouvert à tous, voulu)
│   │   ├── consumables.ts    # CRUD Consumables (requireAuth — ouvert à tous, voulu)
│   │   ├── get-data.ts       # Lectures + createQuote (Zod) + deleteQuote (vérif propriétaire)
│   │   ├── settings.ts       # Lecture/modification des constantes métier (getSettings, getSettingsMap, updateSetting)
│   │   ├── stats.ts          # Stats dashboard (USER voit son CA, ADMIN voit tout)
│   │   └── auth.ts           # Action de connexion (signIn)
│   ├── lib/
│   │   ├── user-actions.ts   # CRUD utilisateurs (requireAdmin sauf updatePassword)
│   │   └── cache.ts          # revalidateCache() centralisé
│   ├── calculator/
│   │   ├── calculator.tsx    # Composant principal ("Calculateur de ouf" — voulu par le patron)
│   │   ├── shared.tsx        # SectionDisplay, CostRow
│   │   ├── sections/         # SectionPresentation, SectionImpression, SectionAccessoires, RecapSidebar
│   │   └── screens/          # ScreenSuccess ("Et ouai mon pote !" — voulu), ScreenRecap (PDF react-pdf)
│   ├── components/
│   │   ├── QuotePDF.tsx      # Fiche technique PDF complète avec logo Kontfeel
│   │   ├── GaugeSlider.tsx   # Slider avec gradient configurable
│   │   ├── PlateVisualizer.tsx # Visualisation SVG de l'imposition
│   │   └── LogoutButton.tsx
│   ├── dashboard/
│   │   ├── layout.tsx        # Sidebar navigation (icônes différenciées)
│   │   ├── page.tsx          # Dashboard stats (filtré par utilisateur)
│   │   ├── my-quotes/        # Liste + suppression des devis utilisateur
│   │   ├── plates/           # CRUD matières
│   │   ├── products/         # CRUD types PLV + éléments
│   │   ├── accessories/      # CRUD accessoires
│   │   ├── consumables/      # CRUD consommables
│   │   └── formulas/         # Éditeur de formules flatWidth/flatHeight
│   ├── settings/
│   │   ├── calculator/       # Page admin pour modifier les constantes métier en DB
│   │   └── users/            # Gestion utilisateurs — protégée ADMIN
│   ├── login/                # Page de connexion
│   ├── change-password/      # Changement MDP obligatoire (First Login Policy)
│   └── page.tsx              # Page principale calculateur
├── hooks/
│   ├── useCalculator.ts      # Hook principal orchestrateur
│   ├── useCalculatorForm.ts  # useReducer pour état formulaire (22 useState → 1 reducer)
│   └── useCostCalculation.ts # Calculs de coûts (utilise settings DB avec fallback constants)
├── lib/
│   ├── auth-helpers.ts       # requireAuth() et requireAdmin() centralisés
│   ├── cache.ts              # revalidateCache() centralisé
│   ├── constants.ts          # Constantes métier (fallback si DB indisponible)
│   ├── prisma.ts             # Singleton PrismaClient
│   └── calculation/
│       └── imposition.ts     # Moteur de calepinage 2D (normal, rotated, mixed)
├── prisma/
│   ├── schema.prisma         # Modèle de données PostgreSQL
│   ├── seed.ts               # Données initiales (mot de passe via SEED_ADMIN_PASSWORD)
│   └── migrations/
│       ├── 20260219160255_init_postgresql/
│       ├── 20260219185510_add_user_roles/
│       ├── 20260219215712_cascade_delete_elements/
│       ├── 20260220161252_add_technical_params_to_quote/
│       ├── 20260316000001_add_consumable_table/
│       └── 20260316000002_add_settings_table/
├── scripts/
│   ├── seed-admin.js         # Création admin (mot de passe via SEED_ADMIN_PASSWORD)
│   └── seed-accessories.js   # Accessories de démo
├── types/
│   ├── calculator.ts         # Types métier (Pick<Prisma...> + interfaces)
│   └── next-auth.d.ts        # Module augmentation Auth.js (role typé 'ADMIN' | 'USER')
└── __tests__/
    ├── imposition.test.ts    # Tests moteur calepinage (12 tests)
    ├── costs.test.ts         # Tests calculs de coûts (20 tests)
    └── actions.test.ts       # Tests actions (2 tests)
```
 
---
 
## 💾 Modèle de données
 
```
Study (dossier client)
  └── Quote[] (devis)
        ├── ProductType (type PLV) → Element[]
        ├── Plate (matière/plaque)
        ├── QuoteAccessory[] → Accessory
        ├── QuoteConsumable[] → Consumable
        └── QuoteElement[]
 
User
  └── Quote[]
 
Setting (constantes métier modifiables)
```
 
**Règles métier :**
- `Consumable` = matériaux de façonnage vendus au mètre (ruban adhésif, scotch double face...). Champ `size` = taille totale du rouleau, `sizePerItem` = consommation par pièce.
- `Accessory`, `Plate`, `ProductType`, `Consumable` = créables par tous les utilisateurs connectés (voulu).
- `Setting` = constantes métier modifiables depuis l'interface admin sans redéploiement.
 
---
 
## 🔐 Authentification & Permissions
 
**Rôles :** `ADMIN` | `USER` (enum Prisma en MAJUSCULES — important)
 
| Action | USER connecté | ADMIN |
|---|---|---|
| Créer/modifier/supprimer accessoires | ✓ | ✓ |
| Créer/modifier/supprimer produits PLV | ✓ | ✓ |
| Créer/modifier/supprimer matières | ✓ | ✓ |
| Créer/modifier/supprimer consumables | ✓ | ✓ |
| Ses propres devis | ✓ | ✓ tous |
| Voir stats CA | Son propre CA ✓ | CA total ✓ |
| Modifier constantes métier | ✗ | ✓ |
| Gérer les utilisateurs | ✗ | ✓ |
| `/settings/*` | ✗ | ✓ |
| `/admin/*` | ✗ | ✓ |
 
**First Login Policy :** `mustChangePassword: true` à la création → redirection forcée vers `/change-password`.
 
---
 
## ⚙️ Installation
 
### Prérequis
- Node.js v18+
- PostgreSQL
 
### Étapes
 
```bash
# 1. Installer les dépendances
npm install
 
# 2. Configurer les variables d'environnement
cp .env.example .env
# Remplir DATABASE_URL, NEXTAUTH_SECRET et SEED_ADMIN_PASSWORD
 
# 3. Générer le client Prisma
npx prisma generate
 
# 4. Migrations
npx prisma migrate deploy
 
# 5. Créer la séquence PostgreSQL pour les références de devis
psql $DATABASE_URL -c "CREATE SEQUENCE IF NOT EXISTS quote_reference_seq START WITH 1000;"
 
# 6. Seed (données initiales + constantes métier)
npx prisma db seed
 
# 7. Lancer en dev
npm run dev
```
 
### Variables d'environnement requises
 
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kontfeel"
NEXTAUTH_SECRET="<générer avec openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
SEED_ADMIN_PASSWORD="<mot de passe fort>"
```
 
---
 
## 🧪 Tests
 
```bash
npm run test        # Vitest run (une fois)
npm run test:watch  # Vitest watch
npm run lint        # ESLint
npm run format      # Prettier
```
 
**Couverture actuelle : 34 tests, 34 passés ✅**
- Moteur d'imposition (`lib/calculation/imposition.ts`) : 12 tests ✓
- Calculs de coût (`hooks/useCostCalculation.ts`) : 20 tests ✓
- Actions : 2 tests ✓
 
---
 
## 🚀 Déploiement
 
**Infrastructure :**
- VPS OVH Ubuntu 24.04
- PM2 (id:0 = kontfeel-calculator port 3000, id:1 = webhook-server port 3001)
- PostgreSQL
- Nginx (reverse proxy HTTPS)
 
**Déploiement automatique :**
- Push sur `main` → GitHub webhook → port 3001 → `deploy.sh`
- Webhook configuré sur GitHub : Settings → Webhooks → `http://IP:3001/webhook`
- Secret webhook stocké dans `/home/ubuntu/webhook-secret.txt`
 
**Script `/home/ubuntu/deploy.sh` :**
```bash
#!/bin/bash
cd /home/ubuntu/kontfeel-calculator
git fetch origin main
git reset --hard origin/main
npm install
npx prisma generate
npm run build
npx prisma migrate deploy
pm2 restart kontfeel-calculator --update-env
```
 
**Séquence PostgreSQL** (à créer une fois sur chaque environnement) :
```bash
sudo -u postgres psql -c "CREATE SEQUENCE IF NOT EXISTS quote_reference_seq START WITH 1000;" kontfeel
```
 
**Tables créées manuellement sur le VPS** (migrations marquées comme appliquées via `prisma migrate resolve`) :
- `Consumable` + `QuoteConsumable` → migration `20260316000001`
- `Setting` → migration `20260316000002`
 
---
 
## 📋 Constantes métier (`Setting` en DB)
 
Modifiables depuis `/settings/calculator` sans redéploiement. Fallback sur `lib/constants.ts` si DB indisponible.
 
| Clé | Valeur par défaut | Description |
|---|---|---|
| `HOURLY_RATE_PRINT` | 65 €/h | Taux horaire impression et découpe |
| `HOURLY_RATE_ASSEMBLY` | 45 €/h | Taux horaire façonnage et conditionnement |
| `INK_COST_PER_LITER` | 40 €/L | Coût de l'encre |
| `INK_BASE_ML_PER_PLATE` | 20 ml | Volume d'encre de base par plaque |
| `PRINT_SETUP_TIME_MIN` | 15 min | Temps de calage impression |
| `CUTTING_SETUP_SECONDS` | 900 s | Temps de calage découpe (15 min) |
| `FINISHING_SURCHARGE_PERCENT` | 0.05 | Supplément par option (vernis, aplat) |
| `ASSEMBLY_NOTICE_COST_PER_PIECE` | 0.10 € | Coût notice de montage par pièce |
 
---
 
## ✅ Corrections effectuées (audit + roadmap mars 2026)
 
### Sécurité
- ✅ `NEXTAUTH_SECRET` régénéré, `.env` jamais commité
- ✅ Bug `'admin'` → `'ADMIN'` dans `app/page.tsx`
- ✅ `getUsers` et `deleteUser` sécurisés ADMIN only
- ✅ `deleteQuote` avec vérification propriétaire
- ✅ `getQuoteById` avec vérification propriétaire
- ✅ Confirmation avant suppression utilisateur
- ✅ `debug-quote.ts` supprimé
- ✅ Mot de passe seed via `SEED_ADMIN_PASSWORD`
- ✅ `lib/auth-helpers.ts` centralisé (`requireAuth`, `requireAdmin`)
- ✅ Routes `/settings/*` et `/admin/*` protégées dans `auth.config.ts`
- ✅ Validation `parseInt` dans `app/page.tsx`
- ✅ 0 vulnérabilités npm
 
### Corrections importantes
- ✅ Race condition `generateReference` → séquence PostgreSQL atomique
- ✅ Stats par utilisateur (USER voit son CA, ADMIN voit tout)
- ✅ Longueur minimale mots de passe unifiée à 8
- ✅ Validation Zod sur `createQuote`
- ✅ Singleton Prisma dans `dashboard/products/[id]/page.tsx`
- ✅ `lang="fr"` dans `app/layout.tsx`
- ✅ Feedback erreur création utilisateur
- ✅ Cache stats avec tags pour invalidation
- ✅ `lib/cache.ts` centralisé
 
### Qualité & refactoring
- ✅ `ImpositionResult` unifié via `extends`
- ✅ Orientation `mixed` implémentée dans le moteur d'imposition
- ✅ Tous les `alert()` remplacés par toasts Sonner
- ✅ Constantes métier extraites dans `lib/constants.ts` + table `Setting` en DB
- ✅ `role` typé `'ADMIN' | 'USER'` dans `types/next-auth.d.ts`
- ✅ Types Prisma via `Pick<Prisma...>` dans `types/calculator.ts`
- ✅ `lib/calculation/auth-guard.ts` supprimé (doublon)
- ✅ 22 `useState` → `useReducer` dans `useCalculatorForm.ts`
- ✅ Calculs de coût extraits dans `useCostCalculation.ts`
- ✅ Icône dupliquée corrigée dans sidebar
- ✅ Titre "Connexion Admin" → "Connexion"
 
### Tests
- ✅ 34 tests, 34 passés
- ✅ 20 nouveaux tests sur `useCostCalculation`
 
### Déploiement & infrastructure
- ✅ Déploiement automatique via webhook GitHub → VPS opérationnel
- ✅ `deploy.sh` corrigé (`git reset --hard`, `npx prisma generate`)
- ✅ Export PDF réel avec `@react-pdf/renderer` (téléchargement + aperçu)
- ✅ Tables `Consumable`, `QuoteConsumable`, `Setting` créées sur le VPS
- ✅ Page admin `/settings/calculator` pour modifier les constantes métier
 
---
 
 
© 2024-2026 Kontfeel — Tous droits réservés