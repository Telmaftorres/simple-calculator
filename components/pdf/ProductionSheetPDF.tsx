'use client'

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { ProductionSheetInput } from '@/app/actions/production-sheet'

// ── Types ──
type Accessory = { accessory: { name: string; price: number }; quantity: number }
type ProductEntry = {
  id: number
  productTypeName: string | null
  flatWidth: number
  flatHeight: number
  quantity: number
  plate: { name: string; width: number; height: number } | null
  platesCount: number | null
  itemsPerPlate: number | null
  isRectoVerso: boolean
  rectoVersoType: string | null
  hasVarnish: boolean
  hasFlatColor: boolean
  hasImpression: boolean
  inkMlPerPlate: number
  cuttingTimePerPoseSeconds: number
  amalgameGroupIndex: number | null
  countPerPlateInGroup: number | null
}

type TransportDelivery = {
  transportMode: string
  department: string
  weightKg: number | null
  units: number
  optionsHT: number
  basePriceHT: number
  totalHT: number
}

type AmalgameRunEntry = {
  name: string
  hasImpression: boolean
  platesCount: number | null
  cuttingTimePerPoseSeconds: number
  inkMlPerPlate: number
  isRectoVerso: boolean
  rectoVersoType: string | null
  plate: { name: string; width: number; height: number } | null
  items: { name: string; flatWidth: number; flatHeight: number; countPerPlate: number; quantityPerUnit: number }[]
}

type Quote = {
  id: number
  reference: string | null
  client: string | null
  createdAt: Date
  quantity: number
  plvQuantity: number | null
  flatWidth: number | null
  flatHeight: number | null
  totalCost: number | null
  transportTotal: number | null
  hasAmalgame?: boolean
  amalgameRuns?: AmalgameRunEntry[]
  transportDeliveries: TransportDelivery[]
  cuttingTimePerPoseSeconds: number | null
  assemblyTimePerPieceSeconds: number | null
  packTimePerPieceSeconds: number | null
  hasFaconnage: boolean
  hasConditionnement: boolean
  hasImpression: boolean
  isRectoVerso: boolean
  rectoVersoType: string | null
  hasVarnish: boolean
  hasFlatColor: boolean
  hasAssemblyNotice: boolean
  isMultiProduct: boolean
  inkMlPerPlate: number | null
  platesCount: number | null
  itemsPerPlate: number | null
  hasPackaging: boolean
  packagingQuantity: number | null
  packagingPlate: { name: string } | null
  packagingBoxType: string | null
  packagingMaterialType: string | null
  packagingExternalSize: string | null
  study: { number: string } | null
  productType: { name: string } | null
  plate: { name: string; cost: number; width: number; height: number } | null
  accessories: Accessory[]
  products: ProductEntry[]
}

// ── Palette couleurs ──
const C = {
  dark:    '#1e293b',
  mid:     '#475569',
  light:   '#94a3b8',
  border:  '#e2e8f0',
  bg:      '#f8fafc',
  white:   '#ffffff',
  green:   '#059669',
  greenBg: '#d1fae5',
  blue:    '#1d4ed8',
  blueBg:  '#dbeafe',
  amber:   '#92400e',
  amberBg: '#fef3c7',
  purple:  '#6d28d9',
  purpleBg:'#ede9fe',
  orange:  '#c2410c',
  orangeBg:'#fff7ed',
  violet:  '#7c3aed',
  violetBg:'#f5f3ff',
}

// ── Styles ──
const s = StyleSheet.create({
  page: {
    padding: '20 28',
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: C.dark,
    backgroundColor: C.white,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: C.dark,
    borderRadius: 4,
    overflow: 'hidden',
  },
  headerLeft: {
    width: 160,
    backgroundColor: C.dark,
    padding: '8 12',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 7.5,
    color: '#94a3b8',
    marginTop: 2,
  },
  headerCenter: {
    flex: 1,
    padding: '6 12',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderLeftWidth: 1.5,
    borderLeftColor: C.dark,
    borderRightWidth: 1.5,
    borderRightColor: C.dark,
  },
  headerInfoGroup: {
    flex: 1,
  },
  headerInfoLabel: {
    fontSize: 6.5,
    color: C.light,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  headerInfoValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
  },
  headerRight: {
    width: 90,
    padding: '6 8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    padding: '4 10',
    borderRadius: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },

  // ── Tableau générique ──
  table: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tableHead: {
    flexDirection: 'row',
    padding: '4 8',
  },
  tableHeadCell: {
    color: C.white,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '3.5 8',
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: '3.5 8',
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  tableCell: { fontSize: 8, color: C.dark },
  tableCellBold: { fontSize: 8, color: C.dark, fontFamily: 'Helvetica-Bold' },

  // ── Groupe amalgame ──
  groupBlock: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '5 8',
    gap: 8,
  },
  groupTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
  },
  groupBadge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    padding: '1.5 5',
    borderRadius: 10,
  },
  groupSpecs: {
    flexDirection: 'row',
    gap: 16,
    padding: '4 8',
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  groupSpecItem: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  groupSpecLabel: { fontSize: 7, color: C.mid },
  groupSpecValue: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.dark },
  groupProductsHead: {
    flexDirection: 'row',
    padding: '3 8',
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: '#f1f5f9',
  },
  groupProductsHeadCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.mid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupProductRow: {
    flexDirection: 'row',
    padding: '3.5 8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  groupProductRowAlt: {
    flexDirection: 'row',
    padding: '3.5 8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fafafa',
  },

  // ── 2 colonnes ──
  cols: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  colLeft: { flex: 1 },
  colRight: { flex: 1 },

  // ── Section card ──
  card: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '4 8',
    gap: 5,
  },
  cardTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },
  cardBody: {
    padding: '5 8',
  },

  // ── Data rows ──
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2.5,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dataLabel: { color: C.mid, flex: 1 },
  dataValue: { fontFamily: 'Helvetica-Bold', color: C.dark, textAlign: 'right' },

  // ── Notes ──
  notesBox: {
    backgroundColor: C.bg,
    borderRadius: 2,
    padding: '4 6',
    marginTop: 3,
    minHeight: 20,
  },
  notesText: { fontSize: 8, color: C.mid, lineHeight: 1.4 },

  // ── Plan image ──
  planImg: {
    maxHeight: 150,
    objectFit: 'contain',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 4,
  },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 4,
  },
  footerText: { fontSize: 6.5, color: C.light },
})

// ── Helpers ──
function fmt(d: Date) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function statusInfo(status: string) {
  if (status === 'en_cours') return { label: 'EN COURS',   bg: C.blueBg,  color: C.blue  }
  if (status === 'termine')  return { label: 'TERMINÉ',    bg: C.greenBg, color: C.green }
  return                            { label: 'EN ATTENTE', bg: C.amberBg, color: C.amber }
}
function condLabel(v: string | null) {
  if (v === 'kit_unitaire') return 'Kit unitaire'
  if (v === 'caisse')       return 'En caisse'
  if (v === 'palette')      return 'Sur palette'
  if (v === 'autre')        return 'Autre'
  return v ?? '—'
}
function rvLabel(rv: boolean, type: string | null) {
  if (!rv) return 'Recto'
  return type === 'different' ? 'R/V Différent' : 'R/V Identique'
}

// ── Sub-components ──
function SectionCard({ title, bgColor, textColor, children }: {
  title: string; bgColor: string; textColor: string; children: React.ReactNode
}) {
  return (
    <View style={s.card}>
      <View style={[s.cardHeader, { backgroundColor: bgColor }]}>
        <Text style={[s.cardTitle, { color: textColor }]}>{title}</Text>
      </View>
      <View style={s.cardBody}>{children}</View>
    </View>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.dataRow}>
      <Text style={s.dataLabel}>{label}</Text>
      <Text style={s.dataValue}>{value}</Text>
    </View>
  )
}

function Notes({ text }: { text: string | null | undefined }) {
  if (!text) return null
  return (
    <View style={s.notesBox}>
      <Text style={s.notesText}>{text}</Text>
    </View>
  )
}

// ── Main PDF Component ──
export function ProductionSheetPDF({ quote, productionSheet }: {
  quote: Quote
  productionSheet: ProductionSheetInput
}) {
  const status = statusInfo(productionSheet.status ?? 'en_attente')
  const displayQty = quote.isMultiProduct ? (quote.plvQuantity ?? quote.quantity) : quote.quantity

  // ── Nomenclature : produits standalone (hors amalgame) ──
  const standaloneProducts = quote.isMultiProduct
    ? quote.products.filter(p => p.amalgameGroupIndex == null)
    : []

  // ── Amalgame runs avec leurs produits ──
  const runs = (quote.amalgameRuns ?? []).map((run, idx) => ({
    run,
    products: quote.products.filter(p => p.amalgameGroupIndex === idx),
  }))

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>FICHE DE PRODUCTION</Text>
            {quote.study && <Text style={s.headerSub}>Dossier {quote.study.number}</Text>}
          </View>

          <View style={s.headerCenter}>
            <View style={s.headerInfoGroup}>
              <Text style={s.headerInfoLabel}>Référence</Text>
              <Text style={s.headerInfoValue}>{quote.reference ?? '—'}</Text>
            </View>
            <View style={s.headerInfoGroup}>
              <Text style={s.headerInfoLabel}>Client</Text>
              <Text style={s.headerInfoValue}>{quote.client ?? '—'}</Text>
            </View>
            <View style={s.headerInfoGroup}>
              <Text style={s.headerInfoLabel}>Type PLV</Text>
              <Text style={s.headerInfoValue}>
                {quote.productType?.name ?? (quote.isMultiProduct ? 'Multi-produits' : '—')}
              </Text>
            </View>
            <View style={s.headerInfoGroup}>
              <Text style={s.headerInfoLabel}>Quantité</Text>
              <Text style={s.headerInfoValue}>{displayQty} ex</Text>
            </View>
            <View style={s.headerInfoGroup}>
              <Text style={s.headerInfoLabel}>Montant HT</Text>
              <Text style={s.headerInfoValue}>
                {quote.totalCost != null ? `${quote.totalCost.toFixed(2)} €` : '—'}
              </Text>
            </View>
            <View style={s.headerInfoGroup}>
              <Text style={s.headerInfoLabel}>Date</Text>
              <Text style={s.headerInfoValue}>{fmt(quote.createdAt)}</Text>
            </View>
          </View>

          <View style={s.headerRight}>
            <View style={[s.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[s.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
        </View>

        {/* ── NOMENCLATURE MULTI-PRODUITS ── */}
        {quote.isMultiProduct ? (
          <View>
            {/* Produits standalone */}
            {standaloneProducts.length > 0 && (
              <View style={s.table}>
                <View style={[s.tableHead, { backgroundColor: C.dark }]}>
                  <Text style={[s.tableHeadCell, { flex: 2 }]}>PRODUIT</Text>
                  <Text style={[s.tableHeadCell, { flex: 2.5 }]}>MATIÈRE</Text>
                  <Text style={[s.tableHeadCell, { flex: 1.2 }]}>FORMAT</Text>
                  <Text style={[s.tableHeadCell, { flex: 0.8, textAlign: 'center' }]}>QTÉ</Text>
                  <Text style={[s.tableHeadCell, { flex: 1, textAlign: 'center' }]}>IMPRESSION</Text>
                  <Text style={[s.tableHeadCell, { flex: 1, textAlign: 'center' }]}>DÉCOUPE (s/pose)</Text>
                  <Text style={[s.tableHeadCell, { flex: 0.8, textAlign: 'right' }]}>PLAQUES</Text>
                </View>
                {standaloneProducts.map((p, i) => (
                  <View key={p.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                    <Text style={[s.tableCell, { flex: 2 }]}>{p.productTypeName || '—'}</Text>
                    <Text style={[s.tableCell, { flex: 2.5, color: C.mid }]}>
                      {p.plate ? `${p.plate.name}  ${p.plate.width}×${p.plate.height}` : '—'}
                    </Text>
                    <Text style={[s.tableCell, { flex: 1.2 }]}>{p.flatWidth}×{p.flatHeight} mm</Text>
                    <Text style={[s.tableCell, { flex: 0.8, textAlign: 'center' }]}>{p.quantity}</Text>
                    <Text style={[s.tableCell, { flex: 1, textAlign: 'center', color: C.purple }]}>
                      {p.hasImpression ? rvLabel(p.isRectoVerso, p.rectoVersoType) : 'Non'}
                    </Text>
                    <Text style={[s.tableCell, { flex: 1, textAlign: 'center' }]}>
                      {p.cuttingTimePerPoseSeconds > 0 ? `${p.cuttingTimePerPoseSeconds} s` : '—'}
                    </Text>
                    <Text style={[s.tableCellBold, { flex: 0.8, textAlign: 'right' }]}>
                      {p.platesCount ?? '—'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Groupes amalgame */}
            {runs.map(({ run, products: slots }, i) => {
              const isImpDec = run.hasImpression
              const bgColor = isImpDec ? C.violetBg : C.orangeBg
              const textColor = isImpDec ? C.violet : C.orange
              const badgeLabel = isImpDec ? 'IMPRESSION + DÉCOUPE' : 'DÉCOUPE SEULE'
              return (
                <View key={i} style={s.groupBlock}>
                  {/* En-tête groupe */}
                  <View style={[s.groupHeader, { backgroundColor: bgColor }]}>
                    <Text style={[s.groupTitle, { color: textColor }]}>{run.name}</Text>
                    <Text style={[s.groupBadge, { backgroundColor: textColor, color: C.white }]}>
                      {badgeLabel}
                    </Text>
                    {run.plate && (
                      <Text style={[s.groupSpecLabel, { marginLeft: 4 }]}>
                        {run.plate.name}  {run.plate.width}×{run.plate.height} mm
                      </Text>
                    )}
                    {run.platesCount != null && (
                      <Text style={[s.groupSpecLabel, { marginLeft: 8 }]}>
                        <Text style={s.groupSpecValue}>{run.platesCount}</Text> plaques
                      </Text>
                    )}
                  </View>

                  {/* Specs du groupe */}
                  <View style={s.groupSpecs}>
                    {isImpDec && (
                      <>
                        <View style={s.groupSpecItem}>
                          <Text style={s.groupSpecLabel}>Impression :</Text>
                          <Text style={s.groupSpecValue}>{rvLabel(run.isRectoVerso, run.rectoVersoType)}</Text>
                        </View>
                        <View style={s.groupSpecItem}>
                          <Text style={s.groupSpecLabel}>Encre :</Text>
                          <Text style={s.groupSpecValue}>{run.inkMlPerPlate} ml/plaque</Text>
                        </View>
                      </>
                    )}
                    <View style={s.groupSpecItem}>
                      <Text style={s.groupSpecLabel}>Découpe :</Text>
                      <Text style={s.groupSpecValue}>
                        {run.cuttingTimePerPoseSeconds > 0 ? `${run.cuttingTimePerPoseSeconds} s/pose` : '—'}
                      </Text>
                    </View>
                    {run.platesCount != null && (
                      <View style={s.groupSpecItem}>
                        <Text style={s.groupSpecLabel}>Nb plaques :</Text>
                        <Text style={s.groupSpecValue}>{run.platesCount}</Text>
                      </View>
                    )}
                  </View>

                  {/* Produits du groupe */}
                  {slots.length > 0 && (
                    <>
                      <View style={s.groupProductsHead}>
                        <Text style={[s.groupProductsHeadCell, { flex: 2.5 }]}>Produit</Text>
                        <Text style={[s.groupProductsHeadCell, { flex: 1.5 }]}>Format à plat</Text>
                        <Text style={[s.groupProductsHeadCell, { flex: 1, textAlign: 'center' }]}>Qté</Text>
                        <Text style={[s.groupProductsHeadCell, { flex: 1, textAlign: 'center' }]}>Poses/plaque</Text>
                      </View>
                      {slots.map((p, j) => (
                        <View key={p.id} style={j % 2 === 0 ? s.groupProductRow : s.groupProductRowAlt}>
                          <Text style={[s.tableCell, { flex: 2.5 }]}>{p.productTypeName || '—'}</Text>
                          <Text style={[s.tableCell, { flex: 1.5, color: C.mid }]}>{p.flatWidth}×{p.flatHeight} mm</Text>
                          <Text style={[s.tableCell, { flex: 1, textAlign: 'center' }]}>{p.quantity}</Text>
                          <Text style={[s.tableCellBold, { flex: 1, textAlign: 'center' }]}>
                            {p.countPerPlateInGroup ?? p.itemsPerPlate ?? '—'}
                          </Text>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              )
            })}
          </View>
        ) : (
          /* ── PRODUIT UNIQUE ── */
          <View style={s.table}>
            <View style={[s.tableHead, { backgroundColor: C.dark }]}>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>PRODUIT</Text>
              <Text style={[s.tableHeadCell, { flex: 2.5 }]}>MATIÈRE</Text>
              <Text style={[s.tableHeadCell, { flex: 1.5 }]}>FORMAT À PLAT</Text>
              <Text style={[s.tableHeadCell, { flex: 1, textAlign: 'center' }]}>IMPRESSION</Text>
              <Text style={[s.tableHeadCell, { flex: 1, textAlign: 'center' }]}>DÉCOUPE (s/pose)</Text>
              <Text style={[s.tableHeadCell, { flex: 1, textAlign: 'center' }]}>POSES/PLAQUE</Text>
              <Text style={[s.tableHeadCell, { flex: 0.8, textAlign: 'right' }]}>PLAQUES</Text>
            </View>
            {quote.plate && (
              <View style={s.tableRow}>
                <Text style={[s.tableCell, { flex: 2 }]}>{quote.productType?.name || '—'}</Text>
                <Text style={[s.tableCell, { flex: 2.5, color: C.mid }]}>
                  {quote.plate.name}  {quote.plate.width}×{quote.plate.height}
                </Text>
                <Text style={[s.tableCell, { flex: 1.5 }]}>
                  {quote.flatWidth}×{quote.flatHeight} mm
                </Text>
                <Text style={[s.tableCell, { flex: 1, textAlign: 'center', color: C.purple }]}>
                  {quote.hasImpression ? rvLabel(quote.isRectoVerso, quote.rectoVersoType) : 'Non'}
                </Text>
                <Text style={[s.tableCell, { flex: 1, textAlign: 'center' }]}>
                  {quote.cuttingTimePerPoseSeconds != null && quote.cuttingTimePerPoseSeconds > 0
                    ? `${quote.cuttingTimePerPoseSeconds} s`
                    : '—'}
                </Text>
                <Text style={[s.tableCell, { flex: 1, textAlign: 'center' }]}>
                  {quote.itemsPerPlate ?? '—'}
                </Text>
                <Text style={[s.tableCellBold, { flex: 0.8, textAlign: 'right' }]}>
                  {quote.platesCount ?? '—'}
                </Text>
              </View>
            )}
            {quote.hasImpression && quote.inkMlPerPlate != null && (
              <View style={[s.tableRow, { backgroundColor: C.bg }]}>
                <Text style={[s.tableCell, { flex: 7, color: C.mid, fontSize: 7.5 }]}>
                  Encre : {quote.inkMlPerPlate} ml/plaque
                  {quote.hasVarnish ? '  +  Vernis' : ''}
                  {quote.hasFlatColor ? '  +  Blanc de fond' : ''}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── 2 COLONNES ── */}
        <View style={s.cols}>

          {/* COLONNE GAUCHE */}
          <View style={s.colLeft}>

            {/* FAÇONNAGE */}
            {quote.hasFaconnage && (
              <SectionCard title="FAÇONNAGE" bgColor={C.bg} textColor={C.mid}>
                {quote.assemblyTimePerPieceSeconds != null && (
                  <DataRow label="Temps façonnage (estimé)" value={`${quote.assemblyTimePerPieceSeconds} s/pce`} />
                )}
                {productionSheet.nbCollages != null && (
                  <DataRow label="Nombre de collages" value={String(productionSheet.nbCollages)} />
                )}
                {productionSheet.collagePerPLV != null && (
                  <DataRow label="Montant collage / PLV" value={`${productionSheet.collagePerPLV.toFixed(2)} €`} />
                )}
                <Notes text={productionSheet.faconnageNotes} />
              </SectionCard>
            )}

            {/* CONDITIONNEMENT */}
            {quote.hasConditionnement && (
              <SectionCard title="CONDITIONNEMENT" bgColor={C.blueBg} textColor={C.blue}>
                {quote.packTimePerPieceSeconds != null && (
                  <DataRow
                    label="Temps cond. (estimé)"
                    value={`${quote.packTimePerPieceSeconds} s/pce${quote.hasAssemblyNotice ? ' + notice' : ''}`}
                  />
                )}
                {productionSheet.conditionnementType && (
                  <DataRow label="Type" value={condLabel(productionSheet.conditionnementType)} />
                )}
                <Notes text={productionSheet.conditionnementNotes} />
              </SectionCard>
            )}

            {/* EMBALLAGE */}
            {quote.hasPackaging && (
              <SectionCard title="EMBALLAGE" bgColor={C.amberBg} textColor={C.amber}>
                {(() => {
                  const boxLabel =
                    quote.packagingBoxType === 'etui' ? 'Étui'
                    : quote.packagingBoxType === 'caisse' ? 'Caisse'
                    : quote.packagingBoxType === 'plaque_rainee' ? 'Plaque rainée'
                    : quote.packagingBoxType ?? '—'
                  const mat = quote.packagingMaterialType ?? '—'
                  const isExternal = mat === 'B' || mat === 'EB'
                  const sizeLabel = quote.packagingExternalSize
                    ? quote.packagingExternalSize.charAt(0).toUpperCase() + quote.packagingExternalSize.slice(1)
                    : null
                  return (
                    <>
                      <DataRow label="Type d'emballage" value={boxLabel} />
                      <DataRow label="Matière" value={isExternal ? `${mat}${sizeLabel ? ` — ${sizeLabel}` : ''}` : mat} />
                      {isExternal && <DataRow label="Approvisionnement" value="Fournisseur externe" />}
                      {!isExternal && quote.packagingPlate && <DataRow label="Plaque" value={quote.packagingPlate.name} />}
                      {quote.packagingQuantity != null && <DataRow label="Quantité" value={`${quote.packagingQuantity} pce(s)`} />}
                    </>
                  )
                })()}
              </SectionCard>
            )}

          </View>

          {/* COLONNE DROITE */}
          <View style={s.colRight}>

            {/* TRANSPORT */}
            {quote.transportDeliveries.length > 0 && (
              <SectionCard title="TRANSPORT" bgColor={C.purpleBg} textColor={C.purple}>
                {quote.transportDeliveries.map((d, i) => {
                  const modeLabel = d.transportMode === 'PACK30' ? 'Pack 30'
                    : d.transportMode === 'MESSAGERIE_PLUS' ? 'Messagerie+'
                    : 'Affrètement'
                  const unitsLabel = d.transportMode === 'AFFRETEMENT' ? 'pal.' : 'colis'
                  return (
                    <View key={i} style={[s.dataRow, { flexDirection: 'column', paddingVertical: 4 }]}>
                      <Text style={[s.dataValue, { fontSize: 8, marginBottom: 2 }]}>
                        {modeLabel} — Dept. {d.department}
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={s.dataLabel}>
                          {d.units} {unitsLabel}{d.weightKg != null && d.transportMode !== 'AFFRETEMENT' ? ` · ${d.weightKg} kg` : ''}
                          {d.optionsHT > 0 ? ` · options ${d.optionsHT.toFixed(2)} €` : ''}
                        </Text>
                        <Text style={s.dataValue}>{d.totalHT.toFixed(2)} €</Text>
                      </View>
                    </View>
                  )
                })}
                {quote.transportTotal != null && quote.transportDeliveries.length > 1 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 3, borderTopWidth: 1, borderTopColor: C.border }}>
                    <Text style={[s.dataLabel, { fontFamily: 'Helvetica-Bold' }]}>Total transport</Text>
                    <Text style={[s.dataValue, { color: C.purple }]}>{quote.transportTotal.toFixed(2)} €</Text>
                  </View>
                )}
              </SectionCard>
            )}

            {/* ACHATS */}
            {(quote.accessories.length > 0 || productionSheet.achatsNotes) && (
              <SectionCard title="ACHATS" bgColor={C.greenBg} textColor={C.green}>
                {quote.accessories.map((a, i) => (
                  <DataRow key={i} label={a.accessory.name} value={`× ${a.quantity}`} />
                ))}
                <Notes text={productionSheet.achatsNotes} />
              </SectionCard>
            )}

            {/* REMARQUES */}
            {productionSheet.remarques && (
              <SectionCard title="REMARQUES" bgColor={C.bg} textColor={C.mid}>
                <Text style={s.notesText}>{productionSheet.remarques}</Text>
              </SectionCard>
            )}

          </View>
        </View>

        {/* PLAN TECHNIQUE — sous le contenu principal */}
        {productionSheet.planImageUrl && (
          <SectionCard title="PLAN TECHNIQUE" bgColor={C.bg} textColor={C.mid}>
            <Image src={productionSheet.planImageUrl} style={s.planImg} />
          </SectionCard>
        )}

        {/* ── FOOTER ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Fiche de production — Dossier {quote.study?.number ?? quote.id}
            {quote.reference ? `  ·  ${quote.reference}` : ''}
            {quote.client ? `  ·  ${quote.client}` : ''}
          </Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber}/${totalPages}  ·  ${fmt(quote.createdAt)}`
          } />
        </View>

      </Page>
    </Document>
  )
}
