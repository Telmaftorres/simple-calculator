'use client'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { SAMPLE_QUOTE, SAMPLE_PS } from '../sample-data'

type Q = typeof SAMPLE_QUOTE
type PS = typeof SAMPLE_PS

const C = {
  dark: '#0f172a', mid: '#64748b', light: '#94a3b8', border: '#e2e8f0', bg: '#f8fafc', white: '#ffffff',
  emerald: '#065f46', emeraldBg: '#d1fae5',
  violet: '#5b21b6', violetBg: '#ede9fe',
  orange: '#9a3412', orangeBg: '#ffedd5',
  blue: '#1e40af', blueBg: '#dbeafe',
  amber: '#92400e', amberBg: '#fef3c7',
}

const s = StyleSheet.create({
  page: { padding: '0', fontFamily: 'Helvetica', fontSize: 9, color: C.dark, backgroundColor: C.white },
  header: { backgroundColor: C.dark, padding: '14 24', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1.5 },
  headerSub: { fontSize: 9, color: '#94a3b8', marginTop: 3 },
  statusPill: { backgroundColor: '#22c55e', padding: '5 14', borderRadius: 20 },
  statusText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.dark },
  metaStrip: { flexDirection: 'row', backgroundColor: '#1e293b', padding: '8 24', gap: 32 },
  metaLabel: { fontSize: 7.5, color: '#64748b' },
  metaValue: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.white, marginTop: 1 },
  body: { padding: '14 24', flex: 1 },
  sectionLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.mid, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  // Nomenclature
  nomTable: { borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  nomHead: { flexDirection: 'row', backgroundColor: C.dark, padding: '5 10' },
  nomHCell: { color: C.white, fontFamily: 'Helvetica-Bold', fontSize: 8 },
  nomRow: { flexDirection: 'row', padding: '5 10', borderTopWidth: 1, borderTopColor: C.border },
  nomRowAlt: { flexDirection: 'row', padding: '5 10', borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  nomGroupBar: { flexDirection: 'row', alignItems: 'center', padding: '5 10', borderTopWidth: 1, borderTopColor: C.border, backgroundColor: '#f5f3ff' },
  nomGroupBadge: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.violet, backgroundColor: C.violetBg, padding: '2 7', borderRadius: 10, marginLeft: 8 },
  nomCell: { fontSize: 9 },
  nomCellMid: { fontSize: 9, color: C.mid },
  nomCellBold: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  // Cartes opérations
  opsGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  opCard: { borderRadius: 6, overflow: 'hidden', marginBottom: 10, flex: 1, minWidth: 120 },
  opCardHead: { padding: '6 10' },
  opCardTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8 },
  opCardBody: { backgroundColor: C.white, padding: '7 10', borderWidth: 1, borderTopWidth: 0, borderColor: C.border },
  opRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  opLabel: { fontSize: 8.5, color: C.mid },
  opValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  opNote: { fontSize: 8, color: C.mid, marginTop: 5, lineHeight: 1.4 },
  footer: { position: 'absolute', bottom: 8, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 4 },
  footerText: { fontSize: 7, color: C.light },
})

function OpCard({ title, bgColor, textColor, children }: {
  title: string; bgColor: string; textColor: string; children: React.ReactNode
}) {
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

export function ProductionSheetPDFB({ quote, productionSheet: ps }: { quote: Q; productionSheet: PS }) {
  const runs = quote.amalgameRuns ?? []

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>

        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>FICHE DE PRODUCTION</Text>
            <Text style={s.headerSub}>Dossier {quote.study?.number}  ·  {quote.reference}  ·  {new Date(quote.createdAt).toLocaleDateString('fr-FR')}</Text>
          </View>
          <View style={s.statusPill}>
            <Text style={s.statusText}>EN COURS</Text>
          </View>
        </View>

        <View style={s.metaStrip}>
          {[
            { label: 'CLIENT', value: quote.client ?? '—' },
            { label: 'TYPE PLV', value: quote.productType?.name ?? 'Multi-produits' },
            { label: 'QUANTITE', value: `${quote.plvQuantity ?? quote.quantity} ex` },
            { label: 'MONTANT HT', value: `${quote.totalCost?.toFixed(2)} EUR` },
          ].map((item, i) => (
            <View key={i}>
              <Text style={s.metaLabel}>{item.label}</Text>
              <Text style={s.metaValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={s.body}>

          <Text style={s.sectionLabel}>Nomenclature matiere</Text>
          <View style={s.nomTable}>
            <View style={s.nomHead}>
              <Text style={[s.nomHCell, { flex: 2.5 }]}>PRODUIT</Text>
              <Text style={[s.nomHCell, { flex: 2.5 }]}>MATIERE</Text>
              <Text style={[s.nomHCell, { flex: 1.5 }]}>FORMAT A PLAT</Text>
              <Text style={[s.nomHCell, { flex: 0.8, textAlign: 'center' }]}>QTE</Text>
              <Text style={[s.nomHCell, { flex: 1, textAlign: 'center' }]}>POSES/PL.</Text>
              <Text style={[s.nomHCell, { flex: 1, textAlign: 'center' }]}>DECOUPE</Text>
              <Text style={[s.nomHCell, { flex: 0.8, textAlign: 'right' }]}>PLAQUES</Text>
            </View>
            {runs.map((run, ri) => (
              <View key={ri}>
                <View style={s.nomGroupBar}>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.violet }}>{run.name}</Text>
                  <Text style={s.nomGroupBadge}>{run.hasImpression ? 'IMP. + DECOUPE' : 'DECOUPE SEULE'}</Text>
                  <Text style={{ fontSize: 8, color: C.mid, marginLeft: 'auto' }}>
                    {run.plate?.name}  {run.plate?.width}x{run.plate?.height}  ·  {run.platesCount} pl.  ·  {run.cuttingTimePerPoseSeconds}s/pose{run.hasImpression ? `  ·  ${run.inkMlPerPlate}ml/pl.` : ''}
                  </Text>
                </View>
                {quote.products.filter(p => p.amalgameGroupIndex === ri).map((p, pi) => (
                  <View key={p.id} style={pi % 2 === 0 ? s.nomRow : s.nomRowAlt}>
                    <Text style={[s.nomCell, { flex: 2.5, paddingLeft: 14 }]}>-> {p.productTypeName}</Text>
                    <Text style={[s.nomCellMid, { flex: 2.5 }]}>{p.plate?.name}  {p.plate?.width}x{p.plate?.height}</Text>
                    <Text style={[s.nomCell, { flex: 1.5 }]}>{p.flatWidth}x{p.flatHeight} mm</Text>
                    <Text style={[s.nomCell, { flex: 0.8, textAlign: 'center' }]}>{p.quantity}</Text>
                    <Text style={[s.nomCellBold, { flex: 1, textAlign: 'center' }]}>{p.countPerPlateInGroup}</Text>
                    <Text style={[s.nomCellMid, { flex: 1, textAlign: 'center' }]}>—</Text>
                    <Text style={[s.nomCellMid, { flex: 0.8, textAlign: 'right' }]}>—</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <Text style={s.sectionLabel}>Operations</Text>
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
                <OpRow label="Prix unitaire" value={`${ps.prodPackagingUnitPrice?.toFixed(2) ?? '—'} EUR`} />
                {ps.packagingBoxLengthMm != null && (
                  <OpRow label="Dimensions" value={`${ps.packagingBoxLengthMm}x${ps.packagingBoxWidthMm}x${ps.packagingBoxHeightMm} mm`} />
                )}
              </OpCard>
            )}
            {quote.transportDeliveries.length > 0 && (
              <OpCard title="TRANSPORT" bgColor={C.violetBg} textColor={C.violet}>
                {quote.transportDeliveries.map((d, i) => (
                  <View key={i}>
                    <OpRow label={d.transportMode === 'PACK30' ? 'Pack 30' : 'Messagerie+'} value={`Dept. ${d.department}`} />
                    <OpRow label={`${d.units} colis · ${d.weightKg}kg`} value={`${d.totalHT.toFixed(2)} EUR`} />
                  </View>
                ))}
                {ps.prodTransportNotes && <Text style={s.opNote}>{ps.prodTransportNotes}</Text>}
              </OpCard>
            )}
            {(quote.accessories.length > 0 || ps.achatsNotes) && (
              <OpCard title="ACHATS" bgColor={C.emeraldBg} textColor={C.emerald}>
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

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Fiche de production · {quote.study?.number} · {quote.reference} · {quote.client}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>

      </Page>
    </Document>
  )
}
