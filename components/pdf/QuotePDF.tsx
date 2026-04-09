'use client'

import {
  Document, Page, Text, View, Image, StyleSheet,
} from '@react-pdf/renderer'
import { buildCostRows } from '@/lib/presentation/quote/cost-rows'
import { calculateCosts } from '@/lib/calculation/costs'
import type { CalculatorFormState } from '@/hooks/useCalculatorForm'
import type { ImpositionResult, SelectedAccessory, SelectedConsumable, Plate, ProductSlotResult } from '@/types/calculator'

type CostResult = ReturnType<typeof calculateCosts>

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
  logo: { width: 120, height: 40, objectFit: 'contain' },
  headerRight: { alignItems: 'flex-end' },
  headerTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 10, color: '#64748b', marginTop: 2 },
  reference: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#10b981', marginTop: 4 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    backgroundColor: '#f1f5f9',
    padding: '6 10',
    marginBottom: 8,
  },
  sectionTitleProduct: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    backgroundColor: '#e2e8f0',
    padding: '4 10',
    marginBottom: 4,
    marginTop: 8,
  },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
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
  rowLast: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { color: '#64748b', flex: 1 },
  value: { fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  table: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0f172a', padding: '6 10' },
  tableHeaderText: { color: '#ffffff', fontFamily: 'Helvetica-Bold', flex: 1 },
  tableHeaderTextRight: { color: '#ffffff', fontFamily: 'Helvetica-Bold', textAlign: 'right', width: 80 },
  tableRow: { flexDirection: 'row', padding: '5 10', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableRowAlt: { flexDirection: 'row', padding: '5 10', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#f8fafc' },
  tableRowSub: { flexDirection: 'row', padding: '4 10 4 20', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#f8fafc' },
  tableRowProduct: { flexDirection: 'row', padding: '4 10', backgroundColor: '#e2e8f0', borderBottomWidth: 1, borderBottomColor: '#cbd5e1' },
  tableRowSubtotal: { flexDirection: 'row', padding: '5 10', backgroundColor: '#ecfdf5', borderBottomWidth: 1, borderBottomColor: '#6ee7b7' },
  tableRowCommon: { flexDirection: 'row', padding: '4 10', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tableCell: { flex: 1, color: '#1e293b' },
  tableCellSub: { flex: 1, color: '#64748b', fontSize: 9 },
  tableCellRight: { width: 80, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  tableCellRightGreen: { width: 80, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: '#059669' },
  tableFooter: { flexDirection: 'row', backgroundColor: '#0f172a', padding: '8 10' },
  tableFooterLabel: { flex: 1, color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 12 },
  tableFooterValue: { color: '#10b981', fontFamily: 'Helvetica-Bold', fontSize: 14, textAlign: 'right' },
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
  footerText: { fontSize: 8, color: '#94a3b8' },
  badgeMulti: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
    borderRadius: 4,
    padding: '2 6',
    marginTop: 4,
  },
  badgeMultiText: { fontSize: 9, color: '#059669', fontFamily: 'Helvetica-Bold' },
})

interface QuotePDFProps {
  quoteInfo: {
    studyNumber: string
    reference?: string | null
    productName: string
    quantity: number
  }
  formValues: CalculatorFormState
  costResult: CostResult
  selectedPlate: Plate | undefined
  impositionResult: ImpositionResult | undefined
  selectedAccessories: SelectedAccessory[]
  selectedConsumables: SelectedConsumable[]
  isMultiProduct?: boolean
  productSlotResults?: ProductSlotResult[]
  totalCostMulti?: number
}

export function QuotePDF({
  quoteInfo,
  formValues,
  costResult,
  selectedPlate,
  impositionResult,
  selectedAccessories,
  selectedConsumables,
  isMultiProduct = false,
  productSlotResults = [],
  totalCostMulti = 0,
}: QuotePDFProps) {

  const { studyNumber, reference, productName, quantity } = quoteInfo

  const {
    inkMlPerPlate,
    varnishSurfacePercent,
    flatColorSurfacePercent,
    flatWidth,
    flatHeight,
    printMode,
    isRectoVerso,
    rectoVersoType,
    hasVarnish,
    hasFlatColor,
    hasImpression,
    printSetupType,
    cuttingSetupType,
    hasFaconnage,
    hasConditionnement,
    hasAccessoires,
    hasPackaging,
    hasAssemblyNotice,
    assemblyTimePerPieceSeconds,
    packTimePerPieceSeconds,
  } = formValues

  const {
    printingCostData,
    inkVolumeL,
    cuttingCost,
    cuttingMachineCost,
    cuttingSetupCost,
    cuttingSetupTimeMin,
    cuttingMachineTimeMin,
    assemblyCost,
    packagingCost,
    accessoriesCost,
    consumablesCost,
    totalCost,
    packagingTotalCost,
    packagingMaterialCost,
    packagingCuttingCost,
  } = costResult

  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  const varnishRatio = hasVarnish ? varnishSurfacePercent / 100 : 0
  const flatColorRatio = hasFlatColor ? flatColorSurfacePercent / 100 : 0
  const standardPercent = Math.round(Math.max(0, 1 - varnishRatio - flatColorRatio) * 100)

  const displayTotal = isMultiProduct ? totalCostMulti : totalCost
  const displayQuantity = isMultiProduct
    ? productSlotResults.reduce((sum, r) => sum + r.slot.quantity, 0)
    : quantity

  // Lignes sections communes
  const commonCostRows = buildCostRows({
    impositionResult: isMultiProduct ? null : impositionResult,
    selectedPlate: isMultiProduct ? undefined : selectedPlate,
    hasImpression: isMultiProduct ? false : hasImpression,
    inkVolumeL,
    printingCostData,
    printSetupType: isMultiProduct ? 'none' : printSetupType,
    cuttingSetupType: isMultiProduct ? 'none' : cuttingSetupType,
    cuttingMachineTimeMin,
    cuttingMachineCost,
    cuttingSetupCost,
    hasFaconnage,
    assemblyTimePerPieceSeconds,
    assemblyCost,
    selectedConsumables,
    consumablesCost,
    hasConditionnement,
    hasAssemblyNotice,
    packTimePerPieceSeconds,
    packagingCost,
    hasAccessoires,
    accessoriesCost,
    selectedAccessories,
    hasPackaging,
    packagingTotalCost,
    packagingMaterialCost,
    packagingCuttingCost,
    hasDossierFee: formValues.hasDossierFee,
    dossierFeeCost: costResult.dossierFeeCost,
    materialCostMarged: costResult.materialCostMarged,
    materialMarginCoeff: costResult.materialMarginCoeff,
    transportTotal: costResult.transportTotal,
    transportDeliveriesCount: formValues.transportDeliveries?.length,
  })

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
            {isMultiProduct && (
              <View style={styles.badgeMulti}>
                <Text style={styles.badgeMultiText}>Devis multi-produits — {productSlotResults.length} produits</Text>
              </View>
            )}
            <Text style={styles.headerSubtitle}>{date}</Text>
          </View>
        </View>

        {/* Informations générales */}
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 6, color: '#0f172a' }}>Informations</Text>
            <View style={styles.row}><Text style={styles.label}>Dossier</Text><Text style={styles.value}>{studyNumber}</Text></View>
            <View style={styles.row}>
              <Text style={styles.label}>Produit</Text>
              <Text style={styles.value}>{isMultiProduct ? `${productSlotResults.length} produits` : productName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Quantité totale</Text>
              <Text style={styles.value}>{displayQuantity} pcs</Text>
            </View>
            {!isMultiProduct && (
              <View style={styles.rowLast}><Text style={styles.label}>Matière</Text><Text style={styles.value}>{selectedPlate?.name || '-'}</Text></View>
            )}
          </View>

          {!isMultiProduct && (
            <View style={styles.gridItem}>
              <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 6, color: '#0f172a' }}>Technique</Text>
              <View style={styles.row}><Text style={styles.label}>Format à plat</Text><Text style={styles.value}>{flatWidth} × {flatHeight} mm</Text></View>
              <View style={styles.row}><Text style={styles.label}>Poses / plaque</Text><Text style={styles.value}>{impositionResult?.itemsPerPlate || 0}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Plaques nécessaires</Text><Text style={styles.value}>{impositionResult?.platesNeeded || 0}</Text></View>
              <View style={styles.rowLast}><Text style={styles.label}>Orientation</Text><Text style={styles.value}>{impositionResult?.orientation || '-'}</Text></View>
            </View>
          )}

          {isMultiProduct && (
            <View style={styles.gridItem}>
              <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 6, color: '#0f172a' }}>Produits</Text>
              {productSlotResults.map((r, i) => (
                <View key={i} style={i < productSlotResults.length - 1 ? styles.row : styles.rowLast}>
                  <Text style={styles.label}>{r.slot.productSearch || `Produit ${i + 1}`}</Text>
                  <Text style={styles.value}>{r.slot.quantity} pcs — {r.costResult.subtotal.toFixed(2)} €</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Impression mono — si activée */}
        {!isMultiProduct && hasImpression && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Impression</Text>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <View style={styles.row}>
                  <Text style={styles.label}>Mode</Text>
                  <Text style={styles.value}>{printMode === 'production' ? 'Production' : 'Qualité'}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Encre totale</Text>
                  <Text style={styles.value}>{inkMlPerPlate} ml/plaque</Text>
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
                  <Text style={styles.label}>Encre standard</Text>
                  <Text style={styles.value}>{standardPercent}%</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Vernis</Text>
                  <Text style={styles.value}>{hasVarnish ? `${varnishSurfacePercent}%` : '—'}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Aplat</Text>
                  <Text style={styles.value}>{hasFlatColor ? `${flatColorSurfacePercent}%` : '—'}</Text>
                </View>
                <View style={styles.rowLast}>
                  <Text style={styles.label}>Temps machine</Text>
                  <Text style={styles.value}>{Math.round(printingCostData.machineTimeMin)} min</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Tableau des coûts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail des Coûts</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Poste</Text>
              <Text style={{ ...styles.tableHeaderText, textAlign: 'center' }}>Détail</Text>
              <Text style={styles.tableHeaderTextRight}>Montant</Text>
            </View>

            {/* ── Mode multi : lignes par produit ── */}
            {isMultiProduct && productSlotResults.map((result, i) => (
              <View key={i}>
                {/* En-tête produit */}
                <View style={styles.tableRowProduct}>
                  <Text style={{ ...styles.tableCell, fontFamily: 'Helvetica-Bold', fontSize: 9 }}>
                    {result.slot.productSearch || `Produit ${i + 1}`} — {result.slot.quantity} pcs
                  </Text>
                  <Text style={{ color: '#64748b', textAlign: 'center', fontSize: 9 }}>
                    {result.slot.flatWidth}×{result.slot.flatHeight} mm
                  </Text>
                  <Text style={{ ...styles.tableCellRight, color: '#475569', fontSize: 9 }}></Text>
                </View>

                {/* Matière */}
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>Matière</Text>
                  <Text style={{ ...styles.tableCell, color: '#64748b', textAlign: 'center' }}>
                    {result.impositionResult ? `${result.impositionResult.platesNeeded} plaque(s)` : '—'}
                  </Text>
                  <Text style={styles.tableCellRight}>{result.costResult.materialCost.toFixed(2)} €</Text>
                </View>

                {/* Impression */}
                {result.slot.hasImpression && (
                  <>
                    <View style={styles.tableRowAlt}>
                      <Text style={styles.tableCell}>Impression (encre)</Text>
                      <Text style={{ ...styles.tableCell, color: '#64748b', textAlign: 'center' }}>
                        {result.costResult.inkVolumeL.toFixed(3)} L
                      </Text>
                      <Text style={styles.tableCellRight}>{result.costResult.printingCostData.inkCost.toFixed(2)} €</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>Impression (machine)</Text>
                      <Text style={{ ...styles.tableCell, color: '#64748b', textAlign: 'center' }}>
                        {Math.round(result.costResult.printingCostData.machineTimeMin)} min
                      </Text>
                      <Text style={styles.tableCellRight}>{result.costResult.printingCostData.machineCost.toFixed(2)} €</Text>
                    </View>
                  </>
                )}

                {/* Découpe */}
                <View style={styles.tableRowAlt}>
                  <Text style={styles.tableCell}>Découpe</Text>
                  <Text style={{ ...styles.tableCell, color: '#64748b', textAlign: 'center' }}>
                    {Math.round(result.costResult.cuttingMachineTimeMin)} min
                  </Text>
                  <Text style={styles.tableCellRight}>{result.costResult.cuttingCost.toFixed(2)} €</Text>
                </View>

                {/* Sous-total produit */}
                <View style={styles.tableRowSubtotal}>
                  <Text style={{ ...styles.tableCell, fontFamily: 'Helvetica-Bold', color: '#059669' }}>
                    Sous-total {result.slot.productSearch || `Produit ${i + 1}`}
                  </Text>
                  <Text style={{ ...styles.tableCell, textAlign: 'center' }}></Text>
                  <Text style={styles.tableCellRightGreen}>{result.costResult.subtotal.toFixed(2)} €</Text>
                </View>
              </View>
            ))}

            {/* Séparateur sections communes en mode multi */}
            {isMultiProduct && commonCostRows.length > 0 && (
              <View style={styles.tableRowCommon}>
                <Text style={{ ...styles.tableCell, fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#475569' }}>
                  Sections communes
                </Text>
                <Text style={{ ...styles.tableCell, textAlign: 'center' }}></Text>
                <Text style={styles.tableCellRight}></Text>
              </View>
            )}

            {/* Lignes communes */}
            {commonCostRows.map((row, i) => (
              <View key={i} style={row.sub ? styles.tableRowSub : i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={row.sub ? styles.tableCellSub : styles.tableCell}>{row.label}</Text>
                <Text style={{ ...(row.sub ? styles.tableCellSub : styles.tableCell), color: '#64748b', textAlign: 'center' }}>
                  {row.detail}
                </Text>
                <Text style={row.sub
                  ? { ...styles.tableCellRight, color: '#64748b', fontSize: 9 }
                  : styles.tableCellRight
                }>
                  {row.value.toFixed(2)} €
                </Text>
              </View>
            ))}

            {/* Total */}
            <View style={styles.tableFooter}>
              <Text style={styles.tableFooterLabel}>Total HT</Text>
              <View>
                <Text style={styles.tableFooterValue}>{displayTotal.toFixed(2)} €</Text>
                <Text style={{ ...styles.footerText, color: '#94a3b8', textAlign: 'right' }}>
                  soit {(displayTotal / (displayQuantity || 1)).toFixed(2)} € / pce
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Accessoires */}
        {hasAccessoires && selectedAccessories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accessoires</Text>
            <View style={styles.table}>
              {selectedAccessories.map((acc, i) => (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.tableCell}>{acc.name}</Text>
                  <Text style={{ ...styles.tableCell, textAlign: 'center' }}>× {acc.quantity}</Text>
                  <Text style={styles.tableCellRight}>{(acc.price * acc.quantity).toFixed(2)} €</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Transport */}
        {formValues.transportDeliveries && formValues.transportDeliveries.length > 0 && formValues.transportDeliveries.some(d => d.mode) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transport GEODIS</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Mode</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Dept.</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Qté</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Poids</Text>
                <Text style={styles.tableHeaderTextRight}>Options</Text>
              </View>
              {formValues.transportDeliveries.filter(d => d.mode).map((d, i) => (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {d.mode === 'PACK30' ? 'Pack 30' : d.mode === 'MESSAGERIE_PLUS' ? 'Messagerie+' : 'Affrètement'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{d.department ?? '—'}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                    {d.units} {d.mode === 'AFFRETEMENT' ? 'pal.' : 'colis'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                    {d.mode !== 'AFFRETEMENT' && d.weightKg != null ? `${d.weightKg} kg` : '—'}
                  </Text>
                  <Text style={styles.tableCellRight}>
                    {d.optionsHT ? `${d.optionsHT.toFixed(2)} €` : '—'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Consommables */}
        {hasFaconnage && selectedConsumables.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consommables</Text>
            <View style={styles.table}>
              {selectedConsumables.map((sc, i) => (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.tableCell}>{sc.name}</Text>
                  <Text style={{ ...styles.tableCell, textAlign: 'center' }}>{sc.sizePerItem} m/pose</Text>
                  <Text style={styles.tableCellRight}>
                    {(((sc.sizePerItem * displayQuantity) / sc.size) * sc.price).toFixed(2)} €
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>© {new Date().getFullYear()} Kontfeel — Document généré automatiquement</Text>
          <Text style={styles.footerText}>Dossier : {studyNumber} — {date}</Text>
        </View>

      </Page>
    </Document>
  )
}
