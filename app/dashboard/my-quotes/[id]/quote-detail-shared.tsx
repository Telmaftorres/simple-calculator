import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ── Types ──
export type Accessory = { accessory: { name: string; price: number }; quantity: number }
export type TransportDelivery = {
  transportMode: string; department: string; weightKg: number | null
  units: number; optionsHT: number; basePriceHT: number; totalHT: number
}
export type ProductEntry = {
  id: number
  productTypeName: string | null
  flatWidth: number; flatHeight: number; quantity: number
  plate: { id: number; name: string; width: number; height: number } | null
  platesCount: number | null; itemsPerPlate: number | null
  isRectoVerso: boolean; rectoVersoType: string | null
  hasVarnish: boolean; hasFlatColor: boolean; hasImpression: boolean
  inkMlPerPlate: number; cuttingTimePerPoseSeconds: number
  amalgameGroupIndex: number | null
  countPerPlateInGroup: number | null
}

export type Quote = {
  id: number
  reference: string | null
  client: string | null
  createdAt: Date
  quantity: number
  flatWidth: number | null; flatHeight: number | null
  totalCost: number | null
  transportTotal: number | null
  cuttingTimePerPoseSeconds: number | null
  assemblyTimePerPieceSeconds: number | null
  packTimePerPieceSeconds: number | null
  hasFaconnage: boolean
  hasConditionnement: boolean
  hasBE: boolean
  beTimeMinutes: number
  batTimeMinutes: number
  hasImpression: boolean
  isRectoVerso: boolean
  rectoVersoType: string | null
  hasVarnish: boolean; hasFlatColor: boolean
  hasAssemblyNotice: boolean
  hasPoseEtiquette: boolean
  isMultiProduct: boolean
  inkMlPerPlate: number | null
  platesCount: number | null
  itemsPerPlate: number | null
  hasPackaging: boolean
  packagingQuantity: number | null
  packagingPlate: { name: string } | null
  packagingBoxType: string | null
  packagingMaterialType: string | null
  packagingUnitPriceOverride: number | null
  packagingExternalSize: string | null
  study: { number: string } | null
  productType: { name: string } | null
  plate: { id: number; name: string; cost: number; width: number; height: number } | null
  plvQuantity: number | null
  hasAmalgame: boolean
  amalgameRuns: {
    name: string
    position: number
    hasImpression: boolean
    platesCount: number | null
    cuttingTimePerPoseSeconds: number
    machineTimeMinOverride: number | null
    inkMlPerPlate: number
    isRectoVerso: boolean
    rectoVersoType: string | null
    plate: { id: number; name: string; width: number; height: number } | null
    items: { name: string; flatWidth: number; flatHeight: number; countPerPlate: number; quantityPerUnit: number }[]
  }[]
  accessories: Accessory[]
  products: ProductEntry[]
  transportDeliveries: TransportDelivery[]
  actuals: {
    actualCuttingTimePerPoseSeconds: number | null
    actualAssemblyTimePerPieceSeconds: number | null
    actualPackTimePerPieceSeconds: number | null
    actualPlatesUsed: number | null
    actualWastePercent: number | null
    actualTransportMode: string | null
    actualTransportCost: number | null
    actualWeightKg: number | null
    notes: string | null
  } | null
  productionSheet: {
    id: number
    prodCuttingTimePerPoseSeconds: number | null
    prodMachineTimeMinOverride: number | null
    prodAssemblyTimePerPieceSeconds: number | null
    prodPackTimePerPieceSeconds: number | null
    prodInkMlPerPlate: number | null
    prodPlatesCount: number | null
    prodTransportCost: number | null
    prodTransportNotes: string | null
    amalgameScope: string | null
    beNotes: string | null
    prodBeTimeMinutesOverride: number | null
    prodBatTimeMinutesOverride: number | null
    impressionNotes: string | null
    prodIsRectoVerso: boolean | null
    prodRectoVersoType: string | null
    prodHasVarnish: boolean | null
    prodHasFlatColor: boolean | null
    decoupeNotes: string | null
    prodItemsPerPlate: number | null
    nbCollages: number | null
    collagePerPLV: number | null
    faconnageNotes: string | null
    conditionnementType: string | null
    conditionnementNotes: string | null
    achatsNotes: string | null
    remarques: string | null
    delaiRealisation: string | null
    planImageUrl: string | null
    status: string
    packagingBoxLengthMm: number | null
    packagingBoxWidthMm: number | null
    packagingBoxHeightMm: number | null
    packagingSupplierRef: string | null
    packagingNotes: string | null
    prodPackagingUnitPrice: number | null
    prodPackagingQuantity: number | null
    prodPackagingMaterial: string | null
    productionAchatItems: {
      id: number
      name: string
      quantity: number
      unitPrice: number | null
      position: number
    }[]
    productionAmalgameRuns: {
      id: number
      name: string
      notes: string | null
      position: number
      platesCount: number | null
      items: {
        id: number
        name: string
        flatWidth: number
        flatHeight: number
        flatDepth: number | null
        countPerPlate: number
        quantityPerUnit: number
        position: number
      }[]
    }[]
    productionProductLines: {
      id: number
      name: string
      position: number
      plate: { id: number; name: string; width: number; height: number; cost: number; material: string } | null
      elements: {
        id: number
        name: string
        flatWidth: number
        flatHeight: number
        position: number
        plate: { id: number; name: string; width: number; height: number; cost: number; material: string } | null
      }[]
    }[]
  } | null
}

// ── Constantes partagées ──
export const STATUS_OPTIONS = [
  { value: 'en_attente', label: 'En attente', color: 'bg-amber-100 text-amber-800' },
  { value: 'en_cours',   label: 'En cours',   color: 'bg-blue-100 text-blue-800' },
  { value: 'termine',    label: 'Terminé',    color: 'bg-emerald-100 text-emerald-800' },
]

export const CONDITIONNEMENT_OPTIONS = [
  { value: 'kit_unitaire', label: 'Kit unitaire' },
  { value: 'caisse',       label: 'En caisse' },
  { value: 'palette',      label: 'Sur palette' },
  { value: 'autre',        label: 'Autre' },
]

// ── Composants utilitaires partagés ──
export function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-slate-400 text-xs mb-0.5">{label}</p>
      <p className="font-semibold text-sm">{value ?? '—'}</p>
    </div>
  )
}

export function SectionCard({ title, color = 'slate', children }: { title: string; color?: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    slate:  'bg-slate-50 border-slate-200 text-slate-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-800',
    orange: 'bg-orange-50 border-orange-100 text-orange-800',
    sky:    'bg-sky-50 border-sky-100 text-sky-800',
    emerald:'bg-emerald-50 border-emerald-100 text-emerald-800',
    violet: 'bg-violet-50 border-violet-100 text-violet-800',
    amber:  'bg-amber-50 border-amber-100 text-amber-800',
  }
  const hdr = colors[color] ?? colors.slate
  return (
    <Card className={`border ${hdr.split(' ')[2] === 'text-slate-700' ? 'border-slate-200' : `border-${color}-100`}`}>
      <CardHeader className={`pb-2 ${hdr.split(' ')[0]} border-b ${hdr.split(' ')[1]}`}>
        <CardTitle className={`text-xs uppercase tracking-wide font-semibold ${hdr.split(' ')[2]}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  )
}

export function DiffBadge({ estimated, actual, invertSign = false }: { estimated: number; actual: number; invertSign?: boolean }) {
  const pct = ((actual - estimated) / Math.abs(estimated)) * 100
  const isBad = invertSign ? pct > 0 : pct < 0
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isBad ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
      {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}
