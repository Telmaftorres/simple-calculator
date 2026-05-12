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
  rose: '#9f1239', roseBg: '#ffe4e6',
}

const s = StyleSheet.create({
  page: { padding: '0', fontFamily: 'Helvetica', fontSize: 8, color: C.dark, backgroundColor: C.white },
  // Header bandeau pleine largeur
  header: { backgroundColor: C.dark, padding: '12 24', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: {},
  headerTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1.5 },
  headerSub: { fontSize: 8, color: '#94a3b8', marginTop: 3 },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  statusPill: { backgroundColor: '#22c55e', padding: '4 12', borderRadius: 20 },
  statusText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.dark },
  headerMeta: { flexDirection: 'row', backgroundColor: '#1e293b', padding: '6 24', gap: 32 },
  metaItem: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  metaLabel: { fontSize: 7, color: '#64748b' },
  metaValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.white },
  // Corps
  body: { padding: '12 24', flex: 1 },
  // Nomenclature
  nomTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.dark, marginBottom: 5, letterSpacing: 0.5 },
  nomTable: { borderWidth: 1, borderColor: C.border, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  nomHead: { flexDirection: 'row', backgroundColor: C.dark, padding: '4 8' },
  nomHCell: { color: C.white, fontFamily: 'Helvetica-Bold', fontSize: 7 },
  nomRow: { flexDirection: 'row', padding: '4 8', borderTopWidth: 1, borderTopColor: C.border },
  nomRowAlt: { flexDirection: 'row', padding: '4 8', borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  nomGroupBar: { flexDirection: 'row', alignItems: 'center', padding: '4 8', borderTopWidth: 1, borderTopColor: C.border, backgroundColor: '#f5f3ff' },
  nomGroupBadge: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.violet, backgroundColor: C.violetBg, padding: '1.5 6', borderRadius: 10, marginLeft: 8 },
  nomCell: { fontSize: 8 },
  // Grille couleurs
  opsGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  opCard: { borderRadius: 6, overflow: 'hidden', marginBottom: 8, minWidth: 130 },
  opCardHead: { padding: '5 8', flexDirection: 'row', alignItems: 'center', gap: 4 },
  opCardEmoji: { fontSize: 10 },
  opCardTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  opCardBody: { backgroundColor: C.white, padding: '5 8', borderWidth: 1, borderTopWidth: 0, borderRadius: '0 0 6 6', borderColor: C.border },
  opRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  opLabel: { fontSize: 7.5, color: C.mid },
  opValue: { fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  opNote: { fontSize: 7, color: C.mid, marginTop: 3, lineHeight: 1.4 },
  // Footer
  footer: { position: 'absolute', bottom: 8, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 4 },
  footerText: { fontSize: 6, color: C.light },
})

function OpCard({ emoji, title, bgColor, textColor, children }: {
  emoji: string; title: string; bgColor: string; textColor: string; children: React.ReactNode
}) {
  return (
    <View style={[s.opCard, { flex: 1 }]}>
      <View style={[s.opCardHead, { backgroundColor: bgColor }]}>
        <Text style={s.opCardEmoji}>{emoji}</Text>
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

        {/* HEADER */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>FICHE DE PRODUCTION</Text>
            <Text style={s.headerSub}>Dossier {quote.study?.number}  ·  {quote.reference}  ·  {new Date(quote.createdAt).toLocaleDateString('fr-FR')}</Text>
          </View>
          <View style={s.headerRight}>
            <View style={s.statusPill}>
              <Text style={s.statusText}>● EN COURS</Text>
            </View>
          </View>
        </View>

        <View style={s.headerMeta}>
          {[
            { label: 'CLIENT', value: quote.client ?? '—' },
            { label: 'TYPE PLV', value: quote.productType?.name ?? 'Multi-produits' },
            { label: 'QUANTITÉ', value: `${quote.plvQuantity ?? quote.quantity} ex` },
            { label: 'MONTANT HT', value: `${quote.totalCost?.toFixed(2)} €` },
          ].map((item, i) => (
            <View key={i} style={s.metaItem}>
              <Text style={s.metaLabel}>{item.label}</Text>
              <Text style={s.metaValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={s.body}>

          {/* NOMENCLATURE */}
          <Text style={s.nomTitle}>NOMENCLATURE MATIÈRE</Text>
          <View style={s.nomTable}>
            <View style={s.nomHead}>
              <Text style={[s.nomHCell, { flex: 2.5 }]}>PRODUIT</Text>
              <Text style={[s.nomHCell, { flex: 2.5 }]}>MATIÈRE</Text>
              <Text style={[s.nomHCell, { flex: 1.5 }]}>FORMAT À PLAT</Text>
              <Text style={[s.nomHCell, { flex: 0.8, textAlign: 'center' }]}>QTÉ</Text>
              <Text style={[s.nomHCell, { flex: 1, textAlign: 'center' }]}>POSES/PL.</Text>
              <Text style={[s.nomHCell, { flex: 1, textAlign: 'center' }]}>DÉCOUPE</Text>
              <Text style={[s.nomHCell, { flex: 0.8, textAlign: 'right' }]}>PLAQUES</Text>
            </View>
            {runs.map((run, ri) => (
              <View key={ri}>
                <View style={s.nomGroupBar}>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.violet }}>{run.name}</Text>
                  <Text style={s.nomGroupBadge}>{run.hasImpression ? 'IMP. + DÉCOUPE' : 'DÉCOUPE SEULE'}</Text>
                  <Text style={{ fontSize: 7, color: C.mid, marginLeft: 'auto' }}>
                    {run.plate?.name} · {run.platesCount} pl. · {run.cuttingTimePerPoseSeconds}s/pose{run.hasImpression ? ` · ${run.inkMlPerPlate}ml/pl.` : ''}
                  </Text>
                </View>
                {quote.products.filter(p => p.amalgameGroupIndex === ri).map((p, pi) => (
                  <View key={p.id} style={pi % 2 === 0 ? s.nomRow : s.nomRowAlt}>
                    <Text style={[s.nomCell, { flex: 2.5, paddingLeft: 12 }]}>↳ {p.productTypeName}</Text>
                    <Text style={[s.nomCell, { flex: 2.5, color: C.mid }]}>{p.plate?.name}  {p.plate?.width}×{p.plate?.height}</Text>
                    <Text style={[s.nomCell, { flex: 1.5 }]}>{p.flatWidth}×{p.flatHeight} mm</Text>
                    <Text style={[s.nomCell, { flex: 0.8, textAlign: 'center' }]}>{p.quantity}</Text>
                    <Text style={[s.nomCell, { flex: 1, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>{p.countPerPlateInGroup}</Text>
                    <Text style={[s.nomCell, { flex: 1, textAlign: 'center', color: C.mid }]}>—</Text>
                    <Text style={[s.nomCell, { flex: 0.8, textAlign: 'right', color: C.mid }]}>—</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* CARTES OPÉRATIONS */}
          <View style={s.opsGrid}>
            {quote.hasFaconnage && (
              <OpCard emoji="🔧" title="FAÇONNAGE" bgColor={C.amberBg} textColor={C.amber}>
                <OpRow label="Temps / pièce" value={`${ps.prodAssemblyTimePerPieceSeconds} s`} />
                {ps.nbCollages != null && <OpRow label="Collages / PLV" value={String(ps.nbCollages)} />}
                {ps.collagePerPLV != null && <OpRow label="Coût collage / PLV" value={`${ps.collagePerPLV.toFixed(2)} €`} />}
                {ps.faconnageNotes && <Text style={s.opNote}>{ps.faconnageNotes}</Text>}
              </OpCard>
            )}
            {quote.hasConditionnement && (
              <OpCard emoji="📫" title="CONDITIONNEMENT" bgColor={C.blueBg} textColor={C.blue}>
                <OpRow label="Temps / pièce" value={`${ps.prodPackTimePerPieceSeconds} s`} />
                {ps.conditionnementType && <OpRow label="Type" value={ps.conditionnementType === 'kit_unitaire' ? 'Kit unitaire' : ps.conditionnementType} />}
                {ps.conditionnementNotes && <Text style={s.opNote}>{ps.conditionnementNotes}</Text>}
              </OpCard>
            )}
            {quote.hasPackaging && (
              <OpCard emoji="📦" title="EMBALLAGE" bgColor={C.orangeBg} textColor={C.orange}>
                <OpRow label="Type" value={quote.packagingBoxType === 'etui' ? 'Étui' : quote.packagingBoxType ?? '—'} />
                <OpRow label="Matière" value={ps.prodPackagingMaterial ?? quote.packagingMaterialType ?? '—'} />
                <OpRow label="Quantité" value={`${ps.prodPackagingQuantity ?? quote.packagingQuantity} pcs`} />
                <OpRow label="Prix unitaire" value={`${ps.prodPackagingUnitPrice?.toFixed(2) ?? '—'} €`} />
                {ps.packagingBoxLengthMm != null && (
                  <OpRow label="Dimensions" value={`${ps.packagingBoxLengthMm}×${ps.packagingBoxWidthMm}×${ps.packagingBoxHeightMm} mm`} />
                )}
              </OpCard>
            )}
            {quote.transportDeliveries.length > 0 && (
              <OpCard emoji="🚚" title="TRANSPORT" bgColor={C.violetBg} textColor={C.violet}>
                {quote.transportDeliveries.map((d, i) => (
                  <View key={i}>
                    <OpRow label={d.transportMode === 'PACK30' ? 'Pack 30' : 'Messagerie+'} value={`Dept. ${d.department}`} />
                    <OpRow label={`${d.units} colis · ${d.weightKg}kg`} value={`${d.totalHT.toFixed(2)} €`} />
                  </View>
                ))}
                {ps.prodTransportNotes && <Text style={s.opNote}>{ps.prodTransportNotes}</Text>}
              </OpCard>
            )}
            {(quote.accessories.length > 0 || ps.achatsNotes) && (
              <OpCard emoji="🛒" title="ACHATS" bgColor={C.emeraldBg} textColor={C.emerald}>
                {quote.accessories.map((a, i) => (
                  <OpRow key={i} label={a.accessory.name} value={`× ${a.quantity}`} />
                ))}
                {ps.achatsNotes && <Text style={s.opNote}>{ps.achatsNotes}</Text>}
              </OpCard>
            )}
            {ps.remarques && (
              <OpCard emoji="📝" title="REMARQUES" bgColor={C.bg} textColor={C.mid}>
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
