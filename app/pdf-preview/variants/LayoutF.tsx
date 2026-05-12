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

const s = StyleSheet.create({
  page: { padding: 0, fontFamily: 'Helvetica', fontSize: 9, color: C.dark, backgroundColor: C.white },
  header: { backgroundColor: C.dark, padding: '8 22', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1.2 },
  headerSub: { fontSize: 7.5, color: C.light, marginTop: 2 },
  headerTag: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.dark, backgroundColor: '#22c55e', padding: '3 10', borderRadius: 12 },
  metaStrip: { flexDirection: 'row', backgroundColor: '#1e293b', padding: '5 22', gap: 28 },
  metaLabel: { fontSize: 7, color: '#64748b' },
  metaValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.white, marginTop: 1 },
  body: { padding: '10 22 30 22', flexDirection: 'row', gap: 14 },
  colLeft: { flex: 1.6 },
  colRight: { flex: 1 },
  sectionLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.mid, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5, marginTop: 8 },
  // Tableau groupes de production
  groupTable: { borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden', marginBottom: 0 },
  groupHead: { flexDirection: 'row', backgroundColor: C.dark, padding: '4 10' },
  groupHCell: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.white },
  groupRow: { flexDirection: 'row', padding: '6 10', borderTopWidth: 1, borderTopColor: C.border },
  groupRowAlt: { flexDirection: 'row', padding: '6 10', borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  groupCell: { fontSize: 8.5 },
  groupCellMid: { fontSize: 8.5, color: C.mid },
  groupCellBold: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  groupBadge: { fontSize: 7, fontFamily: 'Helvetica-Bold', padding: '1 6', borderRadius: 8 },
  // Tableau nomenclature
  nomTable: { borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden' },
  nomHead: { flexDirection: 'row', backgroundColor: '#334155', padding: '4 10' },
  nomHCell: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.white },
  nomRow: { flexDirection: 'row', padding: '4 10', borderTopWidth: 1, borderTopColor: C.border },
  nomRowAlt: { flexDirection: 'row', padding: '4 10', borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  nomGroupBar: { flexDirection: 'row', alignItems: 'center', padding: '3 10', borderTopWidth: 1, borderTopColor: C.border, backgroundColor: '#f5f3ff' },
  nomCell: { fontSize: 8.5 },
  nomCellMid: { fontSize: 8.5, color: C.mid },
  nomCellBold: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  // Ops
  opsGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  opCard: { borderRadius: 4, overflow: 'hidden', marginBottom: 7, width: '48%' },
  opCardHead: { padding: '5 9' },
  opCardTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  opCardBody: { backgroundColor: C.white, padding: '5 9', borderWidth: 1, borderTopWidth: 0, borderColor: C.border },
  opRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2.5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  opLabel: { fontSize: 7.5, color: C.mid },
  opValue: { fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  opNote: { fontSize: 7, color: C.mid, marginTop: 3, lineHeight: 1.4 },
  footer: { position: 'absolute', bottom: 8, left: 22, right: 22, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 4 },
  footerText: { fontSize: 6.5, color: C.light },
})

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

export function ProductionSheetPDFF({ quote, productionSheet: ps }: { quote: Q; productionSheet: PS }) {
  const runs = quote.amalgameRuns ?? []
  const standaloneProducts = quote.products.filter(p => p.amalgameGroupIndex === null)
  const totalPlates = runs.reduce((sum, r) => sum + r.platesCount, 0) +
    standaloneProducts.reduce((sum, p) => sum + (p.platesCount ?? 0), 0)

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>

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
            { label: 'TOTAL PLAQUES', value: `${totalPlates} pl.` },
          ].map((item, i) => (
            <View key={i}>
              <Text style={s.metaLabel}>{item.label}</Text>
              <Text style={s.metaValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={s.body}>

          {/* COLONNE GAUCHE */}
          <View style={s.colLeft}>

            {/* TABLEAU 1 : Groupes de production */}
            <Text style={[s.sectionLabel, { marginTop: 0 }]}>Groupes de production</Text>
            <View style={s.groupTable}>
              <View style={s.groupHead}>
                <Text style={[s.groupHCell, { flex: 1.8 }]}>GROUPE</Text>
                <Text style={[s.groupHCell, { flex: 1.5 }]}>PLAQUE</Text>
                <Text style={[s.groupHCell, { flex: 0.7, textAlign: 'center' }]}>PLAQUES</Text>
                <Text style={[s.groupHCell, { flex: 1, textAlign: 'center' }]}>DECOUPE</Text>
                <Text style={[s.groupHCell, { flex: 0.9, textAlign: 'center' }]}>TPS TOTAL</Text>
                <Text style={[s.groupHCell, { flex: 1, textAlign: 'center' }]}>IMPRESSION</Text>
                <Text style={[s.groupHCell, { flex: 0.9, textAlign: 'center' }]}>ENCRE TOT.</Text>
              </View>

              {runs.map((run, ri) => {
                const cuttingMin = (run.cuttingTimePerPoseSeconds * run.platesCount / 60).toFixed(0)
                const totalInk = run.hasImpression ? run.inkMlPerPlate * run.platesCount : null
                return (
                  <View key={ri} style={ri % 2 === 0 ? s.groupRow : s.groupRowAlt}>
                    <View style={{ flex: 1.8, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Text style={s.groupCellBold}>{run.name}</Text>
                      <Text style={[s.groupBadge, { backgroundColor: C.violetBg, color: C.violet }]}>AMALGAME</Text>
                    </View>
                    <Text style={[s.groupCellMid, { flex: 1.5 }]}>{run.plate?.name}  {run.plate?.width}x{run.plate?.height}</Text>
                    <Text style={[s.groupCellBold, { flex: 0.7, textAlign: 'center' }]}>{run.platesCount}</Text>
                    <Text style={[s.groupCell, { flex: 1, textAlign: 'center' }]}>{run.cuttingTimePerPoseSeconds}s/pose</Text>
                    <Text style={[s.groupCellBold, { flex: 0.9, textAlign: 'center' }]}>{cuttingMin} min</Text>
                    <Text style={[s.groupCell, { flex: 1, textAlign: 'center' }]}>
                      {run.hasImpression ? (run.isRectoVerso ? 'R/V' : 'Recto') : '—'}
                    </Text>
                    <Text style={[s.groupCell, { flex: 0.9, textAlign: 'center' }]}>
                      {totalInk != null ? `${totalInk}ml` : '—'}
                    </Text>
                  </View>
                )
              })}

              {standaloneProducts.map((p, si) => {
                const cuttingMin = (p.cuttingTimePerPoseSeconds * (p.platesCount ?? 0) / 60).toFixed(0)
                return (
                  <View key={`s-${si}`} style={(runs.length + si) % 2 === 0 ? s.groupRow : s.groupRowAlt}>
                    <View style={{ flex: 1.8, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Text style={s.groupCellBold}>{p.productTypeName}</Text>
                      <Text style={[s.groupBadge, { backgroundColor: C.amberBg, color: C.amber }]}>SEUL</Text>
                    </View>
                    <Text style={[s.groupCellMid, { flex: 1.5 }]}>{p.plate?.name}  {p.plate?.width}x{p.plate?.height}</Text>
                    <Text style={[s.groupCellBold, { flex: 0.7, textAlign: 'center' }]}>{p.platesCount ?? '—'}</Text>
                    <Text style={[s.groupCell, { flex: 1, textAlign: 'center' }]}>{p.cuttingTimePerPoseSeconds}s/pose</Text>
                    <Text style={[s.groupCellBold, { flex: 0.9, textAlign: 'center' }]}>{cuttingMin} min</Text>
                    <Text style={[s.groupCellMid, { flex: 1, textAlign: 'center' }]}>—</Text>
                    <Text style={[s.groupCellMid, { flex: 0.9, textAlign: 'center' }]}>—</Text>
                  </View>
                )
              })}
            </View>

            {/* TABLEAU 2 : Nomenclature */}
            <Text style={s.sectionLabel}>Nomenclature matiere</Text>
            <View style={s.nomTable}>
              <View style={s.nomHead}>
                <Text style={[s.nomHCell, { flex: 2.5 }]}>PRODUIT</Text>
                <Text style={[s.nomHCell, { flex: 2 }]}>MATIERE PRODUIT</Text>
                <Text style={[s.nomHCell, { flex: 1.5 }]}>FORMAT A PLAT</Text>
                <Text style={[s.nomHCell, { flex: 0.8, textAlign: 'center' }]}>QTE</Text>
                <Text style={[s.nomHCell, { flex: 1, textAlign: 'center' }]}>POSES/PL.</Text>
              </View>

              {runs.map((run, ri) => (
                <View key={ri}>
                  <View style={s.nomGroupBar}>
                    <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.violet }}>{run.name}</Text>
                  </View>
                  {quote.products.filter(p => p.amalgameGroupIndex === ri).map((p, pi) => (
                    <View key={p.id} style={pi % 2 === 0 ? s.nomRow : s.nomRowAlt}>
                      <Text style={[s.nomCell, { flex: 2.5, paddingLeft: 10 }]}>{'->'} {p.productTypeName}</Text>
                      <Text style={[s.nomCellMid, { flex: 2 }]}>{p.plate?.name}  {p.plate?.width}x{p.plate?.height}</Text>
                      <Text style={[s.nomCell, { flex: 1.5 }]}>{p.flatWidth}x{p.flatHeight} mm</Text>
                      <Text style={[s.nomCell, { flex: 0.8, textAlign: 'center' }]}>{p.quantity}</Text>
                      <Text style={[s.nomCellBold, { flex: 1, textAlign: 'center' }]}>{p.countPerPlateInGroup}</Text>
                    </View>
                  ))}
                </View>
              ))}

              {standaloneProducts.map((p, pi) => (
                <View key={`s-${pi}`} style={pi % 2 === 0 ? s.nomRow : s.nomRowAlt}>
                  <Text style={[s.nomCell, { flex: 2.5 }]}>{p.productTypeName}</Text>
                  <Text style={[s.nomCellMid, { flex: 2 }]}>{p.plate?.name}  {p.plate?.width}x{p.plate?.height}</Text>
                  <Text style={[s.nomCell, { flex: 1.5 }]}>{p.flatWidth}x{p.flatHeight} mm</Text>
                  <Text style={[s.nomCell, { flex: 0.8, textAlign: 'center' }]}>{p.quantity}</Text>
                  <Text style={[s.nomCellMid, { flex: 1, textAlign: 'center' }]}>1</Text>
                </View>
              ))}
            </View>

          </View>

          {/* COLONNE DROITE — Operations */}
          <View style={s.colRight}>
            <Text style={[s.sectionLabel, { marginTop: 0 }]}>Operations communes</Text>
            <View style={s.opsGrid}>
              {quote.hasFaconnage && (
                <OpCard title="FACONNAGE" bgColor={C.amberBg} textColor={C.amber}>
                  <OpRow label="Temps / piece" value={`${ps.prodAssemblyTimePerPieceSeconds} s`} />
                  {ps.nbCollages != null && <OpRow label="Collages / PLV" value={String(ps.nbCollages)} />}
                  {ps.collagePerPLV != null && <OpRow label="Cout / PLV" value={`${ps.collagePerPLV.toFixed(2)} EUR`} />}
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
