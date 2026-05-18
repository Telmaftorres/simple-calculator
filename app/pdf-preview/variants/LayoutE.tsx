'use client'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export type QuoteForPDF = {
  id: number
  reference: string | null
  client: string | null
  createdAt: Date
  quantity: number
  plvQuantity: number | null
  study: { number: string | null } | null
  productType: { name: string } | null
  hasFaconnage: boolean
  hasConditionnement: boolean
  hasBE: boolean
  beTimeMinutes: number
  batTimeMinutes: number
  hasAssemblyNotice: boolean
  hasPoseEtiquette: boolean
  hasPackaging: boolean
  packagingBoxType: string | null
  packagingMaterialType: string | null
  packagingQuantity: number | null
  assemblyTimePerPieceSeconds: number | null
  packTimePerPieceSeconds: number | null
  accessories: { accessory: { name: string }; quantity: number }[]
  products: {
    id: number
    productTypeName: string | null
    flatWidth: number
    flatHeight: number
    quantity: number
    plate: { name: string; width: number; height: number } | null
    platesCount: number | null
    cuttingTimePerPoseSeconds: number
    amalgameGroupIndex: number | null
    countPerPlateInGroup: number | null
  }[]
  amalgameRuns: {
    name: string
    hasImpression: boolean
    platesCount: number | null
    cuttingTimePerPoseSeconds: number
    machineTimeMinOverride: number | null
    isRectoVerso: boolean
    rectoVersoType: string | null
    plate: { name: string; width: number; height: number } | null
    items: { name: string; flatWidth: number; flatHeight: number; countPerPlate: number; quantityPerUnit: number }[]
  }[]
}

export type PSForPDF = {
  prodAssemblyTimePerPieceSeconds: number | null
  prodPackTimePerPieceSeconds: number | null
  prodMachineTimeMinOverride: number | null
  nbCollages: number | null
  collagePerPLV: number | null
  faconnageNotes: string | null
  conditionnementType: string | null
  conditionnementNotes: string | null
  packagingBoxLengthMm: number | null
  packagingBoxWidthMm: number | null
  packagingBoxHeightMm: number | null
  prodPackagingMaterial: string | null
  prodPackagingQuantity: number | null
  achatsNotes: string | null
  remarques: string | null
  delaiRealisation: string | null
}

type Q = QuoteForPDF
type PS = PSForPDF

const C = {
  dark: '#0f172a', mid: '#64748b', light: '#94a3b8', border: '#e2e8f0', bg: '#f8fafc', white: '#ffffff',
  violet: '#5b21b6', violetBg: '#ede9fe',
  blue: '#1e40af', blueBg: '#dbeafe',
  amber: '#92400e', amberBg: '#fef3c7',
  orange: '#9a3412', orangeBg: '#ffedd5',
  emerald: '#065f46', emeraldBg: '#d1fae5',
  pink: '#9d174d', pinkBg: '#fce7f3',
  indigo: '#312e81', indigoBg: '#e0e7ff',
}

const GROUP_COLORS = [
  { bg: '#ede9fe', text: '#5b21b6', bar: '#7c3aed' },
  { bg: '#fce7f3', text: '#9d174d', bar: '#be185d' },
  { bg: '#d1fae5', text: '#065f46', bar: '#059669' },
  { bg: '#fef3c7', text: '#92400e', bar: '#d97706' },
]

const s = StyleSheet.create({
  page: { padding: 0, fontFamily: 'Helvetica', fontSize: 9, color: C.dark, backgroundColor: C.white },
  header: { backgroundColor: C.white, padding: '8 22', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: C.dark },
  headerTitle: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.dark, letterSpacing: 1.2 },
  headerSub: { fontSize: 7.5, color: C.mid, marginTop: 2 },
  headerTag: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.white, backgroundColor: C.dark, padding: '3 10', borderRadius: 2 },
  metaStrip: { flexDirection: 'row', backgroundColor: C.bg, padding: '5 22', gap: 28, borderBottomWidth: 1, borderBottomColor: C.border },
  metaLabel: { fontSize: 7, color: C.mid },
  metaValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.dark, marginTop: 1 },
  body: { padding: '10 22 80 22', flex: 1, flexDirection: 'column' },
  sectionLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.mid, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 },
  // Bloc groupe
  groupBlock: { marginBottom: 8, borderWidth: 1, borderColor: C.border, borderRadius: 5, overflow: 'hidden', flex: 1 },
  groupBlockBar: { padding: '5 12', flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupBlockTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  groupBlockBadge: { fontSize: 7, fontFamily: 'Helvetica-Bold', padding: '2 8', borderRadius: 8 },
  groupBlockBody: { flexDirection: 'row', padding: '8 12', gap: 12, backgroundColor: C.white, flex: 1 },
  // Specs liste (option D)
  specsCol: { width: 155 },
  specList: { flexDirection: 'column' },
  specListRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  specListBar: { width: 3, borderRadius: 2, alignSelf: 'stretch', marginRight: 8 },
  specListLabel: { fontSize: 7.5, color: C.mid, width: 72 },
  specListValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', flex: 1, flexWrap: 'wrap', textAlign: 'right' },
  // Mini tableau produits
  miniTable: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 3, overflow: 'hidden', alignSelf: 'flex-start' },
  miniHead: { flexDirection: 'row', backgroundColor: C.bg, padding: '3 7', borderBottomWidth: 1, borderBottomColor: C.border },
  miniHCell: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.mid },
  miniRow: { flexDirection: 'row', padding: '3 7', borderTopWidth: 1, borderTopColor: C.border },
  miniRowAlt: { flexDirection: 'row', padding: '3 7', borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  miniCell: { fontSize: 8 },
  miniCellMid: { fontSize: 8, color: C.mid },
  miniCellBold: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  // Zone tracé
  traceBox: { width: 130, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, backgroundColor: '#f8fafc' },
  traceLabel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.light, letterSpacing: 0.8, textAlign: 'center', paddingTop: 5 },
  // Ops communes
  opsSection: { marginTop: 6 },
  opsGrid: { flexDirection: 'row', gap: 8, flex: 1, alignItems: 'stretch' },
  opCard: { borderRadius: 4, overflow: 'hidden', flex: 1 },
  opCardHead: { padding: '8 10' },
  opCardTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  opCardBody: { backgroundColor: C.white, padding: '8 10', borderWidth: 1, borderTopWidth: 0, borderColor: C.border, flex: 1 },
  opRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  opLabel: { fontSize: 8, color: C.mid },
  opValue: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  opNote: { fontSize: 7.5, color: C.mid, marginTop: 5, lineHeight: 1.5 },
  // Bande récap bas de page
  summaryBand: { position: 'absolute', bottom: 20, left: 0, right: 0, backgroundColor: C.bg, flexDirection: 'row', padding: '10 22', gap: 0, borderTopWidth: 2, borderTopColor: C.dark },
  summaryItem: { flex: 1, borderRightWidth: 1, borderRightColor: C.border, paddingRight: 22, marginRight: 22 },
  summaryItemLast: { flex: 1 },
  summaryLabel: { fontSize: 7.5, color: C.mid, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
  summaryValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.dark },
  summarySub: { fontSize: 7.5, color: C.mid, marginTop: 2 },
  footer: { position: 'absolute', bottom: 6, left: 22, right: 22, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 3 },
  footerText: { fontSize: 6, color: C.mid },
})

function SpecRow({ label, value, barColor, last }: { label: string; value: string; barColor: string; last?: boolean }) {
  return (
    <View style={[s.specListRow, last ? { borderBottomWidth: 0 } : {}]}>
      <View style={[s.specListBar, { backgroundColor: barColor }]} />
      <Text style={s.specListLabel}>{label}</Text>
      <Text style={s.specListValue}>{value}</Text>
    </View>
  )
}

function OpCard({ title, bgColor, textColor, children }: { title: string; bgColor: string; textColor: string; children: React.ReactNode }) {
  return (
    <View style={s.opCard}>
      <View style={[s.opCardHead, { backgroundColor: bgColor }]}>
        <Text style={[s.opCardTitle, { color: textColor }]}>{title}</Text>
      </View>
      <View style={s.opCardBody}>{children}</View>
    </View>
  )
}

function OpRow({ label, value }: { label: string; value: string }) {
  return <View style={s.opRow}><Text style={s.opLabel}>{label}</Text><Text style={s.opValue}>{value}</Text></View>
}

function fmtTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`
  return `${m} min`
}

function PageHeader({ quote, tag }: { quote: Q; tag: string }) {
  return (
    <>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>FICHE DE PRODUCTION</Text>
          <Text style={s.headerSub}>Dossier {quote.study?.number}  ·  {quote.reference}  ·  {new Date(quote.createdAt).toLocaleDateString('fr-FR')}</Text>
        </View>
        <Text style={s.headerTag}>EN COURS</Text>
      </View>
      <View style={s.metaStrip}>
        {[
          { label: 'CLIENT', value: quote.client ?? '—' },
          { label: 'TYPE PLV', value: quote.productType?.name ?? 'Multi-produits' },
          { label: 'QUANTITE', value: `${quote.plvQuantity ?? quote.quantity} ex` },
          { label: 'ETAPE', value: tag },
        ].map((item, i) => (
          <View key={i}>
            <Text style={s.metaLabel}>{item.label}</Text>
            <Text style={s.metaValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </>
  )
}

export function ProductionSheetPDFE({ quote, productionSheet: ps }: { quote: Q; productionSheet: PS }) {
  const runs = quote.amalgameRuns ?? []
  const standaloneProducts = quote.products.filter(p => p.amalgameGroupIndex === null)
  const qty = quote.plvQuantity ?? quote.quantity

  const totalPlates = runs.reduce((sum, r) => sum + (r.platesCount ?? 0), 0) +
    standaloneProducts.reduce((sum, p) => sum + (p.platesCount ?? 0), 0)

  const cuttingSeconds = runs.reduce((sum, r) => sum + r.cuttingTimePerPoseSeconds * (r.platesCount ?? 0), 0) +
    standaloneProducts.reduce((sum, p) => sum + p.cuttingTimePerPoseSeconds * (p.platesCount ?? 0), 0)
  const impressionSeconds = ps.prodMachineTimeMinOverride != null
    ? ps.prodMachineTimeMinOverride * 60
    : runs
        .filter(r => r.hasImpression)
        .reduce((sum, r) => sum + (r.machineTimeMinOverride ?? 0) * 60, 0)
  const faconnageSeconds = quote.hasFaconnage ? (ps.prodAssemblyTimePerPieceSeconds ?? 0) * qty : 0
  const conditionnementSeconds = quote.hasConditionnement ? (ps.prodPackTimePerPieceSeconds ?? 0) * qty : 0
  const beSeconds = quote.hasBE ? (quote.beTimeMinutes + quote.batTimeMinutes) * 60 : 0
  const totalProductionSeconds = cuttingSeconds + impressionSeconds + faconnageSeconds + conditionnementSeconds + beSeconds

  return (
    <Document>

      {/* ── PAGE 1 : IMPRESSION / DECOUPE ── */}
      <Page size="A4" orientation="landscape" style={s.page}>

        <PageHeader quote={quote} tag={`Impression / Decoupe  ·  ${totalPlates} pl.`} />

        <View style={s.body}>
          <Text style={s.sectionLabel}>Groupes de production</Text>

          <View style={{ flex: 1, flexDirection: 'column' }}>
          {/* BLOCS AMALGAME */}
          {runs.map((run, ri) => {
            const col = GROUP_COLORS[ri % GROUP_COLORS.length]
            const tableRows = run.items.length > 0
              ? run.items.map(item => ({ key: String(item.flatWidth) + item.name, name: item.name, fw: item.flatWidth, fh: item.flatHeight, qty: item.quantityPerUnit * qty, poses: item.countPerPlate }))
              : quote.products.filter(p => p.amalgameGroupIndex === ri).map(p => ({ key: String(p.id), name: p.productTypeName ?? '—', fw: p.flatWidth, fh: p.flatHeight, qty: p.quantity, poses: p.countPerPlateInGroup ?? '—' }))
            return (
              <View key={ri} style={s.groupBlock}>
                <View style={[s.groupBlockBar, { backgroundColor: col.bg, borderLeftWidth: 4, borderLeftColor: col.bar }]}>
                  <Text style={[s.groupBlockTitle, { color: col.text }]}>{run.name.replace(/\s*impression\s*/i, '').trim()}</Text>
                  <Text style={[s.groupBlockBadge, { backgroundColor: C.pinkBg, color: C.pink }]}>DECOUPE</Text>
                  {run.hasImpression && <Text style={[s.groupBlockBadge, { backgroundColor: C.blueBg, color: C.blue }]}>IMPRESSION</Text>}
                </View>
                <View style={s.groupBlockBody}>
                  <View style={s.specsCol}>
                    <View style={s.specList}>
                      <SpecRow label="Matiere" value={run.plate?.name ?? '—'} barColor={col.bar} />
                      <SpecRow label="Format plaque" value={`${run.plate?.width}x${run.plate?.height} mm`} barColor={col.bar} />
                      <SpecRow label="Nb plaques" value={`${run.platesCount} pl.`} barColor={col.bar} last={!run.isRectoVerso && !run.hasImpression} />
                      {run.isRectoVerso && <SpecRow label="R/V" value={run.rectoVersoType === 'identical' ? 'Identique' : 'Different'} barColor={col.bar} last />}
                      {run.hasImpression && !run.isRectoVerso && <SpecRow label="Impression" value="Recto seul" barColor={col.bar} last />}
                    </View>
                  </View>
                  <View style={s.miniTable}>
                    <View style={s.miniHead}>
                      <Text style={[s.miniHCell, { flex: 2.5 }]}>PRODUIT</Text>
                      <Text style={[s.miniHCell, { flex: 1.8 }]}>FORMAT A PLAT</Text>
                      <Text style={[s.miniHCell, { flex: 0.8, textAlign: 'center' }]}>QTE</Text>
                      <Text style={[s.miniHCell, { flex: 0.9, textAlign: 'center' }]}>POSES/PL.</Text>
                    </View>
                    {tableRows.map((row, ii) => (
                      <View key={row.key} style={ii % 2 === 0 ? s.miniRow : s.miniRowAlt}>
                        <Text style={[s.miniCell, { flex: 2.5 }]}>{row.name}</Text>
                        <Text style={[s.miniCellMid, { flex: 1.8 }]}>{row.fw}x{row.fh} mm</Text>
                        <Text style={[s.miniCell, { flex: 0.8, textAlign: 'center' }]}>{row.qty}</Text>
                        <Text style={[s.miniCellBold, { flex: 0.9, textAlign: 'center' }]}>{row.poses}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={s.traceBox}>
                    <Text style={s.traceLabel}>TRACE / GABARIT</Text>
                  </View>
                </View>
              </View>
            )
          })}

          {/* BLOCS STANDALONE */}
          {standaloneProducts.map((p, si) => {
            const col = GROUP_COLORS[(runs.length + si) % GROUP_COLORS.length]
            return (
              <View key={`s-${si}`} style={s.groupBlock}>
                <View style={[s.groupBlockBar, { backgroundColor: col.bg, borderLeftWidth: 4, borderLeftColor: col.bar }]}>
                  <Text style={[s.groupBlockTitle, { color: col.text }]}>{p.productTypeName}</Text>
                  <Text style={[s.groupBlockBadge, { backgroundColor: col.bar, color: C.white }]}>PRODUIT INDEPENDANT</Text>
                  <Text style={[s.groupBlockBadge, { backgroundColor: C.pinkBg, color: C.pink }]}>DECOUPE SEULE</Text>
                </View>
                <View style={s.groupBlockBody}>
                  <View style={s.specsCol}>
                    <View style={s.specList}>
                      <SpecRow label="Matiere" value={p.plate?.name ?? '—'} barColor={col.bar} />
                      <SpecRow label="Format plaque" value={`${p.plate?.width}x${p.plate?.height} mm`} barColor={col.bar} />
                      <SpecRow label="Format a plat" value={`${p.flatWidth}x${p.flatHeight} mm`} barColor={col.bar} />
                      <SpecRow label="Nb plaques" value={`${p.platesCount ?? '—'} pl.`} barColor={col.bar} />
                      <SpecRow label="Quantite" value={`${p.quantity} ex`} barColor={col.bar} last />
                    </View>
                  </View>
                  <View style={{ flex: 1 }} />
                  <View style={s.traceBox}>
                    <Text style={s.traceLabel}>TRACE / GABARIT</Text>
                  </View>
                </View>
              </View>
            )
          })}

          </View>
        </View>

        {/* Bande bas page 1 : recap découpe */}
        <View style={s.summaryBand}>
          <View style={s.summaryItem}>
            <Text style={s.summaryLabel}>Total plaques</Text>
            <Text style={s.summaryValue}>{totalPlates} pl.</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryLabel}>Temps decoupe estime</Text>
            <Text style={s.summaryValue}>{fmtTime(cuttingSeconds)}</Text>
          </View>
          {impressionSeconds > 0 && (
            <View style={s.summaryItem}>
              <Text style={s.summaryLabel}>Temps impression estime</Text>
              <Text style={s.summaryValue}>{fmtTime(impressionSeconds)}</Text>
            </View>
          )}
          <View style={s.summaryItemLast}>
            <Text style={s.summaryLabel}>Dossier</Text>
            <Text style={s.summaryValue}>{quote.study?.number}</Text>
            <Text style={s.summarySub}>{quote.reference}  ·  {quote.client}</Text>
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Fiche de production — Impression / Decoupe  ·  {quote.study?.number}  ·  {quote.reference}  ·  {quote.client}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>

      </Page>

      {/* ── PAGE 2 : FAÇONNAGE / CONDITIONNEMENT / DÉLAIS ── */}
      <Page size="A4" orientation="landscape" style={s.page}>

        <PageHeader quote={quote} tag="Faconnage / Conditionnement / Planification" />

        <View style={[s.body, { padding: '14 22 80 22' }]}>
          <Text style={s.sectionLabel}>Operations de finition</Text>
          <View style={s.opsGrid}>
            {quote.hasBE && (
              <OpCard title="BUREAU D'ETUDES" bgColor={C.indigoBg} textColor={C.indigo}>
                {quote.beTimeMinutes > 0 && <OpRow label="BE" value={`${quote.beTimeMinutes} min`} />}
                {quote.batTimeMinutes > 0 && <OpRow label="BAT" value={`${quote.batTimeMinutes} min`} />}
              </OpCard>
            )}
            {quote.hasFaconnage && (
              <OpCard title="FACONNAGE" bgColor={C.amberBg} textColor={C.amber}>
                <OpRow label="Temps / piece" value={`${ps.prodAssemblyTimePerPieceSeconds ?? quote.assemblyTimePerPieceSeconds ?? '—'} s`} />
                {ps.nbCollages != null && <OpRow label="Collages / PLV" value={String(ps.nbCollages)} />}
                {ps.faconnageNotes && <Text style={s.opNote}>{ps.faconnageNotes}</Text>}
              </OpCard>
            )}
            {quote.hasConditionnement && (
              <OpCard title="CONDITIONNEMENT" bgColor={C.blueBg} textColor={C.blue}>
                <OpRow label="Temps / piece" value={`${ps.prodPackTimePerPieceSeconds ?? quote.packTimePerPieceSeconds ?? '—'} s`} />
                {ps.conditionnementType && <OpRow label="Type" value={ps.conditionnementType === 'kit_unitaire' ? 'Kit unitaire' : ps.conditionnementType} />}
                {quote.hasAssemblyNotice && <OpRow label="Notice de montage" value="Oui" />}
                {quote.hasPoseEtiquette && <OpRow label="Pose etiquette" value="Oui" />}
                {ps.conditionnementNotes && <Text style={s.opNote}>{ps.conditionnementNotes}</Text>}
              </OpCard>
            )}
            {quote.hasPackaging && (
              <OpCard title="EMBALLAGE" bgColor={C.orangeBg} textColor={C.orange}>
                <OpRow label="Type" value={quote.packagingBoxType === 'etui' ? 'Etui' : quote.packagingBoxType ?? '—'} />
                <OpRow label="Matiere" value={ps.prodPackagingMaterial ?? quote.packagingMaterialType ?? '—'} />
                {(ps.prodPackagingQuantity ?? quote.packagingQuantity) != null && (
                  <OpRow label="Quantite" value={`${ps.prodPackagingQuantity ?? quote.packagingQuantity} pcs`} />
                )}
                {ps.packagingBoxLengthMm != null && (
                  <OpRow label="Dim." value={`${ps.packagingBoxLengthMm}x${ps.packagingBoxWidthMm}x${ps.packagingBoxHeightMm}`} />
                )}
              </OpCard>
            )}
            {(quote.accessories.length > 0 || ps.achatsNotes) && (
              <OpCard title="ACCESSOIRES" bgColor={C.emeraldBg} textColor={C.emerald}>
                {quote.accessories.map((a, i) => (
                  <OpRow key={i} label={a.accessory.name} value={`x ${a.quantity}`} />
                ))}
                {ps.achatsNotes && <Text style={s.opNote}>{ps.achatsNotes}</Text>}
              </OpCard>
            )}
            {ps.remarques && (
              <OpCard title="REMARQUES" bgColor={C.bg} textColor={C.mid}>
                <Text style={[s.opNote, { marginTop: 0 }]}>{ps.remarques}</Text>
              </OpCard>
            )}
          </View>
        </View>

        {/* Bande bas page 2 : temps total */}
        <View style={s.summaryBand}>
          <View style={s.summaryItem}>
            <Text style={s.summaryLabel}>Temps total production estime</Text>
            <Text style={s.summaryValue}>{fmtTime(totalProductionSeconds)}</Text>
            <Text style={s.summarySub}>
              Decoupe {fmtTime(cuttingSeconds)}
              {beSeconds > 0 ? `  +  BE ${fmtTime(beSeconds)}` : ''}
              {impressionSeconds > 0 ? `  +  Impression ${fmtTime(impressionSeconds)}` : ''}
              {faconnageSeconds > 0 ? `  +  Faconnage ${fmtTime(faconnageSeconds)}` : ''}
              {conditionnementSeconds > 0 ? `  +  Cond. ${fmtTime(conditionnementSeconds)}` : ''}
            </Text>
          </View>
          <View style={s.summaryItemLast}>
            <Text style={s.summaryLabel}>Dossier</Text>
            <Text style={s.summaryValue}>{quote.study?.number}</Text>
            <Text style={s.summarySub}>{quote.reference}  ·  {quote.client}</Text>
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Fiche de production — Faconnage / Planification  ·  {quote.study?.number}  ·  {quote.reference}  ·  {quote.client}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>

      </Page>

    </Document>
  )
}
