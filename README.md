# Kontfeel Calculator V2

Bienvenue dans le dépôt de **Kontfeel Calculator V2**, une application web moderne et performante conçue pour automatiser et optimiser le calcul de devis pour la PLV (Publicité sur Lieu de Vente).

## 🌟 Points Forts

- **Précision Industrielle** : Algorithmes de calepinage (imposition) temps réel.
- **Expérience Utilisateur Premium** : Interface réactive, animations fluides et visualisation graphique.
- **Architecture de Pointe** : Basé sur Next.js 16 (App Router) et Prisma ORM.
- **Performance Optimisée** : Système de mise en cache serveur agressif.

---

## 🚀 Écosystème de l'Application

### 🆕 Calculateur de Devis (Refactorisé V2)
Le calculateur a été entièrement modularisé pour une maintenance simplifiée. Il permet désormais :
- **Configuration Dynamique** : Saisie des dimensions, quantités et choix des matières.
- **Visualisation Dynamique** : Un rendu 2D (`PlateVisualizer`) qui montre exactement comment les pièces sont disposées sur la plaque.
- **Composantes de Production** :
  - **Impression** : Gestion fine des modes (Production/Qualité) et du Recto/Verso.
  - **Découpe/Façonnage/Conditionnement** : Jauges interactives (`GaugeSlider`) pour estimer les temps de main-d'œuvre.
- **Système d'Accessoires** : Ajout à la volée d'accessoires (pieds, adhésifs, etc.) avec mise à jour instantanée du coût.

### 🔐 Administration & Sécurité
- **RBAC (Role-Based Access Control)** : Distinction nette entre `ADMIN` et `USER`.
- **Gestion fine des permissions** via un tableau de chaînes de caractères.
- **Sécurité** : Hashing de mot de passe avec `bcryptjs` et session persistante via `Auth.js`.
- **First Login Policy** : Obligation de changer de mot de passe à la première connexion.

### 📊 Dashboard & Gestion des Données
- **Analyse des Devis** : Historique complet avec recherche et filtrage.
- **CRUD Avancé** :
  - **Matières** : Gestion des formats de plaques et prix au m².
  - **Produits** : Configuration des types de PLV et de leurs éléments constitutifs.
  - **Formules** : Éditeur de formules dynamiques pour les calculs de formats à plat.

---

## 🛠 Stack Technique

| Technologie | Usage |
| :--- | :--- |
| **Next.js 16** | Framework Fullstack (React 19, App Router) |
| **Prisma** | ORM pour la gestion de la base de données (PostgreSQL/SQLite) |
| **Tailwind CSS 4** | Framework CSS utilitaire pour un design sur mesure |
| **Shadcn/UI** | Bibliothèque de composants UI accessibles (Radix UI) |
| **Auth.js v5** | Gestion de l'authentification et des sessions |
| **Vitest** | Environnement de tests unitaires et d'intégration |
| **Lucide React** | Pack d'icônes vectorielles |

---

## 📂 Structure du Projet

```bash
├── app/
│   ├── actions/          # Logique serveur (Server Actions) pour les CRUD
│   ├── admin/            # Pages réservées aux administrateurs
│   ├── components/       # Composants globaux
│   │   └── calculator/   # Composants atomiques du calculateur (shared, screens, sections)
│   ├── hooks/            # Hooks personnalisés (ex: useCalculator)
│   ├── lib/              # Utilitaires côté client
│   └── (routes)/         # Structure des pages de l'application
├── prisma/
│   ├── schema.prisma     # Définition des modèles de données (Study, Quote, Plate, User, etc.)
│   └── seed.ts           # Scripts de population de données de test
├── lib/
│   ├── calculation/      # Moteur de calcul d'imposition (géométrie 2D)
│   └── prisma.ts         # Initialisation du client Prisma
├── types/                # Définitions TypeScript globales
└── middleware.ts          # Protection des routes et redirection auth
```

---

## 💾 Modèle de Données

Le schéma Prisma est conçu pour une flexibilité maximale :
- **Study & Quote** : Liaison entre un dossier client et ses multiples devis.
- **ProductType & Element** : Permet de définir des produits complexes composés de plusieurs parties.
- **Plate & Accessory** : Stockage des caractéristiques techniques et de coût des consommables.
- **User & Role** : Système d'authentification robuste avec gestion des droits.

---

## ⚙️ Installation & Configuration

### Prérequis
- `Node.js` v18.0.0 ou supérieur
- `npm` ou `yarn`

### Étapes d'installation

1. **Cloner le projet**
   ```bash
   git clone <url-du-repo>
   cd simple-calculator
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   Créez un fichier `.env` à la racine :
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/kontfeel"
   NEXTAUTH_SECRET="votre-secret-ultra-securise"
   ```

4. **Préparer la base de données**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

---

## 🧪 Tests & Qualité

Nous attachons une grande importance à la qualité du code :
- **Tests Unitaires** : `npm run test` pour valider la logique de calcul.
- **Linting** : `npm run lint` pour garantir le respect des standards de code.
- **Formatage** : `npm run format` pour une base de code uniforme.

---

## 📈 Roadmap & Évolution ERP

Le projet est conçu pour s'intégrer facilement avec des systèmes tiers (ERP/CRM) :
- **Intégration Laravel** : Prêt pour une communication via API REST ou connexion directe à la DB.
- **SSO** : Possibilité d'étendre `Auth.js` pour supporter des fournisseurs d'identité externes.
- **Export PDF** : (À venir) Génération automatique des fiches techniques et devis clients.

---

© 2024 Kontfeel - Tous droits réservés.
