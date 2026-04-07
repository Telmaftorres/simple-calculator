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
| **uuid** | latest | Identifiants locaux produits multi-devis |

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

`QuotePDF` reçoit des objets groupés (pas de longue liste de props unitaires) :

| Prop | Contenu |
|---|---|
| `quoteInfo` | studyNumber, reference, productName, quantity |
| `formValues` | tout le `formState` du calculateur |
| `costResult` | tout ce que retourne `calculateCosts()` |
| `selectedPlate` | la plaque sélectionnée |
| `impositionResult` | résultat du calepinage |
| `selectedAccessories` | accessoires sélectionnés |
| `selectedConsumables` | consommables sélectionnés |
| `isMultiProduct` | mode multi-produits actif |
| `productSlotResults` | résultats par produit en mode multi |
| `totalCostMulti` | total global en mode multi |

#### Invalidation cache factorisée

`lib/cache.ts` expose `revalidateEntity()` qui regroupe `revalidateCache()` + `revalidatePath()` en un seul appel :
```typescript
// Avant
revalidatePath('/dashboard/plates')
revalidatePath('/')
revalidateCache('plates')

// Après
revalidateEntity('plates', '/dashboard/plates', '/')
```

> ⚠️ `getSettings` n'utilise **pas** `unstable_cache` — ce cache Next.js persiste entre les redémarrages et empêche l'apparition de nouveaux settings. La fonction appelle Prisma directement.

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
│   │   ├── settings.ts           # Lecture/modification constantes métier (sans unstable_cache)
│   │   ├── stats.ts              # Stats dashboard (USER voit son CA, ADMIN voit tout)
│   │   └── auth.ts               # Action de connexion (signIn)
│   ├── calculator/
│   │   ├── Calculator.tsx
│   │   ├── shared.tsx
│   │   ├── context/
│   │   │   └── CalculatorContext.tsx
│   │   ├── sections/
│   │   │   ├── SectionPresentation.tsx   # Toggle multi-produits
│   │   │   ├── SectionBureauEtudes.tsx   # BE/BAT avec jauges et raccourcis
│   │   │   ├── SectionMultiProduct.tsx   # Onglets produits (mode multi)
│   │   │   ├── SectionImpression.tsx
│   │   │   ├── SectionDecoupe.tsx
│   │   │   ├── SectionFaconnage.tsx
│   │   │   ├── SectionConditionnement.tsx
│   │   │   ├── SectionAccessoires.tsx    # Création inline d'accessoires
│   │   │   ├── SectionEmballage.tsx
│   │   │   ├── SectionTransport.tsx      # Placeholder désactivé
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
│   ├── QuotePDF.tsx              # Support mono et multi-produits
│   ├── GaugeSlider.tsx
│   ├── PlateVisualizer.tsx
│   ├── LogoutButton.tsx
│   └── MobileSidebar.tsx
├── hooks/
│   ├── useCalculator.ts          # Gère mono et multi-produits, expose productSlotResults
│   ├── useCalculatorForm.ts      # Reducer avec actions ADD/REMOVE/UPDATE_PRODUCT
│   ├── useAccessories.ts
│   └── useConsumables.ts
├── lib/
│   ├── auth-helpers.ts
│   ├── cache.ts                  # revalidateCache() + revalidateEntity() avec CacheTag typé
│   ├── constants.ts              # HOURLY_RATE_BE=90, HOURLY_RATE_BAT=70 ajoutés
│   ├── format.ts
│   ├── quote-schema.ts           # quoteProductSchema ajouté pour le multi-produits
│   ├── quote-defaults.ts         # hasBE, beTimeMinutes, batTimeMinutes, isMultiProduct
│   ├── quote-cost-rows.ts        # Lignes BE/BAT ajoutées
│   ├── prisma.ts
│   └── calculation/
│       ├── imposition.ts
│       └── costs.ts              # beCost, batCost, beTotalCost ajoutés au return
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│       ├── ... (migrations précédentes)
│       ├── 20260325131752_add_parent_reference_and_new_format/
│       ├── 20260325000002_add_multi_product/
│       └── 20260325000003_add_be_bat_fields/
├── types/
│   ├── calculator.ts             # ProductSlot, ProductSlotResult, DEFAULT_PRODUCT_SLOT
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
        ├── QuoteProduct[]        (mode multi-produits, onDelete: Cascade)
        ├── QuoteAccessory[] → Accessory   (onDelete: Cascade)
        ├── QuoteConsumable[] → Consumable (onDelete: Cascade)
        └── QuoteElement[]                 (onDelete: Cascade)

User
  └── Quote[]

Setting (constantes métier modifiables en DB)
```

**Règles métier :**
> 🛡️ **Note de sécurité :** Il est parfaitement normal et **voulu** que TOUS les utilisateurs identifiés puissent effectuer des opérations CRUD complètes sur l'ensemble de la base de données métier (Matières, Modèles PLV, Éléments, Accessoires, Consommables). Les Server Actions correspondantes n'ont volontairement pas de `requireAdmin()`.

- `Consumable` = matériaux de façonnage vendus au mètre. `size` = taille totale du rouleau, `sizePerItem` = consommation par pièce.
- `QuoteProduct` = produit individuel dans un devis multi-produits. Contient ses propres champs PLV, format, matière, impression, découpe.
- `Setting` = constantes métier modifiables depuis l'interface admin sans redéploiement. Fallback sur `lib/constants.ts` si DB indisponible.
- Référence devis générée via une **séquence PostgreSQL atomique** (`quote_reference_seq`).
- Format référence : `C001-0326` (3 chiffres séquence + mois + 2 derniers chiffres année).
- **Versioning** : modifier un devis `C001-0326` crée une version `C001-0326-A`, puis `C001-0326-B`, etc. L'original est conservé intact via `parentReference`.

---

## 🔐 Authentification & Permissions

**Rôles :** `ADMIN` | `USER` (enum Prisma en MAJUSCULES)

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

Le moteur `lib/calculation/imposition.ts` calcule automatiquement le meilleur placement des poses sur une plaque (mode normal, rotated, mixed).

### Calcul des coûts

| Poste | Formule |
|---|---|
| **Matière** | `plaquesNécessaires × coût/plaque` |
| **Impression (encre standard)** | `(inkMlPerPlate × 100% × nb_plaques × multiplicateur_rv / 1000) × INK_COST_PER_LITER` |
| **Impression (vernis)** | `(inkMlPerPlate × varnishRatio × nb_plaques × multiplicateur_rv / 1000) × INK_COST_VARNISH_PER_LITER` |
| **Impression (blanc)** | `(inkMlPerPlate × flatColorRatio × nb_plaques × multiplicateur_rv / 1000) × INK_COST_FLAT_COLOR_PER_LITER` |
| **Impression (machine)** | `surface_m² × min/m² × multiplicateur_rv × nb_plaques × taux_horaire` |
| **Calage impression** | `calage_min / 60 × taux_horaire` (si activé) |
| **Découpe (machine)** | `temps_par_pose_sec × quantité / 3600 × taux_horaire` |
| **Calage découpe** | `calage_min / 60 × taux_horaire` (si activé) |
| **Bureau d'études** | `beTimeMinutes / 60 × HOURLY_RATE_BE` |
| **BAT** | `batTimeMinutes / 60 × HOURLY_RATE_BAT` |
| **Façonnage** | `temps_par_pce_sec × quantité / 3600 × taux_horaire_façonnage` |
| **Conditionnement** | `temps_par_pce_sec × quantité / 3600 × taux_horaire_façonnage + notices` |
| **Accessoires** | `Σ (prix × quantité)` |
| **Consommables** | `Σ (sizePerItem × quantité / size_rouleau × prix_rouleau)` |
| **Emballage** | `plaques_carton × coût_plaque + (temps_découpe_sec × quantité / 60 + calage_min) / 60 × taux_horaire_emballage` |

### Mode multi-produits

En mode multi-produits, chaque produit calcule ses propres coûts (matière, impression, découpe) via `productSlotResults[]`. Les sections communes (Bureau d'études, Façonnage, Conditionnement, Accessoires, Emballage, Transport) s'appliquent une seule fois sur la quantité totale.

```
productSlotResults[0].costResult.subtotal  (matière + impression + découpe produit 1)
productSlotResults[1].costResult.subtotal  (matière + impression + découpe produit 2)
+ costResult.totalCost                     (sections communes)
= totalCostMulti
```

### Sections du calculateur

| Section | Toggle | Mode mono | Mode multi |
|---|---|---|---|
| Présentation | — | ✓ | ✓ (numéro dossier + toggle multi) |
| Bureau d'études | ✓ | position 2 | position 2 (commun) |
| Produits | — | — | position 3 (onglets) |
| Imposition | — | auto | par produit |
| Impression | ✓ | ✓ | par produit |
| Découpe | — | ✓ | par produit |
| Façonnage | ✓ | ✓ | commun |
| Conditionnement | ✓ | ✓ | commun |
| Accessoires | ✓ | ✓ | commun |
| Emballage | ✓ | ✓ | commun |
| Transport | — | placeholder | placeholder |

---

## 📋 Constantes métier (`Setting` en DB)

Modifiables depuis `/settings/calculator` sans redéploiement.

| Clé | Valeur par défaut | Description |
|---|---|---|
| `HOURLY_RATE_PRINT` | 50 €/h | Taux horaire impression et découpe |
| `PRINT_SETUP_TIME_MIN` | 15 min | Calage impression |
| `PRINT_SPEED_PRODUCTION` | 1 min/m² | Temps machine mode Production |
| `PRINT_SPEED_QUALITY` | 2 min/m² | Temps machine mode Qualité |
| `PRINT_SPEED_VARNISH` | 1.5 min/m² | Temps machine vernis |
| `PRINT_SPEED_FLAT_COLOR` | 1.5 min/m² | Temps machine blanc |
| `INK_COST_PER_LITER` | 95 €/L | Coût encre standard |
| `INK_COST_VARNISH_PER_LITER` | 120 €/L | Coût encre vernis |
| `INK_COST_FLAT_COLOR_PER_LITER` | 120 €/L | Coût encre aplat |
| `CUTTING_SETUP_MINUTES` | 15 min | Calage découpe |
| `HOURLY_RATE_ASSEMBLY` | 45 €/h | Taux horaire façonnage et conditionnement |
| `ASSEMBLY_NOTICE_COST_PER_PIECE` | 0.10 €/pce | Coût notice de montage par pièce |
| `POSE_SPACING_MM` | 10 mm | Espacement entre poses (imposition) |
| `HOURLY_RATE_PACKAGING` | 45 €/h | Taux horaire emballage |
| `PACKAGING_SETUP_MINUTES` | 15 min | Calage emballage |
| `HOURLY_RATE_BE` | 90 €/h | Taux horaire Bureau d'études / Création |
| `HOURLY_RATE_BAT` | 70 €/h | Taux horaire BAT |
| `MARGIN_*` | 0 % | Marges commerciales par poste (non fonctionnelles — à venir) |

> ⚠️ Après l'ajout de nouvelles clés en DB via seed, relancer le serveur. `getSettings` n'utilise pas `unstable_cache` donc les nouvelles clés apparaissent immédiatement.

---

## 🧪 Tests
```bash
npm run test        # Vitest run
npm run test:watch  # Vitest watch
npm run lint        # ESLint
```

---

## 🚀 Déploiement

**Infrastructure :**
- VPS OVH Ubuntu 24.04
- PM2 (id:0 = kontfeel-calculator port 3000, id:1 = webhook-server port 3001)
- PostgreSQL, Nginx, Let's Encrypt

**URL de production :** `calculateur-kontfeel.tech`

**Déploiement automatique :**
Push sur `main` → GitHub webhook → port 3001 → `deploy.sh`

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

**Workflow Git :**
```bash
git add .
git commit -m "feat: description"
git push origin dev

git checkout main
git merge dev
git push origin main
git checkout dev
```

**Après ajout de nouvelles clés Setting en DB :**
```bash
cd /home/ubuntu/kontfeel-calculator
npx prisma db seed
pm2 reload kontfeel-calculator --update-env
```

**Après migrations importantes :**
```bash
rm -rf .next/cache
pm2 reload kontfeel-calculator --update-env
```

---

## ✅ Historique des sprints

### Sprint 1–5 (voir version précédente du README)
Bugs, sécurité, architecture, refonte encre, UX & modernisation.

### Sprint 6 — Fonctionnalités avancées (mars 2026)
- ✅ Versionning des devis (`parentReference`, suffixes `-A`, `-B`)
- ✅ Nouveau format référence `C001-0326` (3 chiffres + mois + 2 chiffres année)
- ✅ Migration et renommage des anciennes références en DB
- ✅ Création d'accessoires inline depuis le calculateur
- ✅ Pré-remplissage correct du type de PLV lors de la modification d'un devis

### Sprint 7 — Multi-produits & Bureau d'études (avril 2026)
- ✅ **Devis multi-produits** : toggle dans `SectionPresentation`, onglets par produit, sections communes (Façonnage, Conditionnement, Accessoires, Emballage, BE)
- ✅ **Modèle DB** : table `QuoteProduct` + colonne `isMultiProduct` sur `Quote`
- ✅ **Calcul multi** : `productSlotResults[]` par produit + `totalCostMulti` = sous-totaux + sections communes
- ✅ **RecapSidebar** : affichage mono/multi avec sous-totaux par produit
- ✅ **ScreenRecap** : tableau de coûts adapté mono/multi avec séparateur "Sections communes"
- ✅ **QuotePDF** : support mono et multi-produits
- ✅ **Section Bureau d'études** : toggle ON/OFF, jauge Création/BE (90 €/h) + jauge BAT (70 €/h), raccourcis 30/45/60/120 min
- ✅ **Position BE** : numéro 2 en mono et multi (avant les produits en multi)
- ✅ **Section Transport** : placeholder désactivé, "disponible prochainement"
- ✅ **Paramètres de calcul** : catégorie "Bureau d'études" avec `HOURLY_RATE_BE` et `HOURLY_RATE_BAT`
- ✅ **Fix cache settings** : suppression de `unstable_cache` sur `getSettings` — les nouveaux settings apparaissent sans vider le cache manuellement
- ✅ **Clés techniques masquées** dans la page paramètres (meilleure lisibilité)
- ✅ **Calage impression/découpe** : sélecteur 3 états (Aucun/Standard/Complexe), forfaits fixes configurables en DB
- ✅ **Coefficients matière** par tranche de prix/m² (×3.5, ×3, ×2.5, ×2) appliqués au coût matière
- ✅ **Frais de dossier** toggle ON/OFF (8€ forfait fixe configurable)
- ✅ **Suppression catégorie Marges** — remplacée par catégorie Matière
- ✅ **Marges internes** : indicateurs lecture seule (Com. commerciale 2.5%, Com. Sopano 5%), toggle ON/OFF, affichage du Net interne — jamais sauvegardées en DB

---

## 🗺 Roadmap (à venir)

- [ ] Historique & comparaison de devis
- [ ] Module Transport complet
---

© 2024-2026 Kontfeel — Tous droits réservés