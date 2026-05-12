'use client'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { SAMPLE_QUOTE, SAMPLE_PS } from '../sample-data'

type Q = typeof SAMPLE_QUOTE
type PS = typeof SAMPLE_PS

const C = {
  dark: '#0f172a', mid: '#64748b', light: '#94a3b8', border: '#e2e8f0', bg: '#f8fafc', white: '#ffffff',
  violet: '#5b21b6', violetBg: '#ede9fe',
  blue: '#1e40af', blueBg: '#dbeafe',
  amber: '#92400e', amberBg: '#fef3c7',
  orange: '#9a3412', orangeBg: '#ffedd5',
  emerald: '#065f46', emeraldBg: '#d1fae5',
  pink: '#9d174d', pinkBg: '#fce7f3',
}

const GROUP_COLORS = [
  { bg: '#ede9fe', text: '#5b21b6', bar: '#7c3aed' },
  { bg: '#fce7f3', text: '#9d174d', bar: '#be185d' },
  { bg: '#d1fae5', text: '#065f46', bar: '#059669' },
  { bg: '#fef3c7', text: '#92400e', bar: '#d97706' },
]

const s = StyleSheet.create({
  page: { padding: 0, fontFamily: 'Helvetica', fontSize: 9, color: C.dark, backgroundColor: C.white },
  header: { backgroundColor: C.dark, padding: '8 22', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1.2 },
  headerSub: { fontSize: 7.5, color: C.light, marginTop: 2 },
  headerTag: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.dark, backgroundColor: '#22c55e', padding: '3 10', borderRadius: 12 },
  metaStrip: { flexDirection: 'row', backgroundColor: '#1e293b', padding: '5 22', gap: 28 },
  metaLabel: { fontSize: 7, color: '#64748b' },
  metaValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.white, marginTop: 1 },
  body: { padding: '10 22 80 22' },
  sectionLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.mid, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 },
  // Bloc groupe
  groupBlock: { marginBottom: 8, borderWidth: 1, borderColor: C.border, borderRadius: 5, overflow: 'hidden' },
  groupBlockBar: { padding: '5 12', flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupBlockTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  groupBlockBadge: { fontSize: 7, fontFamily: 'Helvetica-Bold', padding: '2 8', borderRadius: 8 },
  groupBlockBody: { flexDirection: 'row', padding: '8 12', gap: 12, backgroundColor: C.white },
  // Specs pills
  specsCol: { width: 160 },
  specsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 0 },
  specPill: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: C.bg, borderRadius: 4, padding: '3 7', borderWidth: 1, borderColor: C.border, marginBottom: 5 },
  specPillLabel: { fontSize: 7, color: C.mid },
  specPillValue: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  // Mini tableau produits
  miniTable: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 3, overflow: 'hidden', alignSelf: 'flex-start' },
  miniHead: { flexDirection: 'row', backgroundColor: '#1e293b', padding: '3 7' },
  miniHCell: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white },
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
  opsGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  opCard: { borderRadius: 4, overflow: 'hidden', marginBottom: 6, width: '18%' },
  opCardHead: { padding: '5 8' },
  opCardTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  opCardBody: { backgroundColor: C.white, padding: '5 8', borderWidth: 1, borderTopWidth: 0, borderColor: C.border },
  opRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  opLabel: { fontSize: 7.5, color: C.mid },
  opValue: { fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  opNote: { fontSize: 7, color: C.mid, marginTop: 3, lineHeight: 1.4 },
  // Bande récap bas de page
  summaryBand: { position: 'absolute', bottom: 20, left: 0, right: 0, backgroundColor: C.dark, flexDirection: 'row', padding: '10 22', gap: 0 },
  summaryItem: { flex: 1, borderRightWidth: 1, borderRightColor: '#334155', paddingRight: 22, marginRight: 22 },
  summaryItemLast: { flex: 1 },
  summaryLabel: { fontSize: 7.5, color: C.light, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
  summaryValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.white },
  summarySub: { fontSize: 7.5, color: '#64748b', marginTop: 2 },
  footer: { position: 'absolute', bottom: 6, left: 22, right: 22, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 3 },
  footerText: { fontSize: 6, color: '#475569' },
})

function SpecPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.specPill}>
      <Text style={s.specPillLabel}>{label}</Text>
      <Text style={s.specPillValue}>{value}</Text>
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

  const totalPlates = runs.reduce((sum, r) => sum + r.platesCount, 0) +
    standaloneProducts.reduce((sum, p) => sum + (p.platesCount ?? 0), 0)

  const cuttingSeconds = runs.reduce((sum, r) => sum + r.cuttingTimePerPoseSeconds * r.platesCount, 0) +
    standaloneProducts.reduce((sum, p) => sum + p.cuttingTimePerPoseSeconds * (p.platesCount ?? 0), 0)
  const faconnageSeconds = quote.hasFaconnage ? ps.prodAssemblyTimePerPieceSeconds * qty : 0
  const conditionnementSeconds = quote.hasConditionnement ? ps.prodPackTimePerPieceSeconds * qty : 0
  const totalProductionSeconds = cuttingSeconds + faconnageSeconds + conditionnementSeconds

  return (
    <Document>

      {/* ── PAGE 1 : IMPRESSION / DECOUPE ── */}
      <Page size="A4" orientation="landscape" style={s.page}>

        <PageHeader quote={quote} tag={`Impression / Decoupe  ·  ${totalPlates} pl.`} />

        <View style={s.body}>
          <Text style={s.sectionLabel}>Groupes de production</Text>

          {/* BLOCS AMALGAME */}
          {runs.map((run, ri) => {
            const products = quote.products.filter(p => p.amalgameGroupIndex === ri)
            const col = GROUP_COLORS[ri % GROUP_COLORS.length]
            return (
              <View key={ri} style={s.groupBlock}>
                <View style={[s.groupBlockBar, { backgroundColor: col.bg, borderLeftWidth: 4, borderLeftColor: col.bar }]}>
                  <Text style={[s.groupBlockTitle, { color: col.text }]}>{run.name}</Text>
                  <Text style={[s.groupBlockBadge, { backgroundColor: col.bar, color: C.white }]}>AMALGAME</Text>
                  {run.hasImpression && <Text style={[s.groupBlockBadge, { backgroundColor: C.blueBg, color: C.blue }]}>IMPRESSION</Text>}
                  <Text style={[s.groupBlockBadge, { backgroundColor: C.pinkBg, color: C.pink }]}>DECOUPE</Text>
                </View>
                <View style={s.groupBlockBody}>
                  <View style={s.specsCol}>
                    <View style={s.specsRow}>
                      <SpecPill label="Matiere" value={run.plate?.name ?? '—'} />
                      <SpecPill label="Format plaque" value={`${run.plate?.width}x${run.plate?.height} mm`} />
                      <SpecPill label="Nb plaques" value={`${run.platesCount} pl.`} />
                      {run.isRectoVerso && <SpecPill label="R/V" value={run.rectoVersoType === 'identical' ? 'Identique' : 'Different'} />}
                      {run.hasImpression && !run.isRectoVerso && <SpecPill label="Impression" value="Recto seul" />}
                    </View>
                  </View>
                  <View style={s.miniTable}>
                    <View style={s.miniHead}>
                      <Text style={[s.miniHCell, { flex: 2.5 }]}>PRODUIT</Text>
                      <Text style={[s.miniHCell, { flex: 1.8 }]}>FORMAT A PLAT</Text>
                      <Text style={[s.miniHCell, { flex: 0.8, textAlign: 'center' }]}>QTE</Text>
                      <Text style={[s.miniHCell, { flex: 0.9, textAlign: 'center' }]}>POSES/PL.</Text>
                    </View>
                    {products.map((p, pi) => (
                      <View key={p.id} style={pi % 2 === 0 ? s.miniRow : s.miniRowAlt}>
                        <Text style={[s.miniCell, { flex: 2.5 }]}>{p.productTypeName}</Text>
                        <Text style={[s.miniCellMid, { flex: 1.8 }]}>{p.flatWidth}x{p.flatHeight} mm</Text>
                        <Text style={[s.miniCell, { flex: 0.8, textAlign: 'center' }]}>{p.quantity}</Text>
                        <Text style={[s.miniCellBold, { flex: 0.9, textAlign: 'center' }]}>{p.countPerPlateInGroup}</Text>
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
                    <View style={s.specsRow}>
                      <SpecPill label="Matiere" value={p.plate?.name ?? '—'} />
                      <SpecPill label="Format plaque" value={`${p.plate?.width}x${p.plate?.height} mm`} />
                      <SpecPill label="Format a plat" value={`${p.flatWidth}x${p.flatHeight} mm`} />
                      <SpecPill label="Nb plaques" value={`${p.platesCount ?? '—'} pl.`} />
                      <SpecPill label="Quantite" value={`${p.quantity} ex`} />
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
            {quote.hasFaconnage && (
              <OpCard title="FACONNAGE" bgColor={C.amberBg} textColor={C.amber}>
                <OpRow label="Temps / piece" value={`${ps.prodAssemblyTimePerPieceSeconds} s`} />
                {ps.nbCollages != null && <OpRow label="Collages / PLV" value={String(ps.nbCollages)} />}
                {ps.collagePerPLV != null && <OpRow label="Cout collage / PLV" value={`${ps.collagePerPLV.toFixed(2)} EUR`} />}
                {ps.faconnageNotes && <Text style={s.opNote}>{ps.faconnageNotes}</Text>}
              </OpCard>
            )}
            {quote.hasConditionnement && (
              <OpCard title="CONDITIONNEMENT" bgColor={C.blueBg} textColor={C.blue}>
                <OpRow label="Temps / piece" value={`${ps.prodPackTimePerPieceSeconds} s`} />
                {ps.conditionnementType && <OpRow label="Type" value={ps.conditionnementType === 'kit_unitaire' ? 'Kit unitaire' : ps.conditionnementType} />}
                {ps.conditionnementNotes && <Text style={s.opNote}>{ps.conditionnementNotes}</Text>}
              </OpCard>
            )}
            {quote.hasPackaging && (
              <OpCard title="EMBALLAGE" bgColor={C.orangeBg} textColor={C.orange}>
                <OpRow label="Type" value={quote.packagingBoxType === 'etui' ? 'Etui' : quote.packagingBoxType ?? '—'} />
                <OpRow label="Matiere" value={ps.prodPackagingMaterial ?? quote.packagingMaterialType ?? '—'} />
                <OpRow label="Quantite" value={`${ps.prodPackagingQuantity ?? quote.packagingQuantity} pcs`} />
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

        {/* Bande bas page 2 : délai + temps total */}
        <View style={s.summaryBand}>
          <View style={s.summaryItem}>
            <Text style={s.summaryLabel}>Delai de realisation</Text>
            <Text style={s.summaryValue}>{ps.delaiRealisation ?? '—'}</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryLabel}>Temps total production estime</Text>
            <Text style={s.summaryValue}>{fmtTime(totalProductionSeconds)}</Text>
            <Text style={s.summarySub}>
              Decoupe {fmtTime(cuttingSeconds)}
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
