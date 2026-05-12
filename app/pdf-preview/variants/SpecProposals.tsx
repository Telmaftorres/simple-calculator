'use client'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const C = {
  dark: '#0f172a', mid: '#64748b', light: '#94a3b8', border: '#e2e8f0', bg: '#f8fafc', white: '#ffffff',
  violet: '#5b21b6', violetBg: '#ede9fe', violetBar: '#7c3aed',
  pink: '#9d174d', pinkBg: '#fce7f3', pinkBar: '#be185d',
}

const SPECS = [
  { label: 'Matiere', value: 'PVC 5mm' },
  { label: 'Format plaque', value: '600x800 mm' },
  { label: 'Format a plat', value: '500x700 mm' },
  { label: 'Nb plaques', value: '200 pl.' },
  { label: 'Quantite', value: '200 ex' },
]

const s = StyleSheet.create({
  page: { padding: '28 32', fontFamily: 'Helvetica', fontSize: 9, color: C.dark, backgroundColor: C.white },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.dark, marginBottom: 4 },
  subtitle: { fontSize: 9, color: C.mid, marginBottom: 28 },
  grid: { flexDirection: 'row', gap: 18, flexWrap: 'wrap' },
  proposal: { width: '47%', marginBottom: 24 },
  proposalLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.mid, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  proposalTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.dark, marginBottom: 10 },
  card: { borderWidth: 1, borderColor: C.border, borderRadius: 6, overflow: 'hidden' },
  cardBar: { backgroundColor: C.dark, padding: '7 12', flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardBarTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.white },
  cardBadge: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.pink, backgroundColor: C.pinkBg, padding: '2 7', borderRadius: 8 },
  cardBody: { padding: '10 12', backgroundColor: C.white },

  // A — Tableau 2 colonnes
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableLabel: { fontSize: 8, color: C.mid },
  tableValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },

  // B — Grille cases
  casesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  caseBox: { width: '30%', backgroundColor: C.bg, borderRadius: 5, borderWidth: 1, borderColor: C.border, padding: '6 8' },
  caseLabel: { fontSize: 6.5, color: C.mid, marginBottom: 3 },
  caseValue: { fontSize: 9, fontFamily: 'Helvetica-Bold' },

  // C — Bande horizontale
  stripRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 0 },
  stripItem: { flexDirection: 'row', alignItems: 'center' },
  stripLabel: { fontSize: 7, color: C.mid, marginRight: 3 },
  stripValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  stripSep: { fontSize: 9, color: C.border, marginHorizontal: 8 },

  // D — Liste tiret coloré
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  listBar: { width: 3, borderRadius: 2, marginRight: 10, alignSelf: 'stretch' },
  listLabel: { fontSize: 7.5, color: C.mid, flex: 1 },
  listValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
})

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.card}>
      <View style={[s.cardBar, { borderLeftWidth: 4, borderLeftColor: C.violetBar }]}>
        <Text style={s.cardBarTitle}>Produit independant</Text>
        <Text style={s.cardBadge}>DECOUPE SEULE</Text>
      </View>
      <View style={s.cardBody}>{children}</View>
    </View>
  )
}

// ── OPTION A : Tableau 2 colonnes ──
function OptionA() {
  return (
    <View style={s.proposal}>
      <Text style={s.proposalLabel}>Option A</Text>
      <Text style={s.proposalTitle}>Tableau 2 colonnes</Text>
      <CardShell>
        {SPECS.map((spec, i) => (
          <View key={i} style={[s.tableRow, i === SPECS.length - 1 ? { borderBottomWidth: 0 } : {}]}>
            <Text style={s.tableLabel}>{spec.label}</Text>
            <Text style={s.tableValue}>{spec.value}</Text>
          </View>
        ))}
      </CardShell>
    </View>
  )
}

// ── OPTION B : Grille cases ──
function OptionB() {
  return (
    <View style={s.proposal}>
      <Text style={s.proposalLabel}>Option B</Text>
      <Text style={s.proposalTitle}>Grille de cases</Text>
      <CardShell>
        <View style={s.casesGrid}>
          {SPECS.map((spec, i) => (
            <View key={i} style={s.caseBox}>
              <Text style={s.caseLabel}>{spec.label.toUpperCase()}</Text>
              <Text style={s.caseValue}>{spec.value}</Text>
            </View>
          ))}
        </View>
      </CardShell>
    </View>
  )
}

// ── OPTION C : Bande horizontale ──
function OptionC() {
  return (
    <View style={s.proposal}>
      <Text style={s.proposalLabel}>Option C</Text>
      <Text style={s.proposalTitle}>Bande horizontale</Text>
      <CardShell>
        <View style={s.stripRow}>
          {SPECS.map((spec, i) => (
            <View key={i} style={s.stripItem}>
              <Text style={s.stripLabel}>{spec.label} </Text>
              <Text style={s.stripValue}>{spec.value}</Text>
              {i < SPECS.length - 1 && <Text style={s.stripSep}>  ·  </Text>}
            </View>
          ))}
        </View>
      </CardShell>
    </View>
  )
}

// ── OPTION D : Liste tiret coloré ──
function OptionD() {
  return (
    <View style={s.proposal}>
      <Text style={s.proposalLabel}>Option D</Text>
      <Text style={s.proposalTitle}>Liste avec repere couleur</Text>
      <CardShell>
        {SPECS.map((spec, i) => (
          <View key={i} style={[s.listRow, i === SPECS.length - 1 ? { borderBottomWidth: 0 } : {}]}>
            <View style={[s.listBar, { backgroundColor: C.violetBar, minHeight: 14 }]} />
            <Text style={s.listLabel}>{spec.label}</Text>
            <Text style={s.listValue}>{spec.value}</Text>
          </View>
        ))}
      </CardShell>
    </View>
  )
}

export function SpecProposalsPDF() {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.title}>Propositions — Affichage des specs produit</Text>
        <Text style={s.subtitle}>4 options pour remplacer les bulles actuelles</Text>
        <View style={s.grid}>
          <OptionA />
          <OptionB />
          <OptionC />
          <OptionD />
        </View>
      </Page>
    </Document>
  )
}
