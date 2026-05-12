'use client'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { SAMPLE_QUOTE, SAMPLE_PS } from '../sample-data'

type Q = typeof SAMPLE_QUOTE
type PS = typeof SAMPLE_PS

const C = { black: '#000000', dark: '#1e293b', mid: '#64748b', light: '#cbd5e1', bg: '#f8fafc', white: '#ffffff', line: '#e2e8f0' }

const s = StyleSheet.create({
  page: { padding: '16 24', fontFamily: 'Helvetica', fontSize: 10, color: C.dark, backgroundColor: C.white },
  // Header
  header: { marginBottom: 10 },
  headerTop: { backgroundColor: C.black, padding: '10 14', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 2 },
  headerRef: { fontSize: 9.5, color: '#94a3b8', marginTop: 3 },
  headerStatus: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.black, backgroundColor: '#22c55e', padding: '4 10', borderRadius: 2 },
  headerMeta: { flexDirection: 'row', borderWidth: 1, borderColor: C.black, borderTopWidth: 0 },
  headerMetaCell: { flex: 1, padding: '6 10', borderRightWidth: 1, borderRightColor: C.black },
  headerMetaLabel: { fontSize: 7.5, color: C.mid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  headerMetaValue: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  // Tableau nomenclature
  section: { marginBottom: 10 },
  sectionTitle: { backgroundColor: C.dark, padding: '4 10', fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1, marginBottom: 0 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: C.line, padding: '4 10' },
  tableRowGray: { flexDirection: 'row', borderBottomWidth: 1, borderColor: C.line, padding: '4 10', backgroundColor: C.bg },
  tableHeadRow: { flexDirection: 'row', padding: '4 10', backgroundColor: '#e2e8f0' },
  cell: { fontSize: 10 },
  cellBold: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  cellMid: { fontSize: 10, color: C.mid },
  // Grille ops
  opsGrid: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  opBox: { flex: 1, borderWidth: 1, borderColor: C.dark },
  opBoxTitle: { backgroundColor: C.dark, padding: '4 10', fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 0.5 },
  opBoxBody: { padding: '5 10' },
  opRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: C.line },
  opLabel: { color: C.mid, fontSize: 9.5 },
  opValue: { fontFamily: 'Helvetica-Bold', fontSize: 9.5 },
  // Amalgame
  amalgameHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: '4 10', borderBottomWidth: 1, borderBottomColor: C.line },
  amalgameBadge: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#6d28d9', backgroundColor: '#ede9fe', padding: '2 6', borderRadius: 10, marginLeft: 8 },
  // Footer
  footer: { position: 'absolute', bottom: 10, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.line, paddingTop: 4 },
  footerText: { fontSize: 7.5, color: C.mid },
})

function OpRow({ label, value }: { label: string; value: string }) {
  return <View style={s.opRow}><Text style={s.opLabel}>{label}</Text><Text style={s.opValue}>{value}</Text></View>
}

export function ProductionSheetPDFA({ quote, productionSheet: ps }: { quote: Q; productionSheet: PS }) {
  const runs = (quote.amalgameRuns ?? [])
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* HEADER */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View>
              <Text style={s.headerTitle}>FICHE DE PRODUCTION</Text>
              <Text style={s.headerRef}>Dossier {quote.study?.number}  ·  {quote.reference}</Text>
            </View>
            <Text style={s.headerStatus}>EN COURS</Text>
          </View>
          <View style={s.headerMeta}>
            {[
              { label: 'Client', value: quote.client ?? '—' },
              { label: 'Type PLV', value: quote.productType?.name ?? 'Multi-produits' },
              { label: 'Quantité', value: `${quote.plvQuantity ?? quote.quantity} ex` },
              { label: 'Montant HT', value: `${quote.totalCost?.toFixed(2)} €` },
              { label: 'Date', value: new Date(quote.createdAt).toLocaleDateString('fr-FR') },
            ].map((item, i, arr) => (
              <View key={i} style={[s.headerMetaCell, i === arr.length - 1 ? { borderRightWidth: 0 } : {}]}>
                <Text style={s.headerMetaLabel}>{item.label}</Text>
                <Text style={s.headerMetaValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* NOMENCLATURE */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>NOMENCLATURE</Text>
          <View style={[s.tableHeadRow, { borderWidth: 1, borderColor: C.dark, borderTopWidth: 0 }]}>
            <Text style={[s.cell, { flex: 2, fontFamily: 'Helvetica-Bold', fontSize: 9 }]}>PRODUIT</Text>
            <Text style={[s.cell, { flex: 2.5, fontFamily: 'Helvetica-Bold', fontSize: 9 }]}>MATIERE</Text>
            <Text style={[s.cell, { flex: 1.2, fontFamily: 'Helvetica-Bold', fontSize: 9 }]}>FORMAT</Text>
            <Text style={[s.cell, { flex: 0.8, fontFamily: 'Helvetica-Bold', fontSize: 9, textAlign: 'center' }]}>QTE</Text>
            <Text style={[s.cell, { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 9, textAlign: 'center' }]}>POSES/PL.</Text>
            <Text style={[s.cell, { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 9, textAlign: 'right' }]}>PLAQUES</Text>
          </View>
          {runs.map((run, ri) => (
            <View key={ri} style={{ borderWidth: 1, borderTopWidth: 0, borderColor: C.dark }}>
              <View style={s.amalgameHeader}>
                <Text style={[s.cellBold, { fontSize: 9.5 }]}>{run.name}</Text>
                <Text style={s.amalgameBadge}>AMALGAME - {run.hasImpression ? 'Impr. + Decoupe' : 'Decoupe seule'}</Text>
                <Text style={[s.cellMid, { marginLeft: 'auto', fontSize: 8.5 }]}>
                  {run.plate?.name}  {run.plate?.width}×{run.plate?.height}  ·  {run.platesCount} plaques  ·  {run.cuttingTimePerPoseSeconds}s/pose
                  {run.hasImpression ? `  ·  ${run.inkMlPerPlate}ml/pl.` : ''}
                </Text>
              </View>
              {quote.products.filter(p => p.amalgameGroupIndex === ri).map((p, pi) => (
                <View key={p.id} style={pi % 2 === 0 ? s.tableRow : s.tableRowGray}>
                  <Text style={[s.cell, { flex: 2, paddingLeft: 10 }]}>↳ {p.productTypeName}</Text>
                  <Text style={[s.cellMid, { flex: 2.5 }]}>{p.plate?.name}  {p.plate?.width}×{p.plate?.height}</Text>
                  <Text style={[s.cell, { flex: 1.2 }]}>{p.flatWidth}×{p.flatHeight} mm</Text>
                  <Text style={[s.cell, { flex: 0.8, textAlign: 'center' }]}>{p.quantity}</Text>
                  <Text style={[s.cellBold, { flex: 1, textAlign: 'center' }]}>{p.countPerPlateInGroup ?? '—'}</Text>
                  <Text style={[s.cellMid, { flex: 1, textAlign: 'right' }]}>—</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* OPÉRATIONS */}
        <View style={s.opsGrid}>
          {quote.hasFaconnage && (
            <View style={s.opBox}>
              <Text style={s.opBoxTitle}>FAÇONNAGE</Text>
              <View style={s.opBoxBody}>
                <OpRow label="Temps / pièce" value={`${ps.prodAssemblyTimePerPieceSeconds} s`} />
                {ps.nbCollages != null && <OpRow label="Collages / PLV" value={String(ps.nbCollages)} />}
                {ps.collagePerPLV != null && <OpRow label="Coût collage / PLV" value={`${ps.collagePerPLV.toFixed(2)} €`} />}
                {ps.faconnageNotes ? <Text style={{ fontSize: 9, color: C.mid, marginTop: 4, lineHeight: 1.4 }}>{ps.faconnageNotes}</Text> : null}
              </View>
            </View>
          )}
          {quote.hasConditionnement && (
            <View style={s.opBox}>
              <Text style={s.opBoxTitle}>CONDITIONNEMENT</Text>
              <View style={s.opBoxBody}>
                <OpRow label="Temps / pièce" value={`${ps.prodPackTimePerPieceSeconds} s`} />
                {ps.conditionnementType && <OpRow label="Type" value={ps.conditionnementType === 'kit_unitaire' ? 'Kit unitaire' : ps.conditionnementType} />}
                {ps.conditionnementNotes ? <Text style={{ fontSize: 9, color: C.mid, marginTop: 4, lineHeight: 1.4 }}>{ps.conditionnementNotes}</Text> : null}
              </View>
            </View>
          )}
          {quote.hasPackaging && (
            <View style={s.opBox}>
              <Text style={s.opBoxTitle}>EMBALLAGE</Text>
              <View style={s.opBoxBody}>
                <OpRow label="Type" value={quote.packagingBoxType === 'etui' ? 'Étui' : quote.packagingBoxType ?? '—'} />
                <OpRow label="Matière" value={ps.prodPackagingMaterial ?? quote.packagingMaterialType ?? '—'} />
                <OpRow label="Quantité" value={`${ps.prodPackagingQuantity ?? quote.packagingQuantity} pcs`} />
                <OpRow label="Prix unitaire" value={`${ps.prodPackagingUnitPrice?.toFixed(2) ?? '—'} €`} />
                {ps.packagingBoxLengthMm != null && (
                  <OpRow label="Dimensions" value={`${ps.packagingBoxLengthMm}×${ps.packagingBoxWidthMm}×${ps.packagingBoxHeightMm} mm`} />
                )}
              </View>
            </View>
          )}
          {quote.transportDeliveries.length > 0 && (
            <View style={s.opBox}>
              <Text style={s.opBoxTitle}>TRANSPORT</Text>
              <View style={s.opBoxBody}>
                {quote.transportDeliveries.map((d, i) => (
                  <View key={i}>
                    <OpRow
                      label={d.transportMode === 'PACK30' ? 'Pack 30' : 'Messagerie+'}
                      value={`Dept. ${d.department}`}
                    />
                    <OpRow label={`${d.units} colis`} value={`${d.totalHT.toFixed(2)} €`} />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* REMARQUES */}
        {ps.remarques && (
          <View style={{ borderWidth: 1, borderColor: C.dark, marginBottom: 8 }}>
            <Text style={s.sectionTitle}>REMARQUES</Text>
            <Text style={{ fontSize: 10, padding: '5 10', color: C.mid }}>{ps.remarques}</Text>
          </View>
        )}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Fiche de production · {quote.study?.number} · {quote.reference} · {quote.client}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
