'use client'

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import type { ImpositionResult, PrintingCostData, SelectedAccessory, SelectedConsumable, Plate } from '@/types/calculator'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: 'contain',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  reference: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#10b981',
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    backgroundColor: '#f1f5f9',
    padding: '6 10',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    color: '#64748b',
    flex: 1,
  },
  value: {
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  table: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    padding: '6 10',
  },
  tableHeaderText: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },
  tableHeaderTextRight: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    width: 80,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '5 10',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: '5 10',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    flex: 1,
    color: '#1e293b',
  },
  tableCellRight: {
    width: 80,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },
  tableFooter: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    padding: '8 10',
  },
  tableFooterLabel: {
    flex: 1,
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },
  tableFooterValue: {
    color: '#10b981',
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
})

interface QuotePDFProps {
  studyNumber: string
  reference?: string | null
  productName: string
  quantity: number
  selectedPlate: Plate | undefined
  flatWidth: number
  flatHeight: number
  impositionResult: ImpositionResult | undefined
  printSurfacePercent: number
  isRectoVerso: boolean
  rectoVersoType: string | null
  hasVarnish: boolean
  hasFlatColor: boolean
  printMode: string
  cuttingTimePerPoseSeconds: number
  assemblyTimePerPieceSeconds: number
  packTimePerPieceSeconds: number
  hasAssemblyNotice: boolean
  printingCostData: PrintingCostData
  inkVolumeL: number                 // ✅
  cuttingCost: number
  assemblyCost: number
  packagingCost: number
  accessoriesCost: number
  consumablesCost: number
  selectedAccessories: SelectedAccessory[]
  selectedConsumables: SelectedConsumable[]
  hasPackaging: boolean              // ✅
  packagingTotalCost: number         // ✅
  packagingMaterialCost: number      // ✅
  packagingCuttingCost: number       // ✅
  totalCost: number
}

export function QuotePDF({
  studyNumber,
  reference,
  productName,
  quantity,
  selectedPlate,
  flatWidth,
  flatHeight,
  impositionResult,
  printSurfacePercent,
  isRectoVerso,
  rectoVersoType,
  hasVarnish,
  hasFlatColor,
  printMode,
  cuttingTimePerPoseSeconds,
  assemblyTimePerPieceSeconds,
  packTimePerPieceSeconds,
  hasAssemblyNotice,
  printingCostData,
  inkVolumeL,
  cuttingCost,
  assemblyCost,
  packagingCost,
  accessoriesCost,
  consumablesCost,
  selectedAccessories,
  selectedConsumables,
  hasPackaging,
  packagingTotalCost,
  packagingMaterialCost,
  packagingCuttingCost,
  totalCost,
}: QuotePDFProps) {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const costRows = [
    {
      label: 'Matière',
      detail: `${impositionResult?.platesNeeded} plaque(s) × ${selectedPlate?.cost}€`,
      value: impositionResult?.materialCost || 0,
    },
    {
      label: 'Impression (Encre)',
      detail: `${inkVolumeL.toFixed(3)} L`,   // ✅ corrigé
      value: printingCostData.inkCost,
    },
    {
      label: 'Impression (Temps)',
      detail: `${Math.round(printingCostData.timeMin)} min`,
      value: printingCostData.laborCost,
    },
    {
      label: 'Découpe',
      detail: `${cuttingTimePerPoseSeconds}s/pose`,
      value: cuttingCost,
    },
    {
      label: 'Façonnage',
      detail: `${assemblyTimePerPieceSeconds}s/pce`,
      value: assemblyCost,
    },
    {
      label: 'Conditionnement',
      detail: hasAssemblyNotice ? 'Avec notice' : `${packTimePerPieceSeconds}s/pce`,
      value: packagingCost,
    },
    {
      label: 'Accessoires',
      detail: `${selectedAccessories.length} réf.`,
      value: accessoriesCost,
    },
    {
      label: 'Consommables',
      detail: `${selectedConsumables.length} réf.`,
      value: consumablesCost,
    },
    // ✅ Emballage — ajouté uniquement si activé
    ...(hasPackaging && packagingTotalCost > 0
      ? [{
          label: 'Emballage',
          detail: `Matière ${packagingMaterialCost.toFixed(2)}€ + Découpe ${packagingCuttingCost.toFixed(2)}€`,
          value: packagingTotalCost,
        }]
      : []),
  ]

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <Image src="/logo.png" style={styles.logo} />
          <View style={styles.headerRight}>
            <Text style={styles.headerTitle}>Fiche de Devis</Text>
            <Text style={styles.headerSubtitle}>Calculateur PLV Kontfeel</Text>
            {reference && <Text style={styles.reference}>{reference}</Text>}
            <Text style={styles.headerSubtitle}>{date}</Text>
          </View>
        </View>

        {/* Informations générales */}
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 6, color: '#0f172a' }}>
              Informations
            </Text>
            <View style={styles.row}>
              <Text style={styles.label}>Dossier</Text>
              <Text style={styles.value}>{studyNumber}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Produit</Text>
              <Text style={styles.value}>{productName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Quantité</Text>
              <Text style={styles.value}>{quantity} pcs</Text>
            </View>
            <View style={styles.rowLast}>
              <Text style={styles.label}>Matière</Text>
              <Text style={styles.value}>{selectedPlate?.name || '-'}</Text>
            </View>
          </View>

          <View style={styles.gridItem}>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 6, color: '#0f172a' }}>
              Technique
            </Text>
            <View style={styles.row}>
              <Text style={styles.label}>Format à plat</Text>
              <Text style={styles.value}>{flatWidth} × {flatHeight} mm</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Poses / plaque</Text>
              <Text style={styles.value}>{impositionResult?.itemsPerPlate || 0}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Plaques nécessaires</Text>
              <Text style={styles.value}>{impositionResult?.platesNeeded || 0}</Text>
            </View>
            <View style={styles.rowLast}>
              <Text style={styles.label}>Orientation</Text>
              <Text style={styles.value}>{impositionResult?.orientation || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Impression */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Impression</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>Mode</Text>
                <Text style={styles.value}>
                  {printMode === 'production' ? 'Production' : 'Qualité'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Surface imprimée</Text>
                <Text style={styles.value}>{printSurfacePercent}%</Text>
              </View>
              <View style={styles.rowLast}>
                <Text style={styles.label}>Type</Text>
                <Text style={styles.value}>
                  {isRectoVerso
                    ? `Recto/Verso — ${rectoVersoType === 'identical' ? 'Identique' : 'Différent'}`
                    : 'Recto seul'}
                </Text>
              </View>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>Vernis</Text>
                <Text style={styles.value}>{hasVarnish ? 'Oui (+5%)' : 'Non'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Aplat</Text>
                <Text style={styles.value}>{hasFlatColor ? 'Oui (+5%)' : 'Non'}</Text>
              </View>
              <View style={styles.rowLast}>
                <Text style={styles.label}>Temps total</Text>
                <Text style={styles.value}>{Math.round(printingCostData.timeMin)} min</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tableau des coûts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail des Coûts</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Poste</Text>
              <Text style={{ ...styles.tableHeaderText, textAlign: 'center' }}>Détail</Text>
              <Text style={styles.tableHeaderTextRight}>Montant</Text>
            </View>
            {costRows.map((row, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={styles.tableCell}>{row.label}</Text>
                <Text style={{ ...styles.tableCell, color: '#64748b', textAlign: 'center' }}>
                  {row.detail}
                </Text>
                <Text style={styles.tableCellRight}>{row.value.toFixed(2)} €</Text>
              </View>
            ))}
            <View style={styles.tableFooter}>
              <Text style={styles.tableFooterLabel}>Total HT</Text>
              <View>
                <Text style={styles.tableFooterValue}>{totalCost.toFixed(2)} €</Text>
                <Text style={{ ...styles.footerText, color: '#94a3b8', textAlign: 'right' }}>
                  soit {(totalCost / quantity).toFixed(2)} € / pce
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Accessoires */}
        {selectedAccessories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accessoires</Text>
            <View style={styles.table}>
              {selectedAccessories.map((acc, i) => (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.tableCell}>{acc.name}</Text>
                  <Text style={{ ...styles.tableCell, textAlign: 'center' }}>× {acc.quantity}</Text>
                  <Text style={styles.tableCellRight}>
                    {(acc.price * acc.quantity).toFixed(2)} €
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Consommables */}
        {selectedConsumables.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consommables</Text>
            <View style={styles.table}>
              {selectedConsumables.map((sc, i) => (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.tableCell}>{sc.name}</Text>
                  <Text style={{ ...styles.tableCell, textAlign: 'center' }}>
                    {sc.sizePerItem} m/pose
                  </Text>
                  <Text style={styles.tableCellRight}>
                    {(((sc.sizePerItem * quantity) / sc.size) * sc.price).toFixed(2)} €
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Kontfeel — Document généré automatiquement
          </Text>
          <Text style={styles.footerText}>Dossier : {studyNumber} — {date}</Text>
        </View>

      </Page>
    </Document>
  )
}