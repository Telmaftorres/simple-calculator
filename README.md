Readme · MD
Copier

# Kontfeel Calculator V2
 
Application web de calcul de devis pour la PLV (Publicité sur Lieu de Vente), développée pour Kontfeel.
 
---
 
## 🛠 Stack technique
 
| Technologie | Version | Usage |
|---|---|---|
| **Next.js** | 15.x (nommé 16.1.6 dans package.json — à corriger) | Framework Fullstack, App Router |
| **React** | 19.2.3 | UI |
| **Prisma** | 5.22 | ORM PostgreSQL |
| **Tailwind CSS** | 4 | Styles |
| **Shadcn/UI** | New-York style | Composants UI (Radix UI) |
| **Auth.js (next-auth)** | v5 beta.30 ⚠️ | Authentification (bêta en production) |
| **Vitest** | 4.0 | Tests unitaires |
| **TypeScript** | 5, strict mode | Typage |
| **bcryptjs** | 3.0 | Hashing mots de passe |
| **Zod** | v4 | Validation des données |
 
---
 
## 📂 Structure du projet
 
```
├── app/
│   ├── actions/
│   │   ├── admin.ts          # CRUD Plates, ProductTypes, Elements (auth requise, PAS de vérif rôle ⚠️)
│   │   ├── accessories.ts    # CRUD Accessories (auth requise, ouvert à tous — voulu)
│   │   ├── consumables.ts    # CRUD Consumables (auth + ADMIN requis ✓)
│   │   ├── get-data.ts       # Lectures + createQuote + deleteQuote (⚠️ deleteQuote sans vérif propriétaire)
│   │   ├── stats.ts          # Stats dashboard (⚠️ CA total visible par tous — à filtrer par user)
│   │   └── auth.ts           # Action de connexion (signIn)
│   ├── lib/
│   │   └── user-actions.ts   # CRUD utilisateurs (⚠️ getUsers/deleteUser sans vérif rôle ADMIN)
│   ├── calculator/
│   │   ├── calculator.tsx    # Composant principal (⚠️ "Calculateur de ouf" à renommer)
│   │   ├── shared.tsx        # SectionDisplay, CostRow
│   │   ├── sections/         # SectionPresentation, SectionImpression, SectionAccessoires, RecapSidebar
│   │   └── screens/          # ScreenSuccess (⚠️ texte dev), ScreenRecap (PDF via window.print)
│   ├── components/
│   │   ├── GaugeSlider.tsx   # Slider avec gradient configurable
│   │   ├── PlateVisualizer.tsx # Visualisation SVG de l'imposition (⚠️ bug rotation + couleur hardcodée)
│   │   └── LogoutButton.tsx
│   ├── dashboard/
│   │   ├── layout.tsx        # Sidebar navigation (⚠️ FlaskConical dupliqué, Consommables non conditionné)
│   │   ├── page.tsx          # Dashboard stats (⚠️ cast role as string, CA total non filtré)
│   │   ├── my-quotes/        # Liste + suppression des devis utilisateur
│   │   ├── plates/           # CRUD matières
│   │   ├── products/         # CRUD types PLV + éléments (⚠️ [id]/page.tsx instancie new PrismaClient)
│   │   ├── accessories/      # CRUD accessoires
│   │   ├── consumables/      # CRUD consommables (admin)
│   │   └── formulas/         # Éditeur de formules flatWidth/flatHeight
│   ├── settings/
│   │   └── users/            # Gestion utilisateurs — protégée ADMIN côté page (⚠️ mais pas côté action)
│   ├── login/                # Page de connexion (⚠️ titre "Connexion Admin" à corriger)
│   ├── change-password/      # Changement MDP obligatoire (First Login Policy)
│   └── page.tsx              # Page principale calculateur (⚠️ bug isAdmin: 'admin' vs 'ADMIN')
├── hooks/
│   └── useCalculator.ts      # Hook principal 400 lignes, 22 useState (God Hook), 10 constantes hardcodées
├── lib/
│   ├── calculation/
│   │   └── imposition.ts     # Moteur de calepinage 2D (⚠️ orientation 'mixed' déclarée mais non implémentée)
│   └── prisma.ts             # Singleton PrismaClient (pattern correct)
├── prisma/
│   ├── schema.prisma         # Modèle de données PostgreSQL
│   └── seed.ts               # Données initiales (⚠️ mot de passe 'admin' hardcodé)
├── scripts/
│   ├── seed-admin.js         # Création admin (⚠️ mot de passe 'admin' hardcodé)
│   └── seed-accessories.js   # Accessories de démo
├── types/
│   ├── calculator.ts         # Types métier (⚠️ duplique les types Prisma + double ImpositionResult)
│   └── next-auth.d.ts        # Module augmentation Auth.js (correct)
├── components/ui/            # Composants Shadcn générés (ne pas modifier manuellement)
├── auth.ts                   # Config Auth.js credentials (⚠️ min(3) mots de passe, as any)
├── auth.config.ts            # Callbacks JWT/session, protection routes (⚠️ /admin/* non protégé)
└── middleware.ts             # Protection globale des routes
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
```
 
**Règles métier importantes :**
- `Consumable` = matériaux de façonnage vendus au mètre (ruban adhésif, scotch double face...). Champ `size` = taille totale du rouleau, `sizePerItem` = consommation par pièce.
- `Accessory` = accessoires PLV (grips magnétiques, crochets...) — créables par tous les utilisateurs connectés (voulu).
- `Plate` = formats de plaques matières (Akylux, PVC, EE...) — créables par tous les utilisateurs connectés (voulu).
- `ProductType` = types de PLV (présentoir de comptoir, de sol...) — créables par tous les utilisateurs connectés (voulu).
 
---
 
## 🔐 Authentification & Permissions
 
**Rôles :** `ADMIN` | `USER` (enum Prisma en MAJUSCULES — important)
 
**Règles d'accès :**
| Action | USER connecté | ADMIN |
|---|---|---|
| Créer/modifier/supprimer accessoires | ✓ voulu | ✓ |
| Créer/modifier/supprimer produits PLV | ✓ voulu | ✓ |
| Créer/modifier/supprimer matières | ✓ voulu | ✓ |
| Créer/modifier/supprimer consumables | ✗ ADMIN only | ✓ |
| Ses propres devis | ✓ | ✓ tous |
| Voir stats CA | Son propre CA (à implémenter) | CA total |
| Gérer les utilisateurs | ✗ | ✓ |
| `/settings/*` | ✗ | ✓ |
 
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
# Remplir DATABASE_URL et NEXTAUTH_SECRET (générer avec: openssl rand -base64 32)
 
# 3. Migrations et seed
npx prisma migrate dev
npx prisma db seed
 
# 4. Lancer en dev
npm run dev
```
 
### Variables d'environnement requises
 
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kontfeel"
NEXTAUTH_SECRET="<générer avec openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
SEED_ADMIN_PASSWORD="<mot de passe fort>"  # à implémenter dans seed.ts
```
 
---
 
## 🧪 Tests
 
```bash
npm run test        # Vitest run (une fois)
npm run test:watch  # Vitest watch
npm run lint        # ESLint
npm run format      # Prettier
```
 
**Couverture actuelle :**
- Moteur d'imposition (`lib/calculation/imposition.ts`) : ~80% ✓
- Calculs de coût (`useCalculator.ts`) : 0% ⚠️ à couvrir
- Server Actions : ~15% ⚠️
 
---
 
## 🚨 Backlog de corrections — audit complet (mars 2026)
 
> Un audit exhaustif a été réalisé sur l'ensemble du code. Voici les 29 points classés par priorité.
 
### 🔥 Urgence absolue
 
| # | Problème | Fichier(s) |
|---|---|---|
| 0a | **Régénérer NEXTAUTH_SECRET** — exposé publiquement sur GitHub | `.env` |
| 0b | **Purger `.env` de l'historique git** — `git rm --cached .env` | `.gitignore`, `.env` |
 
### 🔴 Priorité 1 — Sécurité fonctionnelle
 
| # | Problème | Fichier(s) |
|---|---|---|
| 1 | Bug `'admin'` → `'ADMIN'` — `isAdmin` toujours `false` en prod | `app/page.tsx` |
| 2 | `getUsers` et `deleteUser` sans vérification rôle ADMIN | `app/lib/user-actions.ts` |
| 3 | `deleteQuote` sans vérification de propriétaire | `app/actions/get-data.ts` |
| 4 | `getQuoteById` sans vérification de propriétaire | `app/actions/get-data.ts` |
| 5 | Suppression utilisateur sans dialog de confirmation | `app/settings/users/user-management.tsx` |
| 6 | Supprimer `debug-quote.ts` + purger `next-env.d.ts`, `*.tsbuildinfo` du git | racine |
| 7 | Mot de passe `'admin'` hardcodé dans les seeds | `prisma/seed.ts`, `scripts/seed-admin.js` |
| 8 | Créer `lib/auth-helpers.ts` — 3 implémentations différentes de `requireAuth` | tous les `actions/*.ts` |
 
### 🟠 Priorité 2 — Corrections importantes
 
| # | Problème | Fichier(s) |
|---|---|---|
| 9 | Race condition `generateReference` (`count() + 1` non atomique) | `app/actions/get-data.ts` |
| 10 | Stats CA : USER voit le total de tous au lieu de son propre CA | `app/actions/stats.ts`, `app/dashboard/page.tsx` |
| 11 | Longueur min mots de passe incohérente (3, 6 et 8 selon le fichier) | `auth.ts`, `login-form.tsx`, `user-actions.ts` |
| 12 | Aucune validation Zod sur `createQuote` | `app/actions/get-data.ts` |
| 13 | `new PrismaClient()` direct au lieu du singleton | `app/dashboard/products/[id]/page.tsx` |
| 14 | Lien Consommables dans sidebar non conditionné à `isAdmin` | `app/dashboard/layout.tsx` |
| 15 | `lang="en"` au lieu de `lang="fr"` | `app/layout.tsx` |
| 16 | Pas de feedback d'erreur dans le formulaire création utilisateur | `app/settings/users/user-management.tsx` |
| 17 | Cache stats sans tag → non invalidable après création/suppression devis | `app/actions/stats.ts` |
 
### 🟡 Priorité 3 — Qualité & cohérence
 
| # | Problème | Fichier(s) |
|---|---|---|
| 18 | Double définition de `ImpositionResult` — unifier via `extends` | `lib/calculation/imposition.ts`, `types/calculator.ts` |
| 19 | Remplacer tous les `alert()` par des toasts Sonner | `hooks/useCalculator.ts` + tous les `*-client.tsx` |
| 20 | 10 constantes métier hardcodées → extraire dans `lib/constants.ts` | `hooks/useCalculator.ts` |
| 21 | `role` typé `string` au lieu de `'ADMIN' \| 'USER'` | `types/next-auth.d.ts` |
| 22 | Types Prisma redéfinis manuellement dans `types/calculator.ts` | `types/calculator.ts` |
| 23 | Bug cohérence PlateVisualizer / orientation rotated | `app/components/PlateVisualizer.tsx` |
 
### 🟢 Priorité 4 — Polish & UX
 
| # | Problème | Fichier(s) |
|---|---|---|
| 24 | "Calculateur de ouf" et "Et ouai mon pote !" en prod | `calculator.tsx`, `ScreenSuccess.tsx` |
| 25 | Titre "Connexion Admin" → "Connexion" | `app/login/page.tsx` |
| 26 | Icône `FlaskConical` dupliquée dans la sidebar | `app/dashboard/layout.tsx` |
| 27 | Implémenter l'orientation `'mixed'` dans le moteur d'imposition | `lib/calculation/imposition.ts` |
| 28 | Tests sur les calculs de coût (0% de couverture) | nouveau `__tests__/costs.test.ts` |
| 29 | Export PDF réel (actuellement `window.print()`) | `app/calculator/screens/ScreenRecap.tsx` |
 
---
 
## 📈 Roadmap
 
- [ ] Corrections sécurité priorité 1 (semaine 1)
- [ ] Corrections importantes priorité 2 (semaine 2)
- [ ] `lib/auth-helpers.ts` centralisé
- [ ] Table `Settings` en DB pour les constantes métier (taux horaires, prix encre...)
- [ ] Export PDF réel (react-pdf ou endpoint serveur)
- [ ] Implémentation orientation `mixed` dans le calepinage
- [ ] Intégration ERP/Laravel via API REST
- [ ] SSO via Auth.js providers externes
 
---
 
© 2024-2026 Kontfeel — Tous droits réservés
