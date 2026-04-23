# Kontfeel Calculator V2

Application web de calcul de devis pour la PLV (Publicité sur Lieu de Vente), développée pour Kontfeel.

> **Note :** Le ton informel dans l'interface (« Coucou », tutoiement) est volontaire — c'est un outil interne à l'entreprise avec une ambiance décontractée.

---

## 🛠 Stack technique

| Technologie | Version | Usage |
|---|---|---|
| **Next.js** | 16.x | Framework Fullstack, App Router |
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

#### Fiche de production (`ProductionSheet`)

Chaque devis peut avoir une fiche de production attachée (relation 1-1 optionnelle). Elle est destinée à l'atelier et s'exporte en PDF A4 paysage via `components/pdf/ProductionSheetPDF.tsx`.

| Section PDF | Contenu |
|---|---|
| En-tête | Référence, client, type PLV, quantité, montant HT, date, statut |
| Nomenclature | Tableau matières/formats/plaques (mono ou multi-produits) |
| Impression | Nb plaques, type (R/V, vernis, blanc), encre/plaque |
| Découpe | Nb plaques, temps/pose estimé |
| Façonnage | Temps estimé, nb collages, montant collage/PLV, notes |
| Conditionnement | Temps estimé, type (kit/caisse/palette/autre), notes |
| Achats | Accessoires du devis + notes libres |
| Remarques | Champ libre |
| Plan technique | Image uploadée (JPEG/PNG/WEBP/GIF, max 5 Mo) |

**Upload d'image :** `POST /api/upload` — authentification requise, fichier sauvegardé dans `public/uploads/{folder}/`. Nom de fichier généré avec `Date.now() + randomUUID()` (crypto built-in). Retourne l'URL relative `/uploads/{folder}/{filename}` stockée dans `planImageUrl`.

**Statuts disponibles :** `en_attente` (défaut) · `en_cours` · `termine`

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
│   │   ├── production-sheet.ts   # upsertProductionSheet (propriétaire ou ADMIN)
│   │   └── auth.ts               # Action de connexion (signIn)
│   ├── api/
│   │   └── upload/
│   │       └── route.ts          # POST /api/upload — sauvegarde fichier dans public/uploads/
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
│   │   │   ├── SectionTransport.tsx      # Multi-livraisons GEODIS
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
│   │   ├── formulas/
│   │   └── activite/              # Journal d'activité (ADMIN only)
│   ├── settings/
│   │   ├── calculator/
│   │   └── users/
│   ├── login/
│   ├── change-password/
│   └── page.tsx
├── components/
│   ├── ui/                       # Composants shadcn/ui
│   ├── calculator/
│   │   ├── GaugeSlider.tsx       # Prop step optionnelle (défaut 1)
│   │   ├── ShortcutButtons.tsx   # Boutons raccourcis réutilisables (jauges temps)
│   │   └── PlateVisualizer.tsx
│   ├── feedback/
│   │   └── ErrorBoundary.tsx     # Boundary React (class component) autour des sections
│   ├── layout/
│   │   ├── LogoutButton.tsx
│   │   ├── MobileSidebar.tsx
│   │   └── ModeToggle.tsx
│   ├── pdf/
│   │   ├── QuotePDF.tsx          # Support mono et multi-produits
│   │   └── ProductionSheetPDF.tsx # Fiche de production A4 paysage
│   └── providers/
│       └── ThemeProvider.tsx
├── hooks/
│   ├── useCalculator.ts          # Gère mono et multi-produits — resolveVerso() factorisé
│   ├── useCalculatorForm.ts      # Reducer avec actions ADD/REMOVE/UPDATE_PRODUCT + TRANSPORT_DELIVERY
│   ├── useAccessories.ts
│   └── useConsumables.ts
├── lib/
│   ├── auth-helpers.ts
│   ├── audit.ts                  # logAction() — insère dans AuditLog, try/catch silencieux
│   ├── cache.ts                  # revalidateCache() + revalidateEntity() avec CacheTag typé
│   ├── constants.ts              # Constantes raccourcis (BE/BAT/CUTTING_SHORTCUTS…) + PASSWORD_MIN_LENGTH
│   ├── format/
│   │   ├── index.ts
│   │   ├── numbers.ts
│   │   └── calculator-details.ts
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
│       ├── 20260325000003_add_be_bat_fields/
│       ├── 20260409114345_add_quote_user_date_index/
      └── 20260422000000_add_custom_plate_to_quote/
├── types/
│   ├── calculator.ts             # ProductSlot, ProductSlotResult, DEFAULT_PRODUCT_SLOT
│   └── next-auth.d.ts
└── __tests__/
    ├── imposition.test.ts
    ├── costs.test.ts             # +BE/BAT, emballage, coefficients matière, frais dossier
    ├── transport.test.ts         # getPack30Rate, getMessagerieRate, calculateTransport
    ├── cost-rows.test.ts         # buildCostRows — apparition/valeur de chaque ligne PDF/récap
    ├── multi-product.test.ts     # Calculs par slot, agrégation, cohérence mono↔multi
    └── actions.test.ts
```

---

## 💾 Modèle de données
```
Study (dossier client)
  └── Quote[] (devis)
        ├── ProductType (type PLV) → Element[]
        ├── Plate (matière/plaque)
        ├── QuoteProduct[]              (mode multi-produits, onDelete: Cascade)
        ├── QuoteTransportDelivery[]    (points de livraison transport, onDelete: Cascade)
        ├── QuoteAccessory[] → Accessory   (onDelete: Cascade)
        ├── QuoteConsumable[] → Consumable (onDelete: Cascade)
        ├── QuoteElement[]                 (onDelete: Cascade)
        ├── QuoteActuals?                  (données réelles, onDelete: Cascade)
        └── ProductionSheet?               (fiche de production, onDelete: Cascade)
              ├── status                   ('en_attente' | 'en_cours' | 'termine')
              ├── nbCollages / collagePerPLV
              ├── faconnageNotes / conditionnementNotes / achatsNotes / remarques
              └── planImageUrl             (image uploadée via /api/upload)

User
  └── Quote[]

Setting (constantes métier modifiables en DB)

AuditLog (journal d'activité — indépendant, pas de FK)
  ├── userId / userName   (dénormalisé — survit à la suppression d'un utilisateur)
  ├── action              ('CREATE_QUOTE' | 'DELETE_QUOTE' | 'UPSERT_ACTUALS' | 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER' | 'UPDATE_SETTING')
  ├── entityType          ('Quote' | 'User' | 'Setting')
  ├── entityRef           (référence lisible : numéro devis, email, clé setting)
  └── details             (JSON libre : quantité, rôle, valeur modifiée…)
```

**Champ `client` :** ajouté directement sur `Quote` (TEXT nullable) — affiché dans la fiche de production et l'en-tête du PDF.

**Matière personnalisée :** 4 champs optionnels sur `Quote` (`customPlateName`, `customPlateWidth`, `customPlateHeight`, `customPlateCost`) permettant de tester une matière "hors catalogue" sans créer d'entrée en DB.

**Index DB :** `Quote` possède un `@@index([userId, createdAt])` pour optimiser la liste "Mes dossiers" (filtrée par utilisateur, triée par date).

**Règles métier :**
> 🛡️ **Note de sécurité :** Il est parfaitement normal et **voulu** que TOUS les utilisateurs identifiés puissent effectuer des opérations CRUD complètes sur l'ensemble de la base de données métier (Matières, Modèles PLV, Éléments, Accessoires, Consommables). Les Server Actions correspondantes n'ont volontairement pas de `requireAdmin()`.

- `Consumable` = matériaux de façonnage vendus au mètre. `size` = taille totale du rouleau, `sizePerItem` = consommation par pièce.
- `QuoteProduct` = produit individuel dans un devis multi-produits. Contient ses propres champs PLV, format, matière, impression, découpe.
- `ProductionSheet` = fiche de production liée à un devis (relation 1-1, optionnelle). Créée/mise à jour via `upsertProductionSheet()` (Server Action). Seul le propriétaire du devis ou un ADMIN peut y accéder.
- `Setting` = constantes métier modifiables depuis l'interface admin sans redéploiement. Fallback sur `lib/config/pricing.ts` si DB indisponible.
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
| Journal d'activité `/dashboard/activite` | ✗ | ✓ |

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

### Utilitaires de formatage (`lib/format/`)

| Fonction | Exemple de sortie |
|---|---|
| `formatCurrency(12.5)` | `"12.50 €"` |
| `formatMargin(2.5)` | `"×2.5 (+150%)"` |
| `formatTimeSeconds(90)` | `"1 min 30 sec"` |
| `formatMinutes(1.5)` | `"1 min 30 sec"` |
| `formatCuttingDetails(...)` | `"3 min (20s/pose + calage standard)"` |

### Imposition (calepinage 2D)

Le moteur `lib/calculation/imposition.ts` calcule automatiquement le meilleur placement des poses sur une plaque (mode normal, rotated, mixed).

### Calcul des coûts

| Poste | Formule |
|---|---|
| **Matière** | `plaquesNécessaires × coût/plaque × coefficientMatière` (tiered ×3.5/×3/×2.5/×2 selon €/plaque) |
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
| **Emballage** | `plaques_carton × coût_plaque + (temps_découpe_sec × quantité / 60) / 60 × taux_horaire_emballage + forfait_calage` |
| **Transport** | `Σ livraisons (prix_base_GEODIS × surcharge_carburant + options)` |

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
| Transport | — | multi-livraisons GEODIS | commun |

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
| `HOURLY_RATE_ASSEMBLY` | 45 €/h | Taux horaire façonnage |
| `HOURLY_RATE_CONDITIONING` | 40 €/h | Taux horaire conditionnement (mise en boîte) |
| `ASSEMBLY_NOTICE_COST_PER_PIECE` | 0.10 €/pce | Coût notice de montage par pièce |
| `POSE_SPACING_MM` | 10 mm | Espacement entre poses (imposition) |
| `HOURLY_RATE_PACKAGING` | 45 €/h | Taux horaire emballage |
| `PACKAGING_SETUP_COST` | 10 € | Forfait calage emballage (fixe, hors taux horaire) |
| `HOURLY_RATE_BE` | 90 €/h | Taux horaire Bureau d'études / Création |
| `HOURLY_RATE_BAT` | 70 €/h | Taux horaire BAT |
| `MATERIAL_MARGIN_TIER1` | 3.5 | Coeff. matière si coût < 5 €/plaque |
| `MATERIAL_MARGIN_TIER2` | 3   | Coeff. matière si coût 5–10 €/plaque |
| `MATERIAL_MARGIN_TIER3` | 2.5 | Coeff. matière si coût 10–20 €/plaque |
| `MATERIAL_MARGIN_TIER4` | 2   | Coeff. matière si coût > 20 €/plaque |
| `INK_MARGIN_STANDARD`   | 4.5 | Coeff. marge encre standard |
| `INK_MARGIN_VARNISH`    | 7   | Coeff. marge encre vernis |
| `INK_MARGIN_FLAT_COLOR` | 7   | Coeff. marge encre blanc / aplat |
| `DOSSIER_FEE` | 8 € | Frais de dossier forfaitaires administratifs |
| `MARGE_COMMERCIALE_PERCENT` | 2.5 % | Marge interne commerciale (affichage indicatif) |
| `MARGE_SOPANO_PERCENT` | 5 % | Marge interne Sopano (affichage indicatif) |
| `GEODIS_FUEL_SURCHARGE_PERCENT` | 2.9 % | Surcharge carburant GEODIS (mensuel) |

> ⚠️ Après l'ajout de nouvelles clés en DB via seed, relancer le serveur. `getSettings` n'utilise pas `unstable_cache` donc les nouvelles clés apparaissent immédiatement.

---

## ⚠️ Décisions intentionnelles — pièges à ne pas "corriger"

Ces patterns peuvent sembler incorrects à première vue mais sont **voulus**.

| Fichier | Pattern | Pourquoi c'est voulu |
|---|---|---|
| `app/settings/users/UserManagement.tsx` | `createSuccess` + `setTimeout(() => setCreateSuccess(false), 3000)` | Ce n'est **pas** un doublon de Sonner. C'est un bloc vert inline dans le formulaire (`<p className="text-green-600">`) qui disparaît après 3s. Sonner n'est pas utilisé pour cet message. Le `setTimeout` est nécessaire. |
| `app/actions/accessories.ts` / `consumables.ts` | Pas de `requireAdmin()` | Tous les utilisateurs connectés peuvent faire du CRUD sur les accessoires et consommables — c'est un choix métier délibéré (outil interne). |
| `lib/get-data.ts` (`getSettings`) | Pas de `unstable_cache` | Intentionnel — ce cache Next.js persiste entre redémarrages et empêche l'apparition de nouveaux settings. |
| `app/calculator/context/CalculatorContext.tsx` | Type inféré `ReturnType<typeof useCalculator>` | Zéro maintenance manuelle : le contexte se met à jour automatiquement quand `useCalculator` évolue. |
| `app/actions/auth.ts` | Requête DB dans `authenticate()` avant `signIn()` pour lire `mustChangePassword` | Pas une duplication de la requête dans `authorize()`. Les deux ont des rôles différents : la première détermine le `redirectTo` avant le `signIn`, la seconde vérifie les credentials. Le middleware dans `auth.config.ts` redirige aussi, mais supprimer cette requête demanderait de refactorer le flux de redirection Auth.js v5 (bêta) — risque inutile. |
| `MyQuotesClient.tsx` / `PlatesClient.tsx` | Confirmation de suppression inline (state `confirmingDeleteId`) | `window.confirm()` est bloquant et non stylé. Le composant AlertDialog (shadcn) n'est pas installé. Pattern choisi : premier clic → affiche "Confirmer / Annuler" dans la ligne, deuxième clic confirme. |

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
- ✅ **Coefficients matière** par tranche de prix/plaque (×3.5, ×3, ×2.5, ×2) appliqués au coût matière
- ✅ **Frais de dossier** toggle ON/OFF (8€ forfait fixe configurable)
- ✅ **Suppression catégorie Marges** — remplacée par catégorie Matière
- ✅ **Marges internes** : indicateurs (Com. commerciale 2.5%, Com. Sopano 5%), toggles ON/OFF sauvegardés en DB, affichage du Net interne calculé à la volée. Ajoutées aux constantes de calcul (Administratif).
- ✅ **Séparation taux horaires** : le taux horaire du conditionnement (40 €/h) est désormais indépendant du façonnage (45 €/h) et modifiable depuis les paramètres.
- ✅ **UX / UI** : 
  - Remplacement des toggles par des "pill buttons" pour Multi-produits et Frais de dossier dans Présentation.
  - Correction de l'ordre des sections (Imposition s'affiche avant Bureau d'études en mode mono).
  - Décalage et correction des numéros d'étapes (1 à 10 pour que Impression soit bien l'étape 4).
  - Centralisation de l'accès "Paramètres Calcul" dans la page principale "Paramètres".
  - Nettoyage : suppression du bouton mode sombre redondant dans la barre latérale.

### Sprint 8 — Module Transport & améliorations calcul (avril 2026)
- ✅ **Section Transport multi-livraisons** : ajout/suppression de points de livraison indépendants, chacun avec son mode, département, poids, colis et options
- ✅ **Grilles tarifaires GEODIS** : Pack 30 (3 zones, 5 tranches), Messagerie Plus (11 zones, 16 tranches), Affrètement (95 départements, 28 colonnes palettes) — hardcodées en `lib/transport/geodis-rates.ts`
- ✅ **Calcul automatique** du prix transport : prix de base + surcharge carburant + options
- ✅ **Suggestion de mode** : Pack 30 si ≤ 30 kg, Messagerie Plus sinon, Affrètement si multi-palettes > 500 kg
- ✅ **Surcharge carburant** `GEODIS_FUEL_SURCHARGE_PERCENT` configurable en Settings (2.9% par défaut)
- ✅ **Table `QuoteTransportDelivery`** : persistance des points de livraison par devis (rechargement en édition), onDelete Cascade
- ✅ **Transport intégré au total** : `transportTotal` passé à `calculateCosts()` et affiché dans le RecapSidebar
- ✅ **RecapSidebar matière corrigé** : la ligne Matière affiche désormais `materialCostMarged` (coût × coefficient) au lieu du coût brut, avec le coefficient appliqué visible en détail
- ✅ **Calage emballage** : passage d'un temps (minutes × taux horaire) à un **forfait fixe 10 € `PACKAGING_SETUP_COST`** indépendant du taux horaire
- ✅ **Paramètres Impression** : sous-catégories en onglets (**Impression** / **Calage** / **Encre**) pour une meilleure lisibilité

### Sprint 9 — Données réelles, corrections & UX imposition (avril 2026)
- ✅ **Module "Données réelles"** : page de détail par devis (`/dashboard/my-quotes/[id]`) permettant de saisir les temps, coûts et notes réels après production. Comparatif estimé vs réel avec badges % d'écart (vert/rouge). Table `QuoteActuals` (Prisma, onDelete Cascade)
- ✅ **Fix multi-produits — sauvegarde** : correction de l'erreur 500 lors de l'enregistrement (`hasPrintSetup`/`hasCuttingSetup` → `printSetupType`/`cuttingSetupType`, champs `plateId`/`itemsPerPlate`/`platesCount` rendus optionnels pour le devis parent)
- ✅ **Fix chargement devis** : restauration complète de tous les champs au rechargement (`hasBE`, `beTimeMinutes`, `batTimeMinutes`, `hasDossierFee`, `selectedProductTypeId`) — le prix en "Voir/Modifier" correspondait désormais au prix sauvegardé
- ✅ **Fix frais de dossier** : champ non sauvegardé en base → corrigé dans le payload `handleSave`. Suppression du double-comptage en mode multi-produits (`hasDossierFee: false` sur les slots individuels)
- ✅ **Fix reset formulaire après save** : le soft-refresh Next.js (déclenché par `revalidateTag`) recréait un nouvel objet `initialQuote` → le `useEffect` réinitialisait le formulaire. Correction via `useRef` : le devis ne se charge qu'une seule fois au montage
- ✅ **Création PLV inline en multi-produits** : le `<select>` du type de PLV remplacé par un champ de recherche avec dropdown + option `+ Créer "..."`, identique au mode simple produit
- ✅ **Encre recto/verso différenciée** : en mode Recto/Verso "Différent", deux jauges indépendantes (Recto + Verso) remplacent la jauge unique. Encre effective = `inkMlRecto + inkMlVerso` (multiplier ×1 au lieu de ×2). Champ `inkMlVerso` ajouté en DB (`migration add_ink_ml_verso`)
- ✅ **Override orientation imposition** : clic sur le badge Horizontal/Vertical/Mix → menu contextuel pour forcer l'orientation ("Forcer Horizontal" / "Forcer Vertical" / "↩ Remettre en auto"). Fonctionne en mono et multi-produits (par slot)

### Sprint 10 — Marges encre, fiche de production & Mes Dossiers (avril 2026)
- ✅ **Marges encre** : coefficients appliqués sur l'encre standard (×4.5), vernis (×7) et blanc (×7). Configurables depuis `/settings/calculator` (clés `INK_MARGIN_STANDARD`, `INK_MARGIN_VARNISH`, `INK_MARGIN_FLAT_COLOR`). Seeder mis à jour (`npx prisma db seed` requis en prod)
- ✅ **Coefficients matière €/plaque** : la logique de marge matière passe de €/m² à €/plaque (< 5€ → ×3.5, 5–10€ → ×3, 10–20€ → ×2.5, > 20€ → ×2). Appliqué au devis mono **et** à la matière d'emballage. Labels des Settings mis à jour en DB
- ✅ **Champ Client** : ajout du champ `client` (texte libre) dans `SectionPresentation`. Affiché dans la liste "Mes dossiers", dans l'en-tête de la fiche et dans le PDF. Migration Prisma `client String?`
- ✅ **Mes Dossiers (ex "Mes Devis")** : renommage complet UI + navigation. Liste enrichie d'une colonne **Client**, tri cliquable par Référence / Client / Date, et recherche étendue au client. Date sans heure
- ✅ **Fiche de production** : 3ème onglet sur chaque dossier (Résumé devis / Fiche de production / Données réelles). Sections : statut (En attente / En cours / Terminé), Informations devis (auto), Nomenclature (auto), Impression (auto), Découpe (auto), Façonnage (nb collages + montant/PLV + notes éditables), Conditionnement (type boutons + notes éditables), Achats (accessoires auto + notes), Remarques, Plan technique (upload image). Table `ProductionSheet` (Prisma, onDelete Cascade)
- ✅ **PDF Fiche de production** : export PDF A4 **paysage** avec header dark, nomenclature table, 2 colonnes (Impression/Découpe/Façonnage à gauche, Conditionnement/Achats/Remarques/Plan technique à droite), pied de page avec pagination. Composant `ProductionSheetPDF.tsx`
- ✅ **Upload image** : API route `/api/upload` (JPEG/PNG/WEBP/GIF, max 5 Mo) sauvegardant dans `public/uploads/production-sheets/`. Champ `planImageUrl String?` sur `ProductionSheet`
- ✅ **Fix backward-compat recto/verso** : les anciens devis sauvegardés avec `rectoVersoType='different'` et `inkMlVerso=0` (avant l'ajout de la jauge verso) conservent le multiplicateur ×2. Le nouveau comportement (multiplier=1 + encre combinée) ne s'active que si `inkMlVerso > 0`
- ✅ **Tests mis à jour** : `costs.test.ts` aligné avec les marges encre, les nouveaux forfaits de calage fixes et `HOURLY_RATE_CONDITIONING`

### Sprint 11 — Audit technique & journal d'activité (avril 2026)
- ✅ **Fix bug imposition `tryMixed()`** : espacement double-compté dans `calcFit(remainingHeight + spacing, iW)` → corrigé en `calcFit(remainingHeight, iW)` (lignes 95 et 122). Tests de régression ajoutés (`describe('mixed orientation')`, 4 cas)
- ✅ **Validation Zod enums** : remplacement des `.string()` libres par des `.z.enum([...])` dans `quoteFieldsSchema`, `quoteProductSchema` et `transportDeliverySchema` (`printMode`, `rectoVersoType`, `printSetupType`, `cuttingSetupType`, `transportMode`). Types TypeScript resserrés en cascade (`types/calculator.ts`, `useCalculatorForm.ts`, `useCalculator.ts`, `SectionTransport.tsx`)
- ✅ **Nettoyage schéma Prisma** : suppression de 6 colonnes mortes legacy sur `Quote` (ancien système mono-livraison : `transportMode`, `transportDepartment`, `transportWeight`, `transportUnits`, `transportBasePrice`, `transportOptions`) et de 4 colonnes réservées inutilisées sur `QuoteActuals` (`actualCuttingTotalMinutes`, `actualAssemblyTotalMinutes`, `actualPackTotalMinutes`, `actualPrintTotalMinutes`)
- ✅ **Transport dans les PDFs** : section "Transport GEODIS" ajoutée dans `QuotePDF.tsx` (tableau par livraison : mode, département, quantité, poids, options HT) et dans `ProductionSheetPDF.tsx` (colonne droite, entre Conditionnement et Achats, avec total consolidé si plusieurs livraisons)
- ✅ **Journal d'activité** (`AuditLog`) : table Prisma sans FK (résistante aux suppressions), helper `lib/audit.ts` avec `logAction()` try/catch silencieux, instrumentation de `createQuote`, `deleteQuote`, `upsertQuoteActuals`, `createUser`, `updateUser`, `deleteUser`, `updateSetting`. Page `/dashboard/activite` (ADMIN only, 200 dernières actions, badges colorés par type). Lien "Activité" dans la sidebar desktop et mobile

### Sprint 13 — Infrastructure, PDF client refonte & correctifs (avril 2026)

#### Infrastructure & déploiement
- ✅ **Migration VPS** : expiration du VPS précédent → nouveau serveur OVH (IP 51.77.211.143), mise à jour DNS A + reconfiguration Nginx/PM2
- ✅ **Webhook de déploiement** : remplacement de GitHub Actions SSH (cassé) par un webhook Node.js PM2 (port 9001) avec vérification HMAC-SHA256. Push sur `main` → déploiement automatique en 2-3 min. Script `deploy.sh` : `git pull` → `npm install` → `prisma migrate deploy` → `prisma generate` → `npm run build` → `pm2 reload`

#### Correctifs calcul
- ✅ **Fix NaN/Infinity** : guard `imp.itemsPerPlate > 0 ? Math.ceil(qty / imp.itemsPerPlate) : 0` (2 endroits dans `useCalculator.ts`, mono et multi). Avant, `Math.ceil(qty / 0) = Infinity` → `0 * Infinity = NaN` pour l'encre → tous les totaux NaN/Infinity pour les devis avec imposition à 0 pose

#### Matière personnalisée ("Test fournisseur")
- ✅ **Bouton "Test fournisseur"** dans `SectionPresentation.tsx` : bascule vers un mode violet avec 4 champs (nom, largeur, hauteur, coût). La matière est utilisée pour le calcul mais **non enregistrée en DB** — pratique pour tester un nouveau fournisseur sans polluer le catalogue
- ✅ **Priorité de sélection** : `customPlate` > `plateCostOverride` > catalogue
- ✅ **Persistence en base** : 4 champs `customPlateName / Width / Height / Cost` ajoutés sur `Quote` (migration `20260422000000`), rechargés en mode édition/vue
- ✅ **Schema Zod** mis à jour (`quoteFieldsSchema`) + `QUOTE_DEFAULTS` mis à jour

#### UX — Toggle visibilité mot de passe
- ✅ **Page login** (`LoginForm.tsx`) : icône Eye/EyeOff sur le champ mot de passe
- ✅ **Gestion utilisateurs** (`UserManagement.tsx`) : icônes Eye/EyeOff sur les deux champs mot de passe (création + édition)

#### Refonte PDF devis client
- ✅ **En-tête** : logo + adresse complète Kontfeel (rue, CP, tél, mail, web) à gauche — titre "Devis" + référence + date à droite
- ✅ **Bloc destinataire** : "A l'attention de" (depuis champ Client), "Réalisé par" (prop `authorName`), "Édité le" (date du jour) + infos dossier/matière/format/plaques dans une grille 2 colonnes
- ✅ **Orientation supprimée** du PDF client (non pertinent pour le destinataire)
- ✅ **Calage** (impression et découpe) : fusionné dans la ligne parent en mode client (coût intégré, pas de sous-ligne visible). Toujours affiché en mode interne
- ✅ **Total HT** déplacé **après** transport et accessoires dans les deux modes (interne et client), avec `wrap={false}` pour éviter la coupure entre pages
- ✅ **Bloc signature** : "Devis valable 1 mois", salutations, champs Date / Bon pour accord / Signature, délai de fabrication, conditions de règlement
- ✅ **Page 2 CGV** : 12 articles en 2 colonnes (police 6pt, sections 1–6 à gauche / 7–12 à droite) pour tenir sur une page A4
- ✅ **Prop `authorName`** ajoutée à `QuotePDF` (optionnelle, affiche `—` si absente)

#### Correctifs PDF interne
- ✅ **Valeurs à zéro** lors de l'ouverture d'un devis sauvegardé (vue `/?viewId=...`) : le `ScreenRecap` montait avant que l'`impositionResult` soit calculé. Fix : `screenState='recap'` déclenché à la fin de l'effect `initialQuote`, et génération PDF conditionnée à `impositionResult !== null` (ou `productSlotResults.length > 0` en multi) via `useRef`

### Sprint 12 — Emballage avancé, templates & marge de bord (avril 2026)

#### Section Emballage — refonte complète
- ✅ **Choix du type de boîte** : 3 options sélectionnables (Étui / Caisse / Plaque rainée), chacune avec une formule de dimensions différente
- ✅ **Choix de la matière** : B / EB (fournisseur externe, prix à l'unité) vs C / BC (carton découpé en interne)
- ✅ **Formules de dimensions carton** automatiques selon le type de boîte :
  - Étui → `{width: 2W+2T, height: L+2T+100}`
  - Caisse → `{width: H+W, height: 2L+2W+50}`
  - Plaque rainée → `{width: W, height: 2L}`
- ✅ **Flux B/EB (externe)** : sélection Petit / Moyen / Grand, saisie quantité, prix unitaire automatique depuis la table `PackagingPricingRule`
- ✅ **Flux C/BC (interne)** : saisie des dimensions du produit fini (L, W, épaisseur pour étui, hauteur pour caisse), format carton calculé automatiquement, sélecteur de plaque filtré par matière, imposition, jauge découpe
- ✅ **Auto-remplissage** : bouton "↑ Auto depuis le produit" (ou "↑ Auto depuis plus grand produit" en multi), qui reporte les dimensions du plus grand produit (surface × surface max)
- ✅ **Persistance DB** : 6 champs ajoutés sur `Quote` (`packagingBoxType`, `packagingMaterialType`, `packagingExternalSize`, `packagingProductLength`, `packagingProductWidth`, `packagingProductHeight`, `packagingProductThickness`)

#### Base de prix emballage B/EB
- ✅ **Nouveaux modèles Prisma** : `PackagingPricingRule` (prix de base par catégorie × matière × taille) + `QuantityCoefficient` (coefficient multiplicateur par tranche de quantité)
- ✅ **Seeder** (`prisma/seeders/packaging-pricing.seeder.ts`) : 6 règles ETUI/EB et ETUI/B + 3 coefficients (PETITE_SERIE ×1.00, MOYENNE_SERIE ×0.97, GRANDE_SERIE ×0.92)
- ✅ **`getSuggestedUnitPricePure()`** : fonction synchrone pour les tests (données injectées)
- ✅ **`getSuggestedUnitPrice()`** : version async lisant la DB via Prisma
- ✅ **Intégration dans le calculateur** : `getPackagingRules()` chargé au démarrage (`page.tsx`), transmis jusqu'à `useCalculator`. Prix injecté dynamiquement dans les settings selon (boxType × material × size × quantité) → coefficient appliqué → `PACKAGING_${mat}_${sz}_PRICE` injecté dans `settings` avant `calculateCosts()`

#### Marge de bord plaque (PLATE_BORDER_MM)
- ✅ **Paramètre `plateBorderMm`** ajouté comme 5e argument de `calculateImposition()` — réduit la surface utile de la plaque de 2 × bord sur chaque axe : `pW = max(0, plate.width − 2 × plateBorderMm)`
- ✅ **Valeur par défaut** : 10 mm (configurable via `PLATE_BORDER_MM` dans les Settings)
- ✅ **Appliqué** dans `costs.ts` (emballage C/BC) et `useCalculator.ts` (imposition principale et multi-produits)
- ✅ **Seeder** mis à jour : nouvelle entrée `PLATE_BORDER_MM` dans la table `Setting`

#### Templates produits — refonte TemplateForm
- ✅ **Section Impression** dans TemplateForm réécrite pour correspondre à `SectionImpression.tsx` : pill buttons calage (Aucun/Standard/Complexe), pill buttons mode impression et recto/verso, GaugeSlider encre (dégradé indigo→violet), raccourcis `INK_SHORTCUTS` et `FINISHING_SHORTCUTS`, tableau de finitions (vernis, blanc), affichage "Temps machine / plaque" calculé à la volée depuis les dimensions de la plaque
- ✅ **Sections Découpe, Façonnage, Conditionnement** dans TemplateForm : GaugeSliders avec dégradés propres (orange, rose, teal), raccourcis `CUTTING_SHORTCUTS`, `ASSEMBLY_SHORTCUTS`, `PACK_SHORTCUTS`, checkbox notice de montage pour Conditionnement
- ✅ **Section Accessoires** dans TemplateForm : correspond à `SectionAccessoires.tsx`, affiche le total calculé
- ✅ **Section Transport** dans TemplateForm (nouveau) : toggle activé/désactivé + 3 boutons mode (Pack 30 / Messagerie+ / Affrètement). Champs `hasTransport Boolean` et `defaultTransportMode String?` ajoutés sur `ProductTemplate`
- ✅ **Section Notes supprimée** de TemplateForm

#### PDFs — enrichissement emballage
- ✅ **Ligne "Emballage" enrichie** dans `buildCostRows()` (utilisé par QuotePDF et RecapSidebar) :
  - Label : `Emballage — Étui B (Petit)` au lieu de juste "Emballage"
  - Détail (devis interne) : `Fournisseur externe — 0.9506 €/pce` pour B/EB | `Mat. X€ + Déc. X€` pour C/BC
  - Détail (devis client) : `Fournisseur externe` pour B/EB | `—` pour C/BC
- ✅ **Section EMBALLAGE** ajoutée dans `ProductionSheetPDF.tsx` (fiche de prod) : type d'emballage, matière + taille, "Fournisseur externe" si B/EB ou nom de la plaque si C/BC, quantité

#### Tests
- ✅ **`imposition.test.ts`** : 7 nouveaux tests `plateBorderMm` (rétrocompatibilité, réduction poses, calculs exacts avec et sans espacement, bord > plaque → 0 items, vérification hors marge, `forceOrientation` avec bord)
- ✅ **`costs.test.ts`** : 16 nouveaux tests (B/EB externe : prix × quantité, pas de découpe, pas d'imposition, prix à 0 si non configuré ; `plateBorderMm` C/BC : 13 vs 9 items, 8 vs 12 plaques ; transport : marge configurable, inclusion dans total)
- ✅ **`packaging-pricing.test.ts`** (nouveau fichier) : 19 tests couvrant `resolveSize` (B/EB/C-BC), `resolveQuantityBand` (tranches + erreurs), `getSuggestedUnitPricePure` (6 cas requis + structure + erreur règle absente)

---

## 🗺 Roadmap (à venir)

- [ ] Historique & comparaison devis vs réel — affinements (filtres, export, statistiques par famille PLV)

### Vision long terme — Système d'apprentissage par l'historique

L'objectif est de construire une base de données intelligente qui s'enrichit à chaque dossier clôturé :

**Phase 1 — Collecte** : à la clôture d'un dossier, saisie des données réelles (poids, temps, coûts, mode transport choisi) vs devis initial.

**Phase 2 — Base de référence** : les dossiers clôturés alimentent des profils type par famille de PLV (présentoir comptoir, totem grand format, cube, etc.) avec leurs valeurs réelles moyennes.

**Phase 3 — Suggestions intelligentes** : lors d'un nouveau devis similaire, le logiciel propose des valeurs pré-remplies (poids estimé, mode transport suggéré, temps façonnage estimé) basées sur l'historique. Plus la base grossit, plus les estimations sont précises — jusqu'à une quasi-automatisation des devis courants.

---

© 2024-2026 Kontfeel — Tous droits réservés
