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
  header: { backgroundColor: C.dark, padding: '10 22', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1.5 },
  headerSub: { fontSize: 8.5, color: '#94a3b8', marginTop: 3 },
  statusPill: { backgroundColor: '#22c55e', padding: '4 12', borderRadius: 20 },
  statusText: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.dark },
  metaStrip: { flexDirection: 'row', backgroundColor: '#1e293b', padding: '6 22', gap: 28 },
  metaLabel: { fontSize: 7, color: '#64748b' },
  metaValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.white, marginTop: 1 },
  // Layout 2 colonnes
  body: { padding: '10 22 22 22', flex: 1, flexDirection: 'row', gap: 14 },
  colLeft: { flex: 1.5 },
  colRight: { flex: 1 },
  sectionLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.mid, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 },
  // Nomenclature
  nomTable: { borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden' },
  nomHead: { flexDirection: 'row', backgroundColor: C.dark, padding: '4 8' },
  nomHCell: { color: C.white, fontFamily: 'Helvetica-Bold', fontSize: 7.5 },
  nomRow: { flexDirection: 'row', padding: '4 8', borderTopWidth: 1, borderTopColor: C.border },
  nomRowAlt: { flexDirection: 'row', padding: '4 8', borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  nomGroupBar: { flexDirection: 'row', alignItems: 'center', padding: '4 8', borderTopWidth: 1, borderTopColor: C.border, backgroundColor: '#f5f3ff' },
  nomGroupBadge: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.violet, backgroundColor: C.violetBg, padding: '1 6', borderRadius: 10, marginLeft: 7 },
  nomCell: { fontSize: 8.5 },
  nomCellMid: { fontSize: 8.5, color: C.mid },
  nomCellBold: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  // Cartes opérations — 2 par ligne dans la colonne droite
  opsGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  opCard: { borderRadius: 5, overflow: 'hidden', marginBottom: 8, width: '48%' },
  opCardHead: { padding: '6 10' },
  opCardTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.6 },
  opCardBody: { backgroundColor: C.white, padding: '7 10', borderWidth: 1, borderTopWidth: 0, borderColor: C.border },
  opRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  opLabel: { fontSize: 8, color: C.mid },
  opValue: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  opNote: { fontSize: 7.5, color: C.mid, marginTop: 5, lineHeight: 1.4 },
  footer: { position: 'absolute', bottom: 8, left: 22, right: 22, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 4 },
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
  const totalPlates = runs.reduce((sum, r) => sum + r.platesCount, 0)
  const impressionRuns = runs.filter(r => r.hasImpression)
  const totalInkMl = impressionRuns.reduce((sum, r) => sum + r.inkMlPerPlate * r.platesCount, 0)
  const totalCuttingMin = runs.reduce((sum, r) => sum + (r.cuttingTimePerPoseSeconds * r.platesCount / 60), 0)

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
            { label: 'TOTAL PLAQUES', value: `${totalPlates} pl.` },
          ].map((item, i) => (
            <View key={i}>
              <Text style={s.metaLabel}>{item.label}</Text>
              <Text style={s.metaValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={s.body}>

          {/* COLONNE GAUCHE — Nomenclature */}
          <View style={s.colLeft}>
            <Text style={s.sectionLabel}>Nomenclature matiere</Text>
            <View style={s.nomTable}>
              <View style={s.nomHead}>
                <Text style={[s.nomHCell, { flex: 2.5 }]}>PRODUIT</Text>
                <Text style={[s.nomHCell, { flex: 2.2 }]}>MATIERE</Text>
                <Text style={[s.nomHCell, { flex: 1.5 }]}>FORMAT A PLAT</Text>
                <Text style={[s.nomHCell, { flex: 0.8, textAlign: 'center' }]}>QTE</Text>
                <Text style={[s.nomHCell, { flex: 1, textAlign: 'center' }]}>POSES/PL.</Text>
              </View>
              {runs.map((run, ri) => (
                <View key={ri}>
                  <View style={s.nomGroupBar}>
                    <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.violet }}>{run.name}</Text>
                    <Text style={s.nomGroupBadge}>{run.hasImpression ? 'IMP. + DECOUPE' : 'DECOUPE SEULE'}</Text>
                  </View>
                  {quote.products.filter(p => p.amalgameGroupIndex === ri).map((p, pi) => (
                    <View key={p.id} style={pi % 2 === 0 ? s.nomRow : s.nomRowAlt}>
                      <Text style={[s.nomCell, { flex: 2.5, paddingLeft: 12 }]}>{'->'} {p.productTypeName}</Text>
                      <Text style={[s.nomCellMid, { flex: 2.2 }]}>{p.plate?.name}  {p.plate?.width}x{p.plate?.height}</Text>
                      <Text style={[s.nomCell, { flex: 1.5 }]}>{p.flatWidth}x{p.flatHeight} mm</Text>
                      <Text style={[s.nomCell, { flex: 0.8, textAlign: 'center' }]}>{p.quantity}</Text>
                      <Text style={[s.nomCellBold, { flex: 1, textAlign: 'center' }]}>{p.countPerPlateInGroup}</Text>
                    </View>
                  ))}
                </View>
              ))}
              {/* Ligne récap plaques */}
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: '5 8', backgroundColor: C.dark, gap: 16 }}>
                <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.white }}>TOTAL PLAQUES</Text>
                {runs.map((run, ri) => (
                  <View key={ri} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    {runs.length > 1 && <Text style={{ fontSize: 7.5, color: '#94a3b8' }}>{run.name} :</Text>}
                    <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#22c55e' }}>{run.platesCount} pl.</Text>
                    <Text style={{ fontSize: 7.5, color: '#94a3b8' }}>{run.plate?.name}  {run.plate?.width}x{run.plate?.height} mm</Text>
                  </View>
                ))}
                {runs.length > 1 && (
                  <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#22c55e', marginLeft: 'auto' }}>
                    Total : {totalPlates} pl.
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* COLONNE DROITE — Cartes operations */}
          <View style={s.colRight}>
            <Text style={s.sectionLabel}>Operations</Text>
            <View style={s.opsGrid}>
              {impressionRuns.length > 0 && (
                <OpCard title="IMPRESSION" bgColor="#dbeafe" textColor="#1e40af">
                  {impressionRuns.map((r, i) => (
                    <View key={i}>
                      {impressionRuns.length > 1 && <Text style={[s.opNote, { marginTop: i > 0 ? 5 : 0, fontFamily: 'Helvetica-Bold', color: '#1e40af' }]}>{r.name}</Text>}
                      <OpRow label="R/V" value={r.isRectoVerso ? (r.rectoVersoType === 'identical' ? 'Identique' : 'Different') : 'Recto seul'} />
                      <OpRow label="Encre / plaque" value={`${r.inkMlPerPlate} ml`} />
                      <OpRow label="Total encre" value={`${r.inkMlPerPlate * r.platesCount} ml`} />
                    </View>
                  ))}
                  <OpRow label="Vernis" value={quote.hasVarnish ? 'Oui' : 'Non'} />
                  {quote.hasFlatColor && <OpRow label="Couleur plate" value="Oui" />}
                </OpCard>
              )}
              <OpCard title="DECOUPE" bgColor="#fce7f3" textColor="#9d174d">
                {runs.map((r, i) => (
                  <View key={i}>
                    {runs.length > 1 && <Text style={[s.opNote, { marginTop: i > 0 ? 5 : 0, fontFamily: 'Helvetica-Bold', color: '#9d174d' }]}>{r.name}</Text>}
                    <OpRow label="Temps / pose" value={`${r.cuttingTimePerPoseSeconds} s`} />
                    <OpRow label="Nb plaques" value={`${r.platesCount} pl.`} />
                    <OpRow label="Temps total" value={`${(r.cuttingTimePerPoseSeconds * r.platesCount / 60).toFixed(0)} min`} />
                  </View>
                ))}
                {runs.length > 1 && <OpRow label="Total general" value={`${totalCuttingMin.toFixed(0)} min`} />}
              </OpCard>
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
                    <OpRow label="Dimensions" value={`${ps.packagingBoxLengthMm}x${ps.packagingBoxWidthMm}x${ps.packagingBoxHeightMm} mm`} />
                  )}
                </OpCard>
              )}
              {quote.transportDeliveries.length > 0 && (
                <OpCard title="TRANSPORT" bgColor={C.violetBg} textColor={C.violet}>
                  {quote.transportDeliveries.map((d, i) => (
                    <View key={i}>
                      <OpRow label={d.transportMode === 'PACK30' ? 'Pack 30' : 'Messagerie+'} value={`Dept. ${d.department}`} />
                      <OpRow label="Colis" value={`${d.units} · ${d.weightKg}kg`} />
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

        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Fiche de production · {quote.study?.number} · {quote.reference} · {quote.client}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>

      </Page>
    </Document>
  )
}
