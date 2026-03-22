# Kontfeel Calculator V2

Application web de calcul de devis pour la PLV (Publicité sur Lieu de Vente), développée pour Kontfeel.

---

## 🛠 Stack technique

| Technologie | Version | Usage |
|---|---|---|
| **Next.js** | 15.x | Framework Fullstack, App Router |
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

## 📐 Architecture générale

Le projet suit une architecture **fullstack Next.js App Router** avec une séparation claire entre :

- **Server Actions** (`app/actions/`) — toutes les opérations DB passent par des Server Actions Next.js, jamais exposées directement via API REST
- **Hooks React** (`hooks/`) — logique métier côté client encapsulée dans des hooks composables
- **Context React** (`app/calculator/context/`) — état global du calculateur partagé sans prop drilling
- **Types inférés** — les types TypeScript sont inférés depuis Prisma (`Prisma.QuoteGetPayload`) et depuis les objets eux-mêmes (`typeof initialFormState`), minimisant la maintenance manuelle

### Principe d'ajout d'un nouveau champ

Pour ajouter un champ au calculateur (ex : `hasGloss`), il suffit de modifier **5 fichiers** :

1. `prisma/schema.prisma` — ajouter la colonne + migration SQL
2. `lib/quote-schema.ts` — ajouter le champ Zod
3. `lib/quote-defaults.ts` — ajouter la valeur par défaut
4. `hooks/useCalculatorForm.ts` — ajouter dans `initialFormState`
5. `lib/calculation/costs.ts` — utiliser dans le calcul

Les fichiers `get-data.ts`, `types/calculator.ts` et `CalculatorContext.tsx` **ne sont jamais à modifier** lors de l'ajout d'un champ.

---

## 📂 Structure du projet
```
├── app/
│   ├── actions/
│   │   ├── admin.ts              # CRUD Plates, ProductTypes, Elements (requireAuth)
│   │   ├── accessories.ts        # CRUD Accessories (requireAuth — ouvert à tous, voulu)
│   │   ├── consumables.ts        # CRUD Consumables (requireAuth — ouvert à tous, voulu)
│   │   ├── get-data.ts           # Lectures + createQuote (Zod + buildQuoteData) + deleteQuote
│   │   ├── settings.ts           # Lecture/modification constantes métier
│   │   ├── stats.ts              # Stats dashboard (USER voit son CA, ADMIN voit tout)
│   │   └── auth.ts               # Action de connexion (signIn)
│   ├── lib/
│   │   └── user-actions.ts       # CRUD utilisateurs (requireAdmin sauf updatePassword)
│   ├── calculator/
│   │   ├── calculator.tsx
│   │   ├── shared.tsx
│   │   ├── context/
│   │   │   └── CalculatorContext.tsx
│   │   ├── sections/
│   │   │   ├── SectionPresentation.tsx
│   │   │   ├── SectionImpression.tsx
│   │   │   ├── SectionDecoupe.tsx
│   │   │   ├── SectionFaconnage.tsx
│   │   │   ├── SectionConditionnement.tsx
│   │   │   ├── SectionAccessoires.tsx
│   │   │   ├── SectionEmballage.tsx
│   │   │   └── RecapSidebar.tsx
│   │   └── screens/
│   │       ├── ScreenSuccess.tsx
│   │       └── ScreenRecap.tsx
│   ├── components/
│   │   ├── QuotePDF.tsx
│   │   ├── GaugeSlider.tsx
│   │   ├── PlateVisualizer.tsx
│   │   └── LogoutButton.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── my-quotes/
│   │   ├── plates/
│   │   ├── products/
│   │   ├── accessories/
│   │   ├── consumables/
│   │   └── formulas/
│   ├── settings/
│   │   ├── calculator/
│   │   └── users/
│   ├── login/
│   ├── change-password/
│   └── page.tsx
├── hooks/
│   ├── useCalculator.ts
│   └── useCalculatorForm.ts
├── lib/
│   ├── auth-helpers.ts
│   ├── cache.ts                  # revalidateCache() avec CacheTag typé
│   ├── constants.ts
│   ├── format.ts                 # formatTimeSeconds, formatMinutes
│   ├── quote-schema.ts
│   ├── quote-defaults.ts
│   ├── prisma.ts
│   └── calculation/
│       ├── imposition.ts         # Moteur calepinage 2D
│       └── costs.ts              # Calculs de coûts (ex useCostCalculation)
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│       ├── 20260219160255_init_postgresql/
│       ├── 20260219185510_add_user_roles/
│       ├── 20260219215712_cascade_delete_elements/
│       ├── 20260220161252_add_technical_params_to_quote/
│       ├── 20260316000001_add_consumable_table/
│       ├── 20260316000002_add_settings_table/
│       ├── 20260317000001_add_packaging_to_quote/
│       ├── 20260318000001_add_cascade_delete_quote_accessory/
│       ├── 20260320093909_remove_width_height_use_flatwidth/
│       └── 20260320000003_add_quote_reference_seq/
├── scripts/
│   ├── seed-admin.js
│   └── seed-accessories.js
├── types/
│   ├── calculator.ts
│   └── next-auth.d.ts
└── __tests__/
    ├── imposition.test.ts
    ├── costs.test.ts
    └── actions.test.ts
```

---

## 💾 Modèle de données
```
Study (dossier client)
  └── Quote[] (devis)
        ├── ProductType (type PLV) → Element[]
        ├── Plate (matière/plaque)
        ├── QuoteAccessory[] → Accessory   (onDelete: Cascade)
        ├── QuoteConsumable[] → Consumable (onDelete: Cascade)
        └── QuoteElement[]                 (onDelete: Cascade)

User
  └── Quote[]

Setting (constantes métier modifiables en DB)
```

**Règles métier :**
- `Consumable` = matériaux de façonnage vendus au mètre. `size` = taille totale du rouleau, `sizePerItem` = consommation par pièce.
- `Accessory`, `Plate`, `ProductType`, `Consumable` = créables par tous les utilisateurs connectés (voulu).
- `Setting` = constantes métier modifiables depuis l'interface admin sans redéploiement. Fallback sur `lib/constants.ts` si DB indisponible.
- Référence devis générée via une **séquence PostgreSQL atomique** (`quote_reference_seq`) pour éviter les doublons en concurrence.
- `flatWidth`/`flatHeight` = dimensions de l'objet à plat (objet déplié). Source de vérité unique pour les dimensions.

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

**First Login Policy :** `mustChangePassword: true` à la création → redirection forcée vers `/change-password`. Le changement de mot de passe initial ne demande pas l'ancien mot de passe.

**Limitations connues Auth.js v5 beta :**
- Le rôle est stocké dans le JWT à la connexion. Si le rôle est modifié en DB, l'utilisateur doit se reconnecter pour que le changement prenne effet.

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

# 4. Migrations (crée aussi la séquence quote_reference_seq)
npx prisma migrate deploy

# 5. Seed (données initiales + constantes métier)
npx prisma db seed

# 6. Lancer en dev
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

## 🧮 Moteur de calcul

### Imposition (calepinage 2D)

Le moteur `lib/calculation/imposition.ts` calcule automatiquement le meilleur placement des poses sur une plaque :

- **Mode normal** : pose dans le sens original
- **Mode rotated** : pose pivotée à 90°
- **Mode mixed** : combinaison des deux orientations pour maximiser le nombre de poses par plaque

L'espacement entre les poses est configurable via le setting `POSE_SPACING_MM` (défaut : 10 mm).

### Calcul des coûts

Tous les calculs sont centralisés dans `lib/calculation/costs.ts` et utilisent les constantes depuis la DB (`Setting`) avec fallback sur `lib/constants.ts` :

| Poste | Formule |
|---|---|
| **Matière** | `plaquesNécessaires × coût/plaque` |
| **Impression (encre)** | `(nb_plaques × encre_base_ml × % imprimé / 1000) × multiplicateur_rv × coût/L × (1 + surcharges_finitions)` |
| **Impression (temps machine)** | `surface_plaque_m² × min/m² × multiplicateur_rv × nb_plaques × taux_horaire` |
| **Calage impression** | `calage_min / 60 × taux_horaire` (si activé) |
| **Découpe (temps machine)** | `temps_par_pose_sec × quantité / 3600 × taux_horaire` |
| **Calage découpe** | `calage_min / 60 × taux_horaire` (si activé) |
| **Façonnage** | `temps_par_pce_sec × quantité / 3600 × taux_horaire_façonnage` |
| **Conditionnement** | `temps_par_pce_sec × quantité / 3600 × taux_horaire_façonnage + notices` |
| **Accessoires** | `Σ (prix × quantité)` |
| **Consommables** | `Σ (sizePerItem × quantité / size_rouleau × prix_rouleau)` |
| **Emballage** | `plaques_carton × coût_plaque + (temps_découpe_sec × quantité / 60 + calage_min) / 60 × taux_horaire_emballage` |

### Sections du calculateur

| Section | Toggle | État par défaut |
|---|---|---|
| Impression | ✓ | ON |
| Découpe | — | toujours actif |
| Façonnage | ✓ | ON |
| Conditionnement | ✓ | ON |
| Accessoires | ✓ | OFF |
| Emballage | ✓ | OFF |

---

## 📋 Constantes métier (`Setting` en DB)

Modifiables depuis `/settings/calculator` sans redéploiement.

| Clé | Valeur par défaut | Description |
|---|---|---|
| `HOURLY_RATE_PRINT` | 65 €/h | Taux horaire impression et découpe |
| `PRINT_SETUP_TIME_MIN` | 15 min | Calage impression |
| `PRINT_SPEED_PRODUCTION` | 1 min/m² | Temps machine mode Production |
| `PRINT_SPEED_QUALITY` | 2 min/m² | Temps machine mode Qualité |
| `INK_COST_PER_LITER` | 95 €/L | Coût de l'encre |
| `INK_BASE_ML_PER_PLATE` | 20 ml | Volume d'encre de base par plaque |
| `FINISHING_SURCHARGE_PERCENT` | 0.05 | Supplément par option (vernis, aplat) |
| `CUTTING_SETUP_MINUTES` | 15 min | Calage découpe |
| `HOURLY_RATE_ASSEMBLY` | 45 €/h | Taux horaire façonnage et conditionnement |
| `ASSEMBLY_NOTICE_COST_PER_PIECE` | 0.10 €/pce | Coût notice de montage par pièce |
| `POSE_SPACING_MM` | 10 mm | Espacement entre poses (imposition) |
| `HOURLY_RATE_PACKAGING` | 45 €/h | Taux horaire emballage |
| `PACKAGING_SETUP_MINUTES` | 15 min | Calage emballage |
| `MARGIN_*` | 0 % | Marges commerciales par poste (non fonctionnelles — à venir) |

---

## 🧪 Tests
```bash
npm run test        # Vitest run (une fois)
npm run test:watch  # Vitest watch
npm run lint        # ESLint
npm run format      # Prettier
```

**Couverture actuelle : 33 tests, 33 passés ✅**
- Moteur d'imposition (`lib/calculation/imposition.ts`) : 7 tests ✓
- Calculs de coût (`lib/calculation/costs.ts`) : 24 tests ✓
- Actions : 2 tests ✓

---

## 🚀 Déploiement

**Infrastructure :**
- VPS OVH Ubuntu 24.04
- PM2 (id:0 = kontfeel-calculator port 3000, id:1 = webhook-server port 3001)
- PostgreSQL
- Nginx (reverse proxy HTTPS + rate limiting login)
- Let's Encrypt (SSL)

**URL de production :** `calculateur-kontfeel.tech`

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

**Workflow Git :**
```bash
# Développement sur dev
git add .
git commit -m "feat: description"
git push origin dev

# Mise en production
git checkout main
git merge dev
git push origin main  # déclenche le déploiement automatique
git checkout dev
```

**Configuration Nginx — rate limiting login :**
```nginx
# Dans le bloc http de /etc/nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;

# Dans /etc/nginx/sites-available/default
location /api/auth {
    limit_req zone=login burst=5 nodelay;
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

**Après chaque ajout de settings en DB (seed) :**
```bash
rm -rf .next/cache
pm2 restart kontfeel-calculator --update-env
```

---

## ✅ Corrections effectuées (audit mars 2026)

### Sprint 1 — Bugs actifs
- ✅ `INK_COST_PER_LITER` aligné à 95 €/L (fallback = DB)
- ✅ `revalidateCache('quotes')` déplacé après `prisma.quote.create()`
- ✅ Race condition `Study` → `prisma.study.upsert()`
- ✅ Division par zéro consommables protégée (`item.size <= 0`)
- ✅ `onDelete: Cascade` ajouté sur `QuoteAccessory`
- ✅ Migration `20260316000001` corrigée (`ADD CONSTRAINT IF NOT EXISTS` invalide)
- ✅ Colonnes orphelines supprimées (`cuttingMinutes`, `assemblySeconds`, `packSeconds`)
- ✅ `ASSEMBLY_NOTICE_COST_PER_PIECE` dans `getPackDetails` → utilise `settings`
- ✅ `unstable_cache` sorti de `getDashboardStats` — cache effectif
- ✅ `revalidateCache('settings')` ajouté dans `updateSetting`
- ✅ Séquence `quote_reference_seq` ajoutée dans les migrations
- ✅ Tests corrigés : `CUTTING_SETUP_SECONDS` → `CUTTING_SETUP_MINUTES`, `defaultParams` complet

### Sprint 2 — Sécurité
- ✅ Emails utilisateurs supprimés des logs `auth.ts`
- ✅ `requireAuth`/`requireAdmin` → `redirect('/login')` au lieu de `throw`
- ✅ Validation numérique sur `updateSetting` (Zod refine)
- ✅ `updateElement`/`deleteElement` → vérification appartenance `productTypeId`
- ✅ `updatePassword` (premier login) séparée de `updatePasswordWithVerification` (profil)
- ✅ Erreurs Prisma masquées côté client dans `handleSave`
- ✅ Matcher assets statiques corrigé dans `proxy.ts`
- ✅ Rate limiting Nginx configuré sur `/api/auth` (10 req/min par IP)

### Sprint 3 — Architecture & dette
- ✅ `useCostCalculation` → `calculateCosts` dans `lib/calculation/costs.ts`
- ✅ Action `LOAD_QUOTE` dans le reducer — 26 re-renders → 1
- ✅ `formatTimeSeconds`/`formatMinutes` → `lib/format.ts`
- ✅ Deux fichiers `cache.ts` consolidés avec type `CacheTag` typé
- ✅ `calculateQuote` supprimée (doublon inutilisé)
- ✅ `role` non-optionnel dans `next-auth.d.ts`
- ✅ `getConsumables`/`getAccessories` mis en cache
- ✅ `width`/`height` supprimés — `flatWidth`/`flatHeight` source de vérité unique
- ✅ Couverture de tests améliorée — 33 tests passés ✅

### Corrections antérieures (sprint mars 2026)
- ✅ `NEXTAUTH_SECRET` régénéré, `.env` jamais commité
- ✅ Bug `'admin'` → `'ADMIN'` dans `app/page.tsx`
- ✅ `getUsers` et `deleteUser` sécurisés ADMIN only
- ✅ `deleteQuote` avec vérification propriétaire
- ✅ `getQuoteById` avec vérification propriétaire
- ✅ Confirmation avant suppression utilisateur
- ✅ `debug-quote.ts` supprimé
- ✅ Mot de passe seed via `SEED_ADMIN_PASSWORD`
- ✅ Routes `/settings/*` et `/admin/*` protégées dans `auth.config.ts`
- ✅ Race condition `generateReference` → séquence PostgreSQL atomique
- ✅ Stats par utilisateur (USER voit son CA, ADMIN voit tout)
- ✅ Validation Zod sur `createQuote`
- ✅ Export PDF réel avec `@react-pdf/renderer`
- ✅ Page admin `/settings/calculator` pour modifier les constantes métier
- ✅ Context React global — suppression du prop drilling
- ✅ 22 `useState` → `useReducer` dans `useCalculatorForm.ts`
- ✅ Déploiement automatique via webhook GitHub → VPS opérationnel

---

## 🗺 Roadmap (à venir)

- [ ] Révocation session JWT si rôle change en base — limitation connue : le rôle est stocké dans le JWT à la connexion et ne se met pas à jour tant que l'utilisateur ne se reconnecte pas. Solution envisagée : passer à une stratégie de session DB dans Auth.js v5.
- [ ] Historique & comparaison de devis
- [ ] Export Excel
- [ ] Marge commerciale configurable (structure prévue, non fonctionnelle)
- [ ] Dashboard analytique avancé (graphiques CA, produits top)
- [ ] UX mobile (sidebar cachée sans alternative)

---

© 2024-2026 Kontfeel — Tous droits réservés