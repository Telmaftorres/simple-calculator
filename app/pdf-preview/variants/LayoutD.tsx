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
  green: '#15803d',
}

const s = StyleSheet.create({
  page: { padding: 0, fontFamily: 'Helvetica', fontSize: 9, color: C.dark, backgroundColor: C.white },
  header: { backgroundColor: C.dark, padding: '10 22', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { gap: 2 },
  headerTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1.2 },
  headerSub: { fontSize: 8, color: C.light },
  headerTag: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.dark, backgroundColor: '#22c55e', padding: '3 10', borderRadius: 12 },
  metaStrip: { flexDirection: 'row', backgroundColor: '#1e293b', padding: '5 22', gap: 28 },
  metaLabel: { fontSize: 7, color: '#64748b' },
  metaValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.white, marginTop: 1 },
  // Séparateur de page groupe
  groupBanner: { padding: '8 22', flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 2, borderBottomColor: C.border },
  groupBannerTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  groupBannerBadge: { fontSize: 8, fontFamily: 'Helvetica-Bold', padding: '3 10', borderRadius: 10 },
  // Body
  body: { padding: '14 22', flexDirection: 'row', gap: 16 },
  colLeft: { flex: 1.4 },
  colRight: { flex: 1 },
  sectionLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.mid, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 },
  // Specs plaque
  specsBox: { borderRadius: 5, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 10 },
  specsHead: { backgroundColor: C.dark, padding: '4 10', flexDirection: 'row', alignItems: 'center', gap: 8 },
  specsHeadText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.white },
  specsBody: { flexDirection: 'row', padding: '6 10', gap: 14 },
  specsItem: { gap: 1 },
  specsItemLabel: { fontSize: 7, color: C.mid },
  specsItemValue: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  // Nomenclature
  nomTable: { borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  nomHead: { flexDirection: 'row', backgroundColor: '#1e293b', padding: '4 8' },
  nomHCell: { color: C.white, fontFamily: 'Helvetica-Bold', fontSize: 7.5 },
  nomRow: { flexDirection: 'row', padding: '4 8', borderTopWidth: 1, borderTopColor: C.border },
  nomRowAlt: { flexDirection: 'row', padding: '4 8', borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  nomCell: { fontSize: 8.5 },
  nomCellMid: { fontSize: 8.5, color: C.mid },
  nomCellBold: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  // Cartes ops
  opsGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  opCard: { borderRadius: 5, overflow: 'hidden', marginBottom: 8, width: '48%' },
  opCardHead: { padding: '6 10' },
  opCardTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  opCardBody: { backgroundColor: C.white, padding: '6 10', borderWidth: 1, borderTopWidth: 0, borderColor: C.border },
  opRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  opLabel: { fontSize: 8, color: C.mid },
  opValue: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  opNote: { fontSize: 7.5, color: C.mid, marginTop: 4, lineHeight: 1.4 },
  // Footer
  footer: { position: 'absolute', bottom: 8, left: 22, right: 22, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 4 },
  footerText: { fontSize: 6.5, color: C.light },
})

function SpecsBox({ title, bgColor, items }: { title: string; bgColor: string; items: { label: string; value: string }[] }) {
  return (
    <View style={s.specsBox}>
      <View style={[s.specsHead, { backgroundColor: bgColor }]}>
        <Text style={s.specsHeadText}>{title}</Text>
      </View>
      <View style={s.specsBody}>
        {items.map((item, i) => (
          <View key={i} style={s.specsItem}>
            <Text style={s.specsItemLabel}>{item.label}</Text>
            <Text style={s.specsItemValue}>{item.value}</Text>
          </View>
        ))}
      </View>
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

function PageHeader({ quote, pageLabel }: { quote: Q; pageLabel: string }) {
  return (
    <>
      <View style={s.header}>
        <View style={s.headerLeft}>
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
          { label: 'ETAPE', value: pageLabel },
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

export function ProductionSheetPDFD({ quote, productionSheet: ps }: { quote: Q; productionSheet: PS }) {
  const runs = quote.amalgameRuns ?? []
  const standaloneProducts = quote.products.filter(p => p.amalgameGroupIndex === null)

  return (
    <Document>

      {/* PAGE PAR RUN AMALGAME */}
      {runs.map((run, ri) => {
        const products = quote.products.filter(p => p.amalgameGroupIndex === ri)
        const cuttingMin = (run.cuttingTimePerPoseSeconds * run.platesCount / 60).toFixed(0)
        const totalInk = run.hasImpression ? run.inkMlPerPlate * run.platesCount : 0
        return (
          <Page key={ri} size="A4" orientation="landscape" style={s.page}>
            <PageHeader quote={quote} pageLabel={`Groupe ${ri + 1}/${runs.length + standaloneProducts.length} — ${run.name}`} />

            <View style={[s.groupBanner, { borderLeftWidth: 4, borderLeftColor: C.violet }]}>
              <Text style={[s.groupBannerTitle, { color: C.violet }]}>{run.name}</Text>
              <Text style={[s.groupBannerBadge, { backgroundColor: C.violetBg, color: C.violet }]}>AMALGAME</Text>
              {run.hasImpression && <Text style={[s.groupBannerBadge, { backgroundColor: C.blueBg, color: C.blue }]}>IMPRESSION</Text>}
              <Text style={[s.groupBannerBadge, { backgroundColor: C.pinkBg, color: C.pink }]}>DECOUPE</Text>
            </View>

            <View style={s.body}>
              <View style={s.colLeft}>
                <Text style={s.sectionLabel}>Specifications de production</Text>
                <SpecsBox title="PLAQUE" bgColor={C.dark} items={[
                  { label: 'Matiere', value: run.plate?.name ?? '—' },
                  { label: 'Format', value: `${run.plate?.width}x${run.plate?.height} mm` },
                  { label: 'Nb plaques', value: `${run.platesCount} pl.` },
                ]} />
                {run.hasImpression && (
                  <SpecsBox title="IMPRESSION" bgColor={C.blue} items={[
                    { label: 'R/V', value: run.isRectoVerso ? (run.rectoVersoType === 'identical' ? 'R/V identique' : 'R/V different') : 'Recto seul' },
                    { label: 'Encre / plaque', value: `${run.inkMlPerPlate} ml` },
                    { label: 'Total encre', value: `${totalInk} ml` },
                    { label: 'Vernis', value: quote.hasVarnish ? 'Oui' : 'Non' },
                  ]} />
                )}
                <SpecsBox title="DECOUPE" bgColor={C.pink} items={[
                  { label: 'Temps / pose', value: `${run.cuttingTimePerPoseSeconds} s` },
                  { label: 'Nb plaques', value: `${run.platesCount} pl.` },
                  { label: 'Temps total', value: `${cuttingMin} min` },
                ]} />

                <Text style={[s.sectionLabel, { marginTop: 4 }]}>Nomenclature</Text>
                <View style={s.nomTable}>
                  <View style={s.nomHead}>
                    <Text style={[s.nomHCell, { flex: 3 }]}>PRODUIT</Text>
                    <Text style={[s.nomHCell, { flex: 2 }]}>FORMAT A PLAT</Text>
                    <Text style={[s.nomHCell, { flex: 1, textAlign: 'center' }]}>QTE</Text>
                    <Text style={[s.nomHCell, { flex: 1, textAlign: 'center' }]}>POSES/PL.</Text>
                  </View>
                  {products.map((p, pi) => (
                    <View key={p.id} style={pi % 2 === 0 ? s.nomRow : s.nomRowAlt}>
                      <Text style={[s.nomCell, { flex: 3 }]}>{p.productTypeName}</Text>
                      <Text style={[s.nomCellMid, { flex: 2 }]}>{p.flatWidth}x{p.flatHeight} mm</Text>
                      <Text style={[s.nomCell, { flex: 1, textAlign: 'center' }]}>{p.quantity}</Text>
                      <Text style={[s.nomCellBold, { flex: 1, textAlign: 'center' }]}>{p.countPerPlateInGroup}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={s.colRight}>
                <Text style={s.sectionLabel}>Notes</Text>
                <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: '8 10', minHeight: 80, backgroundColor: C.bg }}>
                  <Text style={{ fontSize: 8, color: C.light }}>Zone de notes operateur</Text>
                </View>
              </View>
            </View>

            <View style={s.footer} fixed>
              <Text style={s.footerText}>Fiche de production · {quote.study?.number} · {quote.reference} · {quote.client}</Text>
              <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
            </View>
          </Page>
        )
      })}

      {/* PAGE PAR PRODUIT STANDALONE */}
      {standaloneProducts.map((p, si) => {
        const cuttingMin = (p.cuttingTimePerPoseSeconds * (p.platesCount ?? 0) / 60).toFixed(0)
        return (
          <Page key={`s-${si}`} size="A4" orientation="landscape" style={s.page}>
            <PageHeader quote={quote} pageLabel={`Produit ${runs.length + si + 1}/${runs.length + standaloneProducts.length} — ${p.productTypeName}`} />

            <View style={[s.groupBanner, { borderLeftWidth: 4, borderLeftColor: C.amber }]}>
              <Text style={[s.groupBannerTitle, { color: C.amber }]}>{p.productTypeName}</Text>
              <Text style={[s.groupBannerBadge, { backgroundColor: C.amberBg, color: C.amber }]}>PRODUIT INDEPENDANT</Text>
              {!p.hasImpression && <Text style={[s.groupBannerBadge, { backgroundColor: C.pinkBg, color: C.pink }]}>DECOUPE SEULE</Text>}
            </View>

            <View style={s.body}>
              <View style={s.colLeft}>
                <Text style={s.sectionLabel}>Specifications de production</Text>
                <SpecsBox title="PLAQUE" bgColor={C.dark} items={[
                  { label: 'Matiere', value: p.plate?.name ?? '—' },
                  { label: 'Format', value: `${p.plate?.width}x${p.plate?.height} mm` },
                  { label: 'Nb plaques', value: `${p.platesCount ?? '—'} pl.` },
                ]} />
                <SpecsBox title="FORMAT PRODUIT" bgColor={C.amber} items={[
                  { label: 'Format a plat', value: `${p.flatWidth}x${p.flatHeight} mm` },
                  { label: 'Quantite', value: `${p.quantity} ex` },
                  { label: 'Pieces / plaque', value: `${p.countPerPlateInGroup}` },
                ]} />
                <SpecsBox title="DECOUPE" bgColor={C.pink} items={[
                  { label: 'Temps / pose', value: `${p.cuttingTimePerPoseSeconds} s` },
                  { label: 'Nb plaques', value: `${p.platesCount ?? '—'} pl.` },
                  { label: 'Temps total', value: `${cuttingMin} min` },
                ]} />
              </View>

              <View style={s.colRight}>
                <Text style={s.sectionLabel}>Notes</Text>
                <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: '8 10', minHeight: 80, backgroundColor: C.bg }}>
                  <Text style={{ fontSize: 8, color: C.light }}>Zone de notes operateur</Text>
                </View>
              </View>
            </View>

            <View style={s.footer} fixed>
              <Text style={s.footerText}>Fiche de production · {quote.study?.number} · {quote.reference} · {quote.client}</Text>
              <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
            </View>
          </Page>
        )
      })}

      {/* PAGE OPERATIONS COMMUNES */}
      <Page size="A4" orientation="landscape" style={s.page}>
        <PageHeader quote={quote} pageLabel="Operations communes" />

        <View style={[s.groupBanner, { borderLeftWidth: 4, borderLeftColor: C.emerald }]}>
          <Text style={[s.groupBannerTitle, { color: C.emerald }]}>Operations communes</Text>
          <Text style={[s.groupBannerBadge, { backgroundColor: C.emeraldBg, color: C.emerald }]}>TOUTE LA COMMANDE</Text>
        </View>

        <View style={[s.body, { flexWrap: 'wrap' }]}>
          <View style={{ width: '100%', flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
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

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Fiche de production · {quote.study?.number} · {quote.reference} · {quote.client}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>
      </Page>

    </Document>
  )
}
