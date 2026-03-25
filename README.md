# Kontfeel Calculator V2

Application web de calcul de devis pour la PLV (Publicité sur Lieu de Vente), développée pour Kontfeel.

> **Note :** Le ton informel dans l'interface (« Coucou », tutoiement) est volontaire — c'est un outil interne à l'entreprise avec une ambiance décontractée.

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

Les fichiers `get-data.ts`, `types/calculator.ts`, `CalculatorContext.tsx`, `QuotePDF.tsx` et `ScreenRecap.tsx` **ne sont jamais à modifier** lors de l'ajout d'un champ.

Pour ajouter un nouveau **poste de coût** dans le récapitulatif et le PDF, modifier uniquement `lib/quote-cost-rows.ts`.

### Architecture des données de calcul

#### `costResult` — source de vérité unique

`calculateCosts()` retourne un objet `costResult` complet. Cet objet est calculé **une seule fois** dans `useCalculator`, puis exposé via le contexte. Tous les composants (`ScreenRecap`, `QuotePDF`) le consomment directement — personne ne reconstruit les coûts manuellement.
```
calculateCosts() → costResult
      ↓
useCalculator (expose costResult dans le return)
      ↓
CalculatorContext (inféré automatiquement — zéro maintenance)
      ↓
ScreenRecap / QuotePDF (consomment costResult directement)
```

#### `QuotePDF` — props groupées

`QuotePDF` ne reçoit plus de longue liste de props unitaires. Il reçoit 7 objets groupés :

| Prop | Contenu |
|---|---|
| `quoteInfo` | studyNumber, reference, productName, quantity |
| `formValues` | tout le `formState` du calculateur |
| `costResult` | tout ce que retourne `calculateCosts()` |
| `selectedPlate` | la plaque sélectionnée |
| `impositionResult` | résultat du calepinage |
| `selectedAccessories` | accessoires sélectionnés |
| `selectedConsumables` | consommables sélectionnés |

Ajouter un nouveau champ au calculateur n'impacte plus `QuotePDF` — il suffit d'utiliser `formValues.monChamp` dans le JSX.

#### Invalidation cache factorisée

`lib/cache.ts` expose `revalidateEntity()` qui regroupe `revalidateCache()` + `revalidatePath()` en un seul appel :
```typescript
// Avant — 3 lignes répétées dans chaque action
revalidatePath('/dashboard/plates')
revalidatePath('/')
revalidateCache('plates')

// Après — 1 ligne
revalidateEntity('plates', '/dashboard/plates', '/')
```

---

## 📂 Structure du projet
```
├── app/
│   ├── actions/
│   │   ├── admin.ts              # CRUD Plates, ProductTypes, Elements (requireAuth)
│   │   ├── accessories.ts        # CRUD Accessories (requireAuth — ouvert à tous, voulu)
│   │   ├── consumables.ts        # CRUD Consumables (requireAuth — ouvert à tous, voulu)
│   │   ├── user-actions.ts       # CRUD utilisateurs (requireAdmin sauf updatePassword)
│   │   ├── get-data.ts           # Lectures + createQuote (Zod + buildQuoteData) + deleteQuote
│   │   ├── settings.ts           # Lecture/modification constantes métier
│   │   ├── stats.ts              # Stats dashboard (USER voit son CA, ADMIN voit tout)
│   │   └── auth.ts               # Action de connexion (signIn)
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
├── components/
│   ├── ui/                       # Composants shadcn/ui
│   ├── QuotePDF.tsx              # Props groupées : quoteInfo, formValues, costResult
│   ├── GaugeSlider.tsx
│   ├── PlateVisualizer.tsx
│   ├── LogoutButton.tsx
│   └── MobileSidebar.tsx         # Navigation mobile
├── hooks/
│   ├── useCalculator.ts          # Expose costResult complet via le contexte
│   └── useCalculatorForm.ts
├── lib/
│   ├── auth-helpers.ts
│   ├── cache.ts                  # revalidateCache() + revalidateEntity() avec CacheTag typé
│   ├── constants.ts
│   ├── format.ts                 # formatCuttingDetails, formatAssemblyDetails, formatPackDetails
│   ├── quote-schema.ts
│   ├── quote-defaults.ts
│   ├── quote-cost-rows.ts        # buildCostRows() — lignes coûts partagées ScreenRecap + PDF
│   ├── prisma.ts
│   └── calculation/
│       ├── imposition.ts         # Moteur calepinage 2D
│       └── costs.ts              # Calculs de coûts — retourne assemblyNoticeCostPerPiece résolu
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
│       ├── 20260320000003_add_quote_reference_seq/
│       ├── 20260323000001_ink_ml_and_finishing_percent/
│       ├── 20260323000002_split_ink_costs/
│       ├── 20260323150147_ink_ml_and_finishing_percent/
│       └── 20260324000001_fix_quote_sequence/
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
> 🛡️ **Note de sécurité (Audit) :** Il est parfaitement normal et **voulu** que TOUS les utilisateurs identifiés puissent effectuer des opérations CRUD complètes (Créer, Modifier, Supprimer) sur l'ensemble de la base de données métier (Matières, Modèles PLV, Éléments, Accessoires, Consommables). Les Server Actions correspondantes n'ont volontairement pas de `requireAdmin()`. Ce n'est **pas** une faille.

- `Consumable` = matériaux de façonnage vendus au mètre. `size` = taille totale du rouleau, `sizePerItem` = consommation par pièce.
- `Accessory`, `Plate`, `ProductType`, `Consumable` = créables par tous les utilisateurs connectés.
- `Setting` = constantes métier modifiables depuis l'interface admin sans redéploiement. Fallback sur `lib/constants.ts` si DB indisponible.
- Référence devis générée via une **séquence PostgreSQL atomique** (`quote_reference_seq`, START WITH 1) pour éviter les doublons en concurrence.
- `flatWidth`/`flatHeight` = dimensions de l'objet à plat (objet déplié). Source de vérité unique pour les dimensions.
- `inkMlPerPlate` = volume total d'encre par plaque en ml (0–100). La part revenant au vernis et à l'aplat est calculée via `varnishSurfacePercent` et `flatColorSurfacePercent` (0–100%).

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

Tous les calculs sont centralisés dans `lib/calculation/costs.ts` et utilisent les constantes depuis la DB (`Setting`) avec fallback sur `lib/constants.ts`. La fonction retourne un objet `costResult` complet, incluant `assemblyNoticeCostPerPiece` résolu (plus besoin de le recalculer en dehors).

| Poste | Formule |
|---|---|
| **Matière** | `plaquesNécessaires × coût/plaque` |
| **Impression (encre standard)** | `(inkMlPerPlate × standardRatio × nb_plaques × multiplicateur_rv / 1000) × INK_COST_PER_LITER` |
| **Impression (encre vernis)** | `(inkMlPerPlate × varnishRatio × nb_plaques × multiplicateur_rv / 1000) × INK_COST_VARNISH_PER_LITER` |
| **Impression (encre blanc)** | `(inkMlPerPlate × flatColorRatio × nb_plaques × multiplicateur_rv / 1000) × INK_COST_FLAT_COLOR_PER_LITER` |
| **Impression (temps machine)** | `surface_plaque_m² × min/m² × multiplicateur_rv × nb_plaques × taux_horaire` |
| **Calage impression** | `calage_min / 60 × taux_horaire` (si activé) |
| **Découpe (temps machine)** | `temps_par_pose_sec × quantité / 3600 × taux_horaire` |
| **Calage découpe** | `calage_min / 60 × taux_horaire` (si activé) |
| **Façonnage** | `temps_par_pce_sec × quantité / 3600 × taux_horaire_façonnage` |
| **Conditionnement** | `temps_par_pce_sec × quantité / 3600 × taux_horaire_façonnage + notices` |
| **Accessoires** | `Σ (prix × quantité)` |
| **Consommables** | `Σ (sizePerItem × quantité / size_rouleau × prix_rouleau)` |
| **Emballage** | `plaques_carton × coût_plaque + (temps_découpe_sec × quantité / 60 + calage_min) / 60 × taux_horaire_emballage` |

**Logique encre :**
- `inkMlPerPlate` = volume total par plaque (saisi par l'utilisateur, 0–100 ml)
- `standardRatio = max(0, 1 - varnishRatio - flatColorRatio)`
- Le volume total est toujours conservé, réparti entre les trois encres selon les pourcentages de finitions

### Sections du calculateur

| Section | Toggle | État par défaut |
|---|---|---|
| Impression | ✓ | ON |
| Découpe | — | toujours actif |
| Façonnage | ✓ | ON |
| Conditionnement | ✓ | ON |
| Accessoires | ✓ | OFF |
| Emballage | ✓ | OFF |

Le calage impression et le calage découpe sont chacun activables/désactivables indépendamment.

---

## 📋 Constantes métier (`Setting` en DB)

Modifiables depuis `/settings/calculator` sans redéploiement. Chaque constante dispose d'un panneau dépliable "Voir le calcul" avec formule et exemple chiffré.

| Clé | Valeur par défaut | Description |
|---|---|---|
| `HOURLY_RATE_PRINT` | 65 €/h | Taux horaire impression et découpe |
| `PRINT_SETUP_TIME_MIN` | 15 min | Calage impression |
| `PRINT_SPEED_PRODUCTION` | 1 min/m² | Temps machine mode Production |
| `PRINT_SPEED_QUALITY` | 2 min/m² | Temps machine mode Qualité |
| `INK_COST_PER_LITER` | 95 €/L | Coût de l'encre standard |
| `INK_COST_VARNISH_PER_LITER` | 120 €/L | Coût de l'encre vernis |
| `INK_COST_FLAT_COLOR_PER_LITER` | 120 €/L | Coût de l'encre aplat |
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
- Calculs de coût (`lib/calculation/costs.ts`) : 26 tests ✓
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
pm2 reload kontfeel-calculator --update-env
```

> `pm2 reload` (redémarrage progressif sans coupure) remplace `pm2 restart`.

**Workflow Git :**
```bash
# Développement sur dev
git add .
git commit -m "feat: description"
git push origin dev

# Mise en production
git checkout main
git merge dev
git push origin main
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
pm2 reload kontfeel-calculator --update-env
```

**Réinitialisation manuelle de la séquence de référence (si besoin) :**
```bash
sudo -u postgres psql -d kontfeel
ALTER SEQUENCE quote_reference_seq RESTART WITH 1;
\q
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
- ✅ Séquence `quote_reference_seq` ajoutée dans les migrations (START WITH 1 — corrigé depuis 1000)
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
- ✅ `QuotePDF` refactorisé — 35 props unitaires → 7 objets groupés (`quoteInfo`, `formValues`, `costResult`, `selectedPlate`, `impositionResult`, `selectedAccessories`, `selectedConsumables`)
- ✅ `costResult` centralisé dans `useCalculator` et exposé via le contexte — `ScreenRecap` ne reconstruit plus les coûts manuellement
- ✅ `assemblyNoticeCostPerPiece` retourné directement par `calculateCosts` — suppression du doublon dans `useCalculator`
- ✅ `revalidateEntity()` ajouté dans `lib/cache.ts` — factorise `revalidatePath()` + `revalidateCache()` dans toutes les actions `admin.ts`

### Sprint 4 — Refonte impression (mars 2026)
- ✅ `printSurface` (%) → `inkMlPerPlate` (ml) — migration DB + renommage complet
- ✅ `varnishSurfacePercent` + `flatColorSurfacePercent` ajoutés en DB
- ✅ `FINISHING_SURCHARGE_PERCENT` supprimé — remplacé par `INK_COST_VARNISH_PER_LITER` + `INK_COST_FLAT_COLOR_PER_LITER`
- ✅ `INK_BASE_ML_PER_PLATE` supprimé — le volume est désormais saisi directement par l'utilisateur
- ✅ Jauge encre 0–100 ml avec boutons raccourcis (10 / 25 / 50 / 75 ml)
- ✅ Jauges vernis et aplat 0–100% avec boutons raccourcis — apparaissent à l'activation
- ✅ Récap répartition encre en temps réel (standard% / vernis% / aplat%)
- ✅ Alerte si total finitions dépasse 100%
- ✅ Calage impression et calage découpe activables/désactivables indépendamment
- ✅ `PlateVisualizer` commenté (désactivé temporairement)
- ✅ `buildCostRows()` extrait dans `lib/quote-cost-rows.ts` — partagé entre `ScreenRecap` et `QuotePDF`
- ✅ `ScreenRecap` : bouton Dashboard ajouté en haut à droite du header
- ✅ `settings/calculator/page.tsx` : bouton Retour ajouté + `console.log` supprimé
- ✅ Tests mis à jour : nouvelle logique encre varnish/flatColor séparés — 33 tests passés ✅
- ✅ Séquence `quote_reference_seq` corrigée (START WITH 1000 → 1) — références format `C0001-032026`
- ✅ Seed mis à jour : suppression automatique des clés obsolètes (`FINISHING_SURCHARGE_PERCENT`, `INK_BASE_ML_PER_PLATE`, `INK_COST_FINISHING_PER_LITER`)
- ✅ `pm2 reload` remplace `pm2 restart` dans `deploy.sh` (zero-downtime)

### Sprint 5 — UX & Modernisation (mars 2026)
- ✅ **Mode Sombre** : Support complet du dark mode via `next-themes` et Tailwind v4
- ✅ **Sidebar Responsive** : Navigation mobile via un composant `MobileSidebar` (Sheet shadcn)
- ✅ **Feedback Utilisateur** : Standardisation des toasts de succès/erreur (`Sonner`) sur toutes les actions CRUD
- ✅ **Validation Stricte** : Schémas Zod ajoutés pour la gestion des utilisateurs (`createUser`, `updateUser`)
- ✅ **Restructuration** :
  - Déplacement `app/components` → `components/` (standard Next.js)
  - Colocation `login-form.tsx` dans `app/login/`
  - Déplacement `user-actions.ts` vers `app/actions/` pour cohérence
- ✅ **Nettoyage Build** : Suppression des résidus de configuration `dist/` dans `tsconfig.json`
- ✅ **Branding** : Correction du favicon pointant sur le logo officiel
- ✅ **Performance** : Optimisation du chargement d'un devis existant (`loadQuote` en un seul re-render)

### Sprint 6 — Fonctionnalités avancées & Refonte Encre (mars 2026)
- ✅ **Versionning des devis** : Modifier un devis `REF` renomme l'original en `REF-A` et crée une nouvelle version `REF-B` (incrémentée automatiquement).
- ✅ **Création d'accessoires inline** : Nouveau formulaire intégré directement dans le calculateur pour créer un accessoire à la volée sans recharger la page.
- ✅ **Pré-remplissage Devis** : Lors de la modification d'un devis, le type de PLV est désormais correctement pré-sélectionné et le bouton de création est masqué pour éviter les doublons.
- ✅ **Refonte logique Encre (Blanc)** : 
  - "Aplat" renommé en **"Blanc"** dans toute l'interface et le PDF.
  - L'encre standard (95€/L) est désormais **toujours calculée à 100%** de sa base.
  - Les pourcentages de Vernis et de Blanc s'ajoutent en surplus (à 120€/L) au lieu de réduire la part d'encre standard.
  - **Temps machine séparé** : l'ajout de Vernis ou de Blanc augmente le temps de production (1.5 min/m² paramétrable) sans impacter la vitesse de base de l'encre standard.
- ✅ **Boutons raccourcis** : ajout sur toutes les jauges de l'application (pas seulement l'encre standard, mais aussi le vernis et le blanc).
- ✅ **Comportement Emballage** : masquage du calcul du nombre de plaques tant que la quantité n'est pas encore renseignée.
- ✅ **Connexions utilisateurs** : tests de `first login policy` et validation de la séparation stricte des droits ADMIN vs USER (qui peuvent tout CRUD pour le métier).

---

## 🗺 Roadmap (à venir)

### Nouvelles fonctionnalités
- [ ] Devis multi-produits — intégrer plusieurs types de PLV dans un même devis avec récapitulatif global (évolution structurante)
- [ ] Bloc bureau d'études — section dédiée pour les frais d'étude technique
- [ ] Historique & comparaison de devis
- [ ] Export Excel
- [ ] Marge commerciale configurable (structure prévue, non fonctionnelle)
- [ ] Dashboard analytique avancé (graphiques CA, produits top)

### Chantiers à réfléchir
- [ ] Transport — module de calcul des coûts de transport (cartons, poids, destination, tarifs)
- [ ] Section découpe plus précise — paramètres réels de production (type machine, vitesse de coupe, complexité tracé)
- [ ] Révocation session JWT si rôle change en base — passer à une stratégie de session DB dans Auth.js v5
- [ ] UX mobile (sidebar cachée sans alternative)

---

© 2024-2026 Kontfeel — Tous droits réservés