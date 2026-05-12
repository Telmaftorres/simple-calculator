'use client'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { SAMPLE_QUOTE, SAMPLE_PS } from '../sample-data'

type Q = typeof SAMPLE_QUOTE
type PS = typeof SAMPLE_PS

const C = {
  dark: '#0f172a', mid: '#64748b', light: '#94a3b8', border: '#e2e8f0', bg: '#f8fafc', white: '#ffffff',
  accent: '#2563eb', accentBg: '#eff6ff',
  green: '#15803d', greenBg: '#f0fdf4',
  orange: '#c2410c', orangeBg: '#fff7ed',
}

const s = StyleSheet.create({
  page: { padding: '0', fontFamily: 'Helvetica', fontSize: 8, color: C.dark, backgroundColor: C.white },
  // Header
  header: { backgroundColor: C.dark, padding: '10 20', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1 },
  headerDossier: { fontSize: 7.5, color: '#94a3b8', marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  statusDot: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#4ade80' },
  metaStrip: { flexDirection: 'row', backgroundColor: '#1e293b', padding: '5 20', gap: 24 },
  metaItem: { flexDirection: 'row', gap: 5 },
  metaLabel: { fontSize: 7, color: '#64748b' },
  metaValue: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.white },
  // Colonnes
  body: { flexDirection: 'row', flex: 1, padding: '12 20', gap: 14 },
  colLeft: { flex: 2 },
  colRight: { flex: 1 },
  // Bloc carte
  card: { borderRadius: 4, overflow: 'hidden', marginBottom: 10, borderWidth: 1, borderColor: C.border },
  cardHead: { padding: '4 8', flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardEmoji: { fontSize: 9 },
  cardTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8 },
  cardBody: { padding: '5 8' },
  // Nomenclature
  nomRow: { flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: C.border },
  nomRowGroup: { flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: '#f5f3ff' },
  nomCell: { fontSize: 7.5 },
  nomCellMid: { fontSize: 7.5, color: C.mid },
  nomCellBold: { fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  nomBadge: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#6d28d9', backgroundColor: '#ede9fe', padding: '1 4', borderRadius: 8 },
  // Lignes données
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2.5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dataLabel: { fontSize: 7.5, color: C.mid },
  dataValue: { fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  note: { fontSize: 7, color: C.mid, marginTop: 4, lineHeight: 1.4 },
  // Total box
  totalBox: { backgroundColor: C.dark, borderRadius: 4, padding: '8 10', marginBottom: 10 },
  totalLabel: { fontSize: 7, color: '#94a3b8' },
  totalValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.white, marginTop: 2 },
  totalSub: { fontSize: 7, color: '#94a3b8', marginTop: 2 },
  // Footer
  footer: { position: 'absolute', bottom: 8, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 4 },
  footerText: { fontSize: 6, color: C.light },
})

function DataRow({ label, value }: { label: string; value: string }) {
  return <View style={s.dataRow}><Text style={s.dataLabel}>{label}</Text><Text style={s.dataValue}>{value}</Text></View>
}

function Card({ emoji, title, bgColor, textColor, children }: {
  emoji: string; title: string; bgColor: string; textColor: string; children: React.ReactNode
}) {
  return (
    <View style={s.card}>
      <View style={[s.cardHead, { backgroundColor: bgColor }]}>
        <Text style={s.cardEmoji}>{emoji}</Text>
        <Text style={[s.cardTitle, { color: textColor }]}>{title}</Text>
      </View>
      <View style={s.cardBody}>{children}</View>
    </View>
  )
}

export function ProductionSheetPDFC({ quote, productionSheet: ps }: { quote: Q; productionSheet: PS }) {
  const runs = quote.amalgameRuns ?? []

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* HEADER */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>FICHE DE PRODUCTION</Text>
            <Text style={s.headerDossier}>Dossier {quote.study?.number}  ·  {quote.reference}</Text>
          </View>
          <View style={s.headerRight}>
            <View style={s.statusDot}>
              <Text style={s.statusText}>● EN COURS</Text>
            </View>
            <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>{new Date(quote.createdAt).toLocaleDateString('fr-FR')}</Text>
          </View>
        </View>

        <View style={s.metaStrip}>
          <View style={s.metaItem}><Text style={s.metaLabel}>Client</Text><Text style={s.metaValue}>{quote.client}</Text></View>
          <View style={s.metaItem}><Text style={s.metaLabel}>PLV</Text><Text style={s.metaValue}>{quote.productType?.name ?? 'Multi-produits'}</Text></View>
          <View style={s.metaItem}><Text style={s.metaLabel}>Qté</Text><Text style={s.metaValue}>{quote.plvQuantity ?? quote.quantity} ex</Text></View>
        </View>

        <View style={s.body}>

          {/* COLONNE GAUCHE — Nomenclature + opérations */}
          <View style={s.colLeft}>

            {/* Nomenclature amalgame */}
            <Card emoji="📋" title="NOMENCLATURE MATIÈRE" bgColor={C.bg} textColor={C.dark}>
              <View style={{ flexDirection: 'row', paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 3 }}>
                <Text style={[s.nomCellMid, { flex: 2.5, fontSize: 6.5, fontFamily: 'Helvetica-Bold' }]}>PRODUIT</Text>
                <Text style={[s.nomCellMid, { flex: 2, fontSize: 6.5, fontFamily: 'Helvetica-Bold' }]}>FORMAT</Text>
                <Text style={[s.nomCellMid, { flex: 0.8, fontSize: 6.5, fontFamily: 'Helvetica-Bold', textAlign: 'center' }]}>QTÉ</Text>
                <Text style={[s.nomCellMid, { flex: 1, fontSize: 6.5, fontFamily: 'Helvetica-Bold', textAlign: 'center' }]}>POSES/PL.</Text>
              </View>
              {runs.map((run, ri) => (
                <View key={ri}>
                  <View style={s.nomRowGroup}>
                    <Text style={[s.nomCellBold, { flex: 2.5, color: '#6d28d9' }]}>{run.name}</Text>
                    <Text style={[s.nomCellMid, { flex: 2, fontSize: 7 }]}>{run.plate?.name}  {run.plate?.width}×{run.plate?.height}</Text>
                    <Text style={[s.nomCellMid, { flex: 0.8, textAlign: 'center', fontSize: 7 }]}>{run.platesCount} pl.</Text>
                    <Text style={[s.nomCellMid, { flex: 1, textAlign: 'center', fontSize: 7 }]}>{run.cuttingTimePerPoseSeconds}s/pose</Text>
                  </View>
                  {quote.products.filter(p => p.amalgameGroupIndex === ri).map((p, pi) => (
                    <View key={p.id} style={[s.nomRow, pi % 2 !== 0 ? { backgroundColor: C.bg } : {}]}>
                      <Text style={[s.nomCell, { flex: 2.5, paddingLeft: 8 }]}>↳ {p.productTypeName}</Text>
                      <Text style={[s.nomCellMid, { flex: 2 }]}>{p.flatWidth}×{p.flatHeight} mm</Text>
                      <Text style={[s.nomCell, { flex: 0.8, textAlign: 'center' }]}>{p.quantity}</Text>
                      <Text style={[s.nomCellBold, { flex: 1, textAlign: 'center' }]}>{p.countPerPlateInGroup}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </Card>

            {/* Façonnage + Conditionnement côte à côte */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {quote.hasFaconnage && (
                <View style={{ flex: 1 }}>
                  <Card emoji="🔧" title="FAÇONNAGE" bgColor="#fef3c7" textColor="#92400e">
                    <DataRow label="Temps / pièce" value={`${ps.prodAssemblyTimePerPieceSeconds} s`} />
                    {ps.nbCollages != null && <DataRow label="Collages / PLV" value={String(ps.nbCollages)} />}
                    {ps.collagePerPLV != null && <DataRow label="Coût / PLV" value={`${ps.collagePerPLV.toFixed(2)} €`} />}
                    {ps.faconnageNotes && <Text style={s.note}>{ps.faconnageNotes}</Text>}
                  </Card>
                </View>
              )}
              {quote.hasConditionnement && (
                <View style={{ flex: 1 }}>
                  <Card emoji="📫" title="CONDITIONNEMENT" bgColor={C.accentBg} textColor={C.accent}>
                    <DataRow label="Temps / pièce" value={`${ps.prodPackTimePerPieceSeconds} s`} />
                    {ps.conditionnementType && <DataRow label="Type" value={ps.conditionnementType === 'kit_unitaire' ? 'Kit unitaire' : ps.conditionnementType} />}
                    {ps.conditionnementNotes && <Text style={s.note}>{ps.conditionnementNotes}</Text>}
                  </Card>
                </View>
              )}
            </View>

            {/* Emballage */}
            {quote.hasPackaging && (
              <Card emoji="📦" title="EMBALLAGE" bgColor={C.orangeBg} textColor={C.orange}>
                <View style={{ flexDirection: 'row', gap: 20 }}>
                  <View style={{ flex: 1 }}>
                    <DataRow label="Type" value={quote.packagingBoxType === 'etui' ? 'Étui' : quote.packagingBoxType ?? '—'} />
                    <DataRow label="Matière" value={ps.prodPackagingMaterial ?? quote.packagingMaterialType ?? '—'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <DataRow label="Quantité" value={`${ps.prodPackagingQuantity ?? quote.packagingQuantity} pcs`} />
                    <DataRow label="Prix unitaire" value={`${ps.prodPackagingUnitPrice?.toFixed(2) ?? '—'} €`} />
                  </View>
                  {ps.packagingBoxLengthMm != null && (
                    <View style={{ flex: 1 }}>
                      <DataRow label="Dimensions" value={`${ps.packagingBoxLengthMm}×${ps.packagingBoxWidthMm}×${ps.packagingBoxHeightMm} mm`} />
                    </View>
                  )}
                </View>
              </Card>
            )}

          </View>

          {/* COLONNE DROITE — Chiffres clés + transport + achats */}
          <View style={s.colRight}>

            {/* Total */}
            <View style={s.totalBox}>
              <Text style={s.totalLabel}>MONTANT HT</Text>
              <Text style={s.totalValue}>{quote.totalCost?.toFixed(2)} €</Text>
              <Text style={s.totalSub}>{quote.plvQuantity ?? quote.quantity} ex · {((quote.totalCost ?? 0) / (quote.plvQuantity ?? quote.quantity)).toFixed(2)} €/pce</Text>
            </View>

            {/* Transport */}
            {quote.transportDeliveries.length > 0 && (
              <Card emoji="🚚" title="TRANSPORT" bgColor="#f5f3ff" textColor="#5b21b6">
                {quote.transportDeliveries.map((d, i) => (
                  <View key={i} style={{ marginBottom: i < quote.transportDeliveries.length - 1 ? 6 : 0 }}>
                    <DataRow label={d.transportMode === 'PACK30' ? 'Pack 30' : 'Messagerie+'} value={`Dept. ${d.department}`} />
                    <DataRow label={`${d.units} colis · ${d.weightKg}kg`} value={`${d.totalHT.toFixed(2)} €`} />
                  </View>
                ))}
                {ps.prodTransportNotes && <Text style={s.note}>{ps.prodTransportNotes}</Text>}
              </Card>
            )}

            {/* Achats */}
            {(quote.accessories.length > 0 || ps.achatsNotes) && (
              <Card emoji="🛒" title="ACHATS" bgColor={C.greenBg} textColor={C.green}>
                {quote.accessories.map((a, i) => (
                  <DataRow key={i} label={a.accessory.name} value={`× ${a.quantity}`} />
                ))}
                {ps.achatsNotes && <Text style={s.note}>{ps.achatsNotes}</Text>}
              </Card>
            )}

            {/* Remarques */}
            {ps.remarques && (
              <Card emoji="📝" title="REMARQUES" bgColor={C.bg} textColor={C.mid}>
                <Text style={[s.note, { marginTop: 0 }]}>{ps.remarques}</Text>
              </Card>
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
