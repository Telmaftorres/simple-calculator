import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCrmApiUrl } from '@/app/actions/crm-config'
import { PrintButton } from './PrintButton'

export default async function CrmDocPage() {
  const crmUrl = await getCrmApiUrl()

  return (
    <div className="min-h-screen bg-white">
      {/* Barre de navigation — masquée à l'impression */}
      <div className="print:hidden flex items-center justify-between px-8 py-4 border-b border-slate-200 bg-slate-50">
        <Link href="/settings/crm" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <PrintButton />
      </div>

      {/* Document */}
      <div className="max-w-3xl mx-auto px-8 py-12 space-y-10 text-slate-800">

        {/* En-tête */}
        <div className="border-b border-slate-200 pb-8">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Documentation technique</p>
          <h1 className="text-3xl font-bold text-slate-900">Intégration CRM — API Calculateur PLV</h1>
          <p className="mt-3 text-slate-500">
            Ce document décrit l&apos;intégration bidirectionnelle entre le CRM et le Calculateur de Devis PLV.
            Il détaille les endpoints que chaque système doit exposer pour synchroniser stocks, devis signés et fiches de production.
          </p>
          {crmUrl && (
            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-1.5 rounded-lg">
              URL configurée : <code className="font-mono font-semibold">{crmUrl}</code>
            </div>
          )}
        </div>

        {/* Plan de déploiement */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Plan de déploiement par étapes</h2>
          <p className="text-slate-600 text-sm">L&apos;intégration se fait progressivement en 4 étapes indépendantes.</p>

          <div className="space-y-3">
            {[
              {
                step: '1',
                title: 'Stocks CRM → Calculateur',
                calcStatus: 'Calculateur prêt',
                crmStatus: 'À développer côté CRM',
                desc: 'Le calculateur récupère les matières premières et accessoires directement depuis le CRM. Supprime la double saisie des stocks.',
                endpoints: ['GET /matieres', 'GET /accessoires'],
                who: 'Dev CRM',
              },
              {
                step: '2',
                title: 'Connexion appli scan de stock',
                calcStatus: null,
                crmStatus: 'À développer côté CRM',
                desc: "L'appli de gestion des sorties de stock se connecte au CRM. Les opérateurs scannent les articles, renseignent la quantité et rattachent la sortie à une étude.",
                endpoints: ["À définir selon l'appli stock"],
                who: 'Dev CRM + Dev appli stock',
              },
              {
                step: '3',
                title: 'Devis signés → Fiche de production auto',
                calcStatus: 'Calculateur prêt',
                crmStatus: 'À développer côté CRM',
                desc: 'Quand un devis est validé par le client dans le CRM, le calculateur crée automatiquement la fiche de production correspondante. Le CRM peut afficher la fiche et lier vers le calculateur pour la modifier.',
                endpoints: ['GET /devis?status=signe', 'GET /api/v1/quotes ←', 'GET /api/v1/production-sheets/:id ←'],
                who: 'Dev CRM',
              },
              {
                step: '4',
                title: 'QR code fiche de prod → appli stock',
                calcStatus: 'Calculateur prêt',
                crmStatus: 'Lecture QR uniquement',
                desc: "Chaque fiche de production imprimée contient un QR code encodant le numéro d'étude. L'opérateur scanne le QR code au lieu de saisir manuellement le numéro — la sortie de stock est rattachée automatiquement à la bonne étude.",
                endpoints: ["QR code encodé : numéro d'étude CRM"],
                who: 'Appli stock',
              },
              {
                step: '5',
                title: 'Save calculateur → Lignes de devis CRM',
                calcStatus: 'Calculateur prêt',
                crmStatus: 'À développer côté CRM',
                desc: "À chaque sauvegarde d'un devis dans le calculateur, les lignes chiffrées (Matière, Impression, Découpe, Façonnage…) sont envoyées automatiquement au CRM qui crée ou met à jour les lignes du devis correspondant.",
                endpoints: ['POST /devis'],
                who: 'Dev CRM',
              },
            ].map(({ step, title, calcStatus, crmStatus, desc, endpoints, who }) => (
              <div key={step} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                    Étape {step}
                  </span>
                  {calcStatus && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                      ✓ {calcStatus}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 border border-amber-200">
                    ⚙ {crmStatus}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {endpoints.map(e => (
                    <code key={e} className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">{e}</code>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">Responsable : {who}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Vue d'ensemble */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Vue d&apos;ensemble</h2>
          <p className="text-slate-600 leading-relaxed">
            L&apos;intégration fonctionne en deux sens. Le CRM expose trois endpoints que le calculateur consulte.
            Le calculateur expose deux endpoints que le CRM consulte pour afficher les fiches de production.
          </p>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Le CRM expose → le calculateur lit</p>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 text-sm font-mono">
              <div className="flex items-center gap-3">
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold shrink-0">GET</span>
                <span>{crmUrl ? `${crmUrl}/matieres` : 'https://votre-crm.fr/api/matieres'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold shrink-0">GET</span>
                <span>{crmUrl ? `${crmUrl}/accessoires` : 'https://votre-crm.fr/api/accessoires'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold shrink-0">GET</span>
                <span>{crmUrl ? `${crmUrl}/devis?status=signe` : 'https://votre-crm.fr/api/devis?status=signe'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Le calculateur expose → le CRM lit (clé API requise)</p>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 text-sm font-mono">
              <div className="flex items-center gap-3">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold shrink-0">GET</span>
                <span>https://calculateur.fr/api/v1/quotes</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold shrink-0">GET</span>
                <span>https://calculateur.fr/api/v1/production-sheets/:quoteId</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Les appels vers le CRM ont un timeout de 5 secondes. En cas d&apos;échec, le calculateur bascule automatiquement sur sa base locale.
          </p>
        </section>

        {/* Endpoint 1 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Endpoint 1 — Matières premières</h2>
          <div className="flex items-center gap-3 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold shrink-0">GET</span>
            <span>/matieres</span>
          </div>
          <p className="text-slate-600 text-sm">Retourne la liste des plaques / matières disponibles en stock.</p>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Réponse attendue (JSON Array) :</p>
            <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">{`[
  {
    "id": 1,                  // Identifiant unique (nombre ou chaîne)
    "name": "Carton B 1000x700",  // Nom affiché dans le calculateur
    "width": 1000,            // Largeur en millimètres
    "height": 700,            // Hauteur en millimètres
    "cost": 2.50,             // Prix unitaire HT en euros
    "material": "B"           // Optionnel — type de matière (B, EB, C…)
  },
  {
    "id": 2,
    "name": "Carton EB 800x600",
    "width": 800,
    "height": 600,
    "cost": 3.20,
    "material": "EB"
  }
]`}</pre>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1">
            <p className="text-xs font-semibold text-amber-800">Champs obligatoires</p>
            <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5">
              <li><code>id</code> — identifiant unique</li>
              <li><code>name</code> — nom de la matière</li>
              <li><code>width</code> et <code>height</code> — dimensions en mm</li>
              <li><code>cost</code> — prix unitaire HT en €</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Exemple avec curl :</p>
            <pre className="bg-slate-900 text-slate-300 rounded-xl p-4 text-xs">{`curl -s ${crmUrl ? `${crmUrl}/matieres` : 'https://votre-crm.fr/api/matieres'} \\
  -H "Accept: application/json"`}</pre>
          </div>
        </section>

        {/* Endpoint 2 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Endpoint 2 — Accessoires</h2>
          <div className="flex items-center gap-3 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold shrink-0">GET</span>
            <span>/accessoires</span>
          </div>
          <p className="text-slate-600 text-sm">Retourne la liste des accessoires disponibles (visserie, packaging, consommables…).</p>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Réponse attendue (JSON Array) :</p>
            <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">{`[
  {
    "id": 1,                   // Identifiant unique (nombre ou chaîne)
    "name": "Vis M4 x 10mm",   // Nom affiché dans le calculateur
    "price": 0.05,             // Prix unitaire HT en euros
    "description": "Boîte de 100"  // Optionnel — description courte
  },
  {
    "id": 2,
    "name": "Sachet plastique",
    "price": 0.12
  }
]`}</pre>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1">
            <p className="text-xs font-semibold text-amber-800">Champs obligatoires</p>
            <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5">
              <li><code>id</code> — identifiant unique</li>
              <li><code>name</code> — nom de l&apos;accessoire</li>
              <li><code>price</code> — prix unitaire HT en €</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Exemple avec curl :</p>
            <pre className="bg-slate-900 text-slate-300 rounded-xl p-4 text-xs">{`curl -s ${crmUrl ? `${crmUrl}/accessoires` : 'https://votre-crm.fr/api/accessoires'} \\
  -H "Accept: application/json"`}</pre>
          </div>
        </section>

        {/* Endpoint 3 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Endpoint 3 — Devis signés par le client</h2>
          <div className="flex items-center gap-3 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold shrink-0">GET</span>
            <span>/devis?status=signe</span>
          </div>
          <p className="text-slate-600 text-sm">
            Retourne les devis validés par le client. Le calculateur interroge cet endpoint pour créer automatiquement les fiches de production.
            Chaque entrée doit contenir la <strong>référence du devis calculateur</strong> pour le lier.
          </p>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Réponse attendue (JSON Array) :</p>
            <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">{`[
  {
    "crmId": "CRM-2024-087",      // ID unique du devis dans le CRM
    "quoteReference": "DEV-001",  // Référence du devis dans le calculateur
    "clientName": "Acme SA",      // Optionnel
    "signedAt": "2024-06-01T14:00:00Z"  // Optionnel
  }
]`}</pre>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1">
            <p className="text-xs font-semibold text-amber-800">Champs obligatoires</p>
            <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5">
              <li><code>crmId</code> — identifiant unique côté CRM (pour éviter les doublons)</li>
              <li><code>quoteReference</code> — correspond au champ <code>reference</code> du devis calculateur</li>
            </ul>
          </div>
        </section>

        {/* API Calculateur → CRM */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">API exposée par le Calculateur (CRM lit)</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Ces endpoints sont exposés par le calculateur. Le CRM les appelle pour afficher les devis et fiches de production.
            Ils nécessitent une clé API à passer dans le header <code className="bg-slate-100 px-1 rounded">Authorization</code>.
          </p>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-1">
            <p className="text-xs font-semibold text-blue-800">Authentification</p>
            <p className="text-xs text-blue-700">Toutes les requêtes doivent inclure le header :</p>
            <pre className="bg-white rounded-lg border border-blue-100 p-2 text-xs font-mono text-blue-800 mt-1">Authorization: Bearer {'<clé API générée dans Paramètres > Connexion CRM>'}</pre>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold shrink-0">GET</span>
              <span>{crmUrl ? `https://calculateur.fr/api/v1/quotes` : 'https://calculateur.fr/api/v1/quotes'}</span>
            </div>
            <p className="text-slate-600 text-sm">Liste tous les devis avec leur statut de fiche de production.</p>
            <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">{`[
  {
    "id": 42,
    "reference": "DEV-001",
    "client": "Acme SA",
    "quantity": 1000,
    "crmQuoteId": "CRM-2024-087",
    "hasProductionSheet": true,
    "productionSheetStatus": "en_cours",
    "productionSheetUrl": "/dashboard/my-quotes/42?tab=fiche",
    "createdBy": "Jean Dupont"
  }
]`}</pre>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold shrink-0">GET</span>
              <span>https://calculateur.fr/api/v1/production-sheets/:quoteId</span>
            </div>
            <p className="text-slate-600 text-sm">Retourne la fiche de production complète d&apos;un devis.</p>
            <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">{`{
  "quote": { "id": 42, "reference": "DEV-001", "client": "Acme SA", ... },
  "productionSheet": {
    "status": "en_cours",          // "en_attente" | "en_cours" | "termine"
    "delaiRealisation": "5 jours",
    "impression": { "isRectoVerso": false, "hasVarnish": true, ... },
    "decoupe": { "cuttingTimePerPoseSeconds": 12, ... },
    "faconnage": { "assemblyTimePerPieceSeconds": 30, "nbCollages": 2, ... },
    "conditionnement": { "type": "caisse", ... },
    "achats": [{ "name": "Vis M4", "quantity": 200, "unitPrice": 0.05 }]
  }
}`}</pre>
          </div>

          <p className="text-xs text-slate-500">
            Pour modifier une fiche, le CRM redirige l&apos;utilisateur vers <code className="bg-slate-100 px-1 rounded">productionSheetUrl</code> — la page du calculateur s&apos;ouvre directement sur l&apos;onglet fiche de production.
          </p>
        </section>

        {/* Endpoint POST /devis */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Endpoint 4 — Réception des lignes de devis (Étape 5)</h2>
          <div className="flex items-center gap-3 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold shrink-0">POST</span>
            <span>/devis</span>
          </div>
          <p className="text-slate-600 text-sm">
            Appelé par le calculateur à chaque sauvegarde de devis. Le CRM reçoit les lignes chiffrées et crée ou met à jour le devis correspondant dans l&apos;étude.
            Retourner le <code className="bg-slate-100 px-1 rounded">crmId</code> du devis créé pour permettre au calculateur de le lier.
          </p>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Body (JSON) :</p>
            <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">{`{
  "reference": "DEV-2024-001",   // Référence calculateur (unique)
  "studyNumber": "9937",         // Numéro d'étude CRM
  "client": "Acme SA",
  "quantity": 500,
  "lignes": [
    {
      "description": "Matière — Carton B 1000x700 — 12 plaque(s)",
      "prixAchat": 30.00,        // Coût brut HT
      "marge": 2.40,             // Coefficient (ex: 2.4 = ×2.4)
      "prixVente": 72.00         // prixAchat × marge
    },
    { "description": "Impression", "prixAchat": 18.50, "marge": 1, "prixVente": 18.50 },
    { "description": "Découpe",    "prixAchat": 12.00, "marge": 1, "prixVente": 12.00 },
    { "description": "Façonnage",  "prixAchat": 8.00,  "marge": 1, "prixVente": 8.00  },
    { "description": "Transport",  "prixAchat": 5.00,  "marge": 1.15, "prixVente": 5.75 }
  ]
}`}</pre>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Réponse attendue :</p>
            <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs">{`{ "crmId": "CRM-2024-087" }   // ID du devis dans le CRM`}</pre>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1">
            <p className="text-xs font-semibold text-amber-800">Comportement attendu</p>
            <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5">
              <li>Si un devis avec cette <code>reference</code> existe déjà → mettre à jour ses lignes</li>
              <li>Sinon → créer un nouveau devis dans l&apos;étude <code>studyNumber</code></li>
              <li>Toujours retourner le <code>crmId</code> dans la réponse</li>
            </ul>
          </div>
        </section>

        {/* Headers & CORS */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">Headers et CORS</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Les endpoints doivent retourner le header <code className="bg-slate-100 px-1 rounded">Content-Type: application/json</code>.
            Si le calculateur et le CRM sont sur des domaines différents, il faut autoriser les requêtes cross-origin :
          </p>
          <pre className="bg-slate-900 text-slate-300 rounded-xl p-4 text-xs">{`Access-Control-Allow-Origin: *
Content-Type: application/json`}</pre>
        </section>

        {/* Codes d'erreur */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">Gestion des erreurs</h2>
          <p className="text-slate-600 text-sm">En cas d&apos;erreur, retourner un code HTTP standard :</p>
          <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-slate-700">Code</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-700">Signification</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-700">Comportement calculateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-2 font-mono text-emerald-600">200</td>
                <td className="px-4 py-2">Succès</td>
                <td className="px-4 py-2">Utilise les données du CRM</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-amber-600">4xx / 5xx</td>
                <td className="px-4 py-2">Erreur serveur</td>
                <td className="px-4 py-2 text-slate-500">Bascule sur la base locale</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-red-600">Timeout</td>
                <td className="px-4 py-2">Pas de réponse en 5s</td>
                <td className="px-4 py-2 text-slate-500">Bascule sur la base locale</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Contact */}
        <section className="border-t border-slate-200 pt-8">
          <p className="text-xs text-slate-400 text-center">
            Document généré par le Calculateur de Devis PLV — Pour toute question, contacter l&apos;administrateur de l&apos;application.
          </p>
        </section>

      </div>
    </div>
  )
}
