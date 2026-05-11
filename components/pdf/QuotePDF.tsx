'use client'

import {
  Document, Page, Text, View, Image, StyleSheet,
} from '@react-pdf/renderer'
import { buildCostRows } from '@/lib/presentation/quote/cost-rows'
import { calculateCosts } from '@/lib/calculation/costs'
import type { CalculatorFormState } from '@/hooks/useCalculatorForm'
import type { ImpositionResult, SelectedAccessory, SelectedConsumable, Plate, ProductSlotResult, AmalgameGroup, AmalgameGroupResult } from '@/types/calculator'

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
  headerClient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
  },
  logo: { width: 120, height: 40, objectFit: 'contain' },
  addressLine: { fontSize: 8, color: '#64748b', marginTop: 2 },
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
  gridItemTitle: { fontFamily: 'Helvetica-Bold', marginBottom: 6, color: '#0f172a' },
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
  // ── Client-specific styles ──
  totalBlock: {
    backgroundColor: '#0f172a',
    padding: '12 16',
    borderRadius: 4,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalBlockLeft: {},
  totalBlockLabel: { color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 14 },
  totalBlockSubLabel: { color: '#94a3b8', fontSize: 8, marginTop: 2 },
  totalBlockValue: { color: '#10b981', fontFamily: 'Helvetica-Bold', fontSize: 20, textAlign: 'right' },
  totalBlockPerUnit: { color: '#94a3b8', fontSize: 9, textAlign: 'right', marginTop: 2 },
  validityBlock: { marginBottom: 12 },
  validityText: { fontSize: 9, color: '#475569', marginBottom: 3 },
  salutationText: { fontSize: 9, color: '#1e293b', marginTop: 4 },
  signatureBox: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: '10 12',
    borderRadius: 4,
    marginBottom: 12,
  },
  signatureIntro: { fontSize: 8, color: '#475569', marginBottom: 8 },
  signatureGrid: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  signatureField: { flex: 1 },
  signatureFieldLabel: { fontSize: 8, color: '#64748b', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 2 },
  signatureNote: { fontSize: 8, color: '#475569', marginBottom: 3 },
  legalText: { fontSize: 7, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  // ── CGV page ──
  cgvPage: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 6,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  cgvMainTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 3 },
  cgvLegal: { fontSize: 6, color: '#64748b', marginBottom: 8 },
  cgvColumns: { flexDirection: 'row', gap: 14 },
  cgvColumn: { flex: 1 },
  cgvSection: { marginBottom: 5 },
  cgvSectionTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 1 },
  cgvText: { fontSize: 6, lineHeight: 1.4, color: '#374151' },
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
  amalgameGroups?: AmalgameGroup[]
  amalgameGroupResults?: AmalgameGroupResult[]
  mode?: 'internal' | 'client'
  authorName?: string
}

const CGV_SECTIONS = [
  {
    title: '1. CLAUSE GENERALE',
    text: "Les conditions générales de vente décrites ci-après détaillent les droits et obligations de la société Kontfeel et de son client dans le cadre de la vente de produits ou services proposés par cette dernière. Toute prestation accomplie par la société Kontfeel implique donc l'adhésion entière et sans réserve de l'acheteur aux présentes conditions générales de vente, nonobstant toutes clauses ou stipulations différentes présentes dans les documents de l'Acheteur, sauf dérogation écrite de notre part.",
  },
  {
    title: '2. CLAUSE DE COMMANDE',
    text: "Nos ventes sont faites au prix figurant sur l'offre, et la validité de nos offres est de 30 jours maximum à compter de leurs dates d'émission, les prix sont révisables à l'issue de cette durée dans les conditions stipulées dans notre proposition ou contrat. Aucune prestation ne sera entreprise sans que le devis nous ait été renvoyé, tamponné, daté et signé par l'acheteur, avec la mention « bon pour accord ». Toute commande s'analyse comme une promesse d'achat. Est réputée nulle toute annulation survenant après la mise en fabrication de la commande. Toutes modifications de la commande demandées après validation seront analysées et chiffrées et ne s'effectuerons qu'après accord du nouveau devis par l'Acheteur. Les prix des marchandises vendues par la société Kontfeel sont ceux en vigueur au jour de la prise de commande. Ils sont libellés en euros et calculés hors taxes. Par voie de conséquence, ils seront majorés du taux de TVA et des frais de transport applicables au jour de la commande. La société Kontfeel s'accorde le droit de modifier ses tarifs à tout moment. Toutefois, elle s'engage à facturer les marchandises commandées aux prix indiqués lors de l'enregistrement de la commande. Compte tenu de la spécificité de ses fabrications, notre Société pourra effectuer des livraisons partielles et se réserve la faculté de livrer des quantités supérieures ou inférieures aux quantités commandées (+/- 5%). L'acheteur s'engage à accepter la facturation de la marchandise livrée en plus et à ne pas réclamer les produits manquants en cas de passe négative.",
  },
  {
    title: '3. CLAUSE DE TRANSFERT DE RISQUES',
    text: "Il appartient à l'Acheteur de faire les réserves éventuelles près du voiturier, conformément à l'article 100 du Code du Commerce, et toute réclamation n'ayant pas été faite dans les huit jours de la date de la livraison sera considérée comme nulle et non recevable. Les marchandises que l'acheteur nous demanderait de conserver en nos dépôts, le seront à ses risques et périls et sous sa seule responsabilité. Les frais d'entreposage et d'assurance éventuels sont à la charge de l'Acheteur.",
  },
  {
    title: "4. CLAUSE D'EXPEDITION",
    text: "Les délais de livraison indiqués ne sont pas de rigueur et un retard dans les livraisons ne peut donner lieu à dommages et intérêts, ni à retenue, ni annulation des commandes en cours. La société Kontfeel s'engage à respecter le délai indiqué dans la confirmation de commande, uniquement dans la mesure où les documents nécessaires à la fabrication sont validés et transmis dans les délais et conditions prévues. Si l'enlèvement est à la charge de l'acheteur, à défaut d'enlèvement dans les huit jours, nous pourrons prendre toute mesure nécessaire pour stocker la marchandise aux frais de l'Acheteur, après mise en demeure de retirement de la marchandise, si l'Acheteur ne donne pas suite, nous nous réservons le droit de détruire le stock dans un délai de 30 jours après la mise en demeure.",
  },
  {
    title: '5. CLAUSE DE FACTURATION',
    text: "La facture est établie après la confirmation de livraison de la marchandise.",
  },
  {
    title: '6. CLAUSES DE PAIEMENT',
    text: "6.1 Générales — Les factures sont payables aux échéances prévues et sauf dérogations contraires à 30 jours nets à date de la facture. 6.2 Acompte — La société Kontfeel peut exiger un acompte de 30% du total de la commande. L'Acheteur en aura été avertis lors de la commande. Cet acompte est payable au comptant à réception de la facture d'acompte. Le solde de la commande sera payable à 30 jours à réception de la facture de solde. 6.3 Pénalités de retard — Tout défaut de paiement à la date d'échéance entraînera sauf dérogation sans autre avis, des pénalités de retard calculées sur la base d'un taux équivalent à celui qui résulte de l'application du taux d'intérêt de la BCE, le plus récent, majoré de 10 points de pourcentage. Ces pénalités seront exigibles sur simple demande de notre Société. Toute facture recouvrée par service contentieux sera majorée à titre de clause pénale d'une indemnité fixée forfaitairement à 10% du montant en principal HT des impayés.",
  },
  {
    title: '7. CLAUSE DE RESERVE DE PROPRIETE',
    text: "La société Kontfeel se réserve la propriété des marchandises livrées par elle jusqu'au paiement complet du prix en principal et accessoires. A défaut de paiement du prix à l'échéance convenue, le vendeur pourra reprendre les marchandises, la vente sera résolue de plein droit si bon lui semble et les acomptes déjà versés lui resteront acquis à titre de dédommagement. La disposition ci-dessus ne fait pas obstacle dès la livraison des marchandises au transfert à l'Acheteur des risques de perte ou de détérioration des biens soumis à réserve de propriété. En cas de non-paiement, la restitution des marchandises pourra résulter soit d'une mise en demeure recommandée, soit d'un inventaire contradictoire, soit d'une sommation d'huissier ; l'Acheteur ne pourra s'y dérober.",
  },
  {
    title: '8. PROPRIETE INTELLECTUELLE ET CONFIDENTIALITE',
    text: "8.1 Propriété intellectuelle — Tous droits de propriété intellectuelle relatifs à des rapports, études, croquis, modélisation 3d, prototypes et autres documents réalisés par la société Kontfeel dans le cadre de l'exécution du contrat, sont la propriété de la société Kontfeel. L'Acheteur est autorisé à utiliser ces rapports, études, dessins, modèles ou autres données aux seules fins du contrat. De même, l'Acheteur accepte et reconnaît que la société Kontfeel reste titulaire de l'intégralité des droits de propriété relatifs aux concepts, idées et inventions qui pourraient voir le jour dans le cadre de l'exécution du Contrat. L'Acheteur garantit que tout document communiqué à la société Kontfeel, par lui, ses auxiliaires et/ou ses représentants est libre de tout droit d'auteur, appartenant à un tiers. La validation de la commande dégage la société Kontfeel de toutes poursuites et condamnations pour contrefaçons et concurrence déloyale. L'Acheteur s'engage irrévocablement à payer, en sa qualité de garant, tous dommages et intérêts qui seraient réclamés à la société Kontfeel, au titre de la violation des droits d'auteur d'un tiers, du fait de l'exécution des services ou prestations acceptées par l'Acheteur. 8.2 Confidentialité — Les parties reconnaissent qu'elles seront susceptibles de recevoir des informations confidentielles de l'autre partie, dans le cadre de la prestation de services. Chaque partie veillera à protéger la confidentialité des informations confidentielles qu'elle reçoit avec le même degré de protection qu'elle accorde à ses propres informations confidentielles d'importance similaire, et en aucun cas avec un degré de protection moins suffisant. Chaque partie devra, sous demande raisonnable écrite de l'autre partie, exiger d'engager ses sous-traitants dans le cadre des services fournis par contrat afin de garder confidentielles toutes informations confidentielles ; toutefois, les parties, leurs sous-traitants et/ou employés pourront être amenés à divulguer ces informations confidentielles si nécessaire pour l'exécution du contrat.",
  },
  {
    title: '9. OUTILLAGE',
    text: "Les outillages et clichés conçus par notre Société restent sa propriété sauf paiement intégral par l'Acheteur. A défaut de commande de renouvellement dans un délai de 12 mois, notre Société se réserve la possibilité de détruire les outillages et clichés non utilisés, sans que l'Acheteur puisse prétendre à un quelconque remboursement.",
  },
  {
    title: '10. FORCE MAJEURE',
    text: "La force majeure qui libère la société Kontfeel de ses obligations ou excuse le retard dans l'exécution de ses obligations, s'entend de tout événement ne pouvant être surmonté, malgré une diligence raisonnable de la société Kontfeel tels que et sans que cette liste soit limitative, incendies, explosions, inondations, pénuries de matières ou de transport, insuffisance de courant électrique et d'énergie, accident affectant la production, délais anormaux de certification, force majeure des fournisseurs et/ou sous-traitants, grèves, lock out, émeutes, attentats, guerre. En cas de survenance d'un cas de force majeure, la société Kontfeel devra en informer l'Acheteur dans les meilleurs délais suivant la survenance de l'événement.",
  },
  {
    title: '11. INFORMATIQUE ET LIBERTES',
    text: "Les informations imprimées sur le présent document ne sont utilisées et ne font l'objet de communications extérieures que pour les seules nécessités de la gestion et pour satisfaire aux obligations légales et réglementaires. Elles pourront donner lieu à exercice du droit d'accès dans les conditions prévues par la loi n° 78.17 du 6 Janvier 1978 relative à l'informatique, aux fichiers et aux libertés.",
  },
  {
    title: '12. CLAUSE TERRITORIALE DE JURIDICTION',
    text: "En cas de litige éventuel de quelque nature que ce soit, attribution de juridiction est faite aux Tribunaux du Siège Social de la société Kontfeel à moins que notre société ne préfère saisir toute autre juridiction compétente. Cette clause s'applique même en cas de référé, de demande incidente ou de pluralité de défendeurs ou d'appel en garantie ainsi qu'en cas de clause de compétence contraire.",
  },
]

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
  amalgameGroups = [],
  amalgameGroupResults = [],
  mode = 'internal',
  authorName,
}: QuotePDFProps) {
  const isClient = mode === 'client'

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
    packagingBoxType,
    packagingMaterialType,
    packagingExternalSize,
    packagingQuantity,
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
    packagingExternalUnitPrice,
    effectivePackagingUnitPrice,
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
    packagingBoxType,
    packagingMaterialType,
    packagingExternalSize,
    packagingExternalUnitPrice,
    effectivePackagingUnitPrice,
    packagingQuantity,
    hasDossierFee: formValues.hasDossierFee,
    dossierFeeCost: costResult.dossierFeeCost,
    materialCostMarged: costResult.materialCostMarged,
    materialMarginCoeff: costResult.materialMarginCoeff,
    transportTotal: costResult.transportTotal,
    transportCostMarged: costResult.transportCostMarged,
    transportMargin: costResult.transportMargin,
    transportDeliveriesCount: formValues.transportDeliveries?.length,
    mode,
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        {isClient ? (
          <View style={styles.headerClient}>
            <View>
              <Image src="/logo.png" style={styles.logo} />
              <Text style={styles.addressLine}>72, rue de la République</Text>
              <Text style={styles.addressLine}>76140 Le Petit-Quevilly</Text>
              <Text style={styles.addressLine}>Tél. 02 78 77 53 93</Text>
              <Text style={styles.addressLine}>Mail : contact@kontfeel.fr</Text>
              <Text style={styles.addressLine}>www.kontfeel.fr</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerTitle}>Devis</Text>
              {reference && <Text style={styles.reference}>{reference}</Text>}
              {isMultiProduct && (
                <View style={styles.badgeMulti}>
                  <Text style={styles.badgeMultiText}>Devis multi-produits — {productSlotResults.length} produits</Text>
                </View>
              )}
              <Text style={styles.headerSubtitle}>{date}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.header}>
            <Image src="/logo.png" style={styles.logo} />
            <View style={styles.headerRight}>
              <Text style={styles.headerTitle}>Fiche de Devis</Text>
              <Text style={styles.headerSubtitle}>Calculateur PLV Kontfeel — Usage interne</Text>
              {reference && <Text style={styles.reference}>{reference}</Text>}
              {isMultiProduct && (
                <View style={styles.badgeMulti}>
                  <Text style={styles.badgeMultiText}>Devis multi-produits — {productSlotResults.length} produits</Text>
                </View>
              )}
              <Text style={styles.headerSubtitle}>{date}</Text>
            </View>
          </View>
        )}

        {/* ── Infos générales (mode interne) ── */}
        {!isClient && (
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridItemTitle}>Informations</Text>
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
                <Text style={styles.gridItemTitle}>Technique</Text>
                <View style={styles.row}><Text style={styles.label}>Format à plat</Text><Text style={styles.value}>{flatWidth} × {flatHeight} mm</Text></View>
                <View style={styles.row}><Text style={styles.label}>Poses / plaque</Text><Text style={styles.value}>{impositionResult?.itemsPerPlate || 0}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Plaques nécessaires</Text><Text style={styles.value}>{impositionResult?.platesNeeded || 0}</Text></View>
                <View style={styles.rowLast}><Text style={styles.label}>Orientation</Text><Text style={styles.value}>{impositionResult?.orientation || '-'}</Text></View>
              </View>
            )}

            {isMultiProduct && (
              <View style={styles.gridItem}>
                <Text style={styles.gridItemTitle}>Produits</Text>
                {productSlotResults.filter(r => !r.slot.amalgameGroupId).map((r, i) => (
                  <View key={i} style={styles.row}>
                    <Text style={styles.label}>{r.slot.productSearch || `Produit ${i + 1}`}</Text>
                    <Text style={styles.value}>{r.slot.quantity} pcs — {r.costResult.subtotal.toFixed(2)} €</Text>
                  </View>
                ))}
                {amalgameGroups.map((group) => {
                  const groupResult = amalgameGroupResults.find(r => r.groupId === group.id)
                  if (!groupResult) return null
                  const slotsInGroup = productSlotResults.filter(r => r.slot.amalgameGroupId === group.id)
                  if (slotsInGroup.length === 0) return null
                  return (
                    <View key={group.id} style={styles.row}>
                      <Text style={{ ...styles.label, color: '#5b21b6' }}>Amalgame : {group.name}</Text>
                      <Text style={{ ...styles.value, color: '#5b21b6' }}>
                        {slotsInGroup.reduce((s, r) => s + r.slot.quantity, 0)} pcs — {groupResult.totalCost.toFixed(2)} €
                      </Text>
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        )}

        {/* ── Infos client + dossier (mode client) ── */}
        {isClient && (
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridItemTitle}>Destinataire</Text>
              <View style={styles.row}><Text style={styles.label}>A l'attention de</Text><Text style={styles.value}>{formValues.contactName || formValues.client || '—'}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Réalisé par</Text><Text style={styles.value}>{authorName || '—'}</Text></View>
              <View style={styles.rowLast}><Text style={styles.label}>Édité le</Text><Text style={styles.value}>{date}</Text></View>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.gridItemTitle}>Dossier</Text>
              <View style={styles.row}><Text style={styles.label}>N° dossier</Text><Text style={styles.value}>{studyNumber}</Text></View>
              <View style={styles.row}>
                <Text style={styles.label}>Produit</Text>
                <Text style={styles.value}>{isMultiProduct ? `${productSlotResults.length} produits` : productName}</Text>
              </View>
              <View style={styles.row}><Text style={styles.label}>Quantité totale</Text><Text style={styles.value}>{displayQuantity} pcs</Text></View>
              {!isMultiProduct && (
                <>
                  <View style={styles.row}><Text style={styles.label}>Matière</Text><Text style={styles.value}>{selectedPlate?.name || '—'}</Text></View>
                  <View style={styles.row}><Text style={styles.label}>Format à plat</Text><Text style={styles.value}>{flatWidth} × {flatHeight} mm</Text></View>
                  <View style={styles.rowLast}><Text style={styles.label}>Plaques nécessaires</Text><Text style={styles.value}>{impositionResult?.platesNeeded || 0}</Text></View>
                </>
              )}
              {isMultiProduct && (
                <View style={styles.rowLast}>
                  <Text style={styles.label}>Produits</Text>
                  <Text style={styles.value}>{productSlotResults.length} références</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Impression (usage interne uniquement) ── */}
        {!isClient && !isMultiProduct && hasImpression && (
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

        {/* ── Tableau des coûts ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail des Coûts</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Poste</Text>
              <Text style={{ ...styles.tableHeaderText, textAlign: 'center' }}>Détail</Text>
              <Text style={styles.tableHeaderTextRight}>Montant</Text>
            </View>

            {/* Mode multi : produits individuels (hors amalgame) */}
            {isMultiProduct && productSlotResults
              .map((result, i) => ({ result, i }))
              .filter(({ result }) => !result.slot.amalgameGroupId)
              .map(({ result, i }) => (
                <View key={i}>
                  <View style={styles.tableRowProduct}>
                    <Text style={{ ...styles.tableCell, fontFamily: 'Helvetica-Bold', fontSize: 9 }}>
                      {result.slot.productSearch || `Produit ${i + 1}`} — {result.slot.quantity} pcs
                    </Text>
                    <Text style={{ color: '#64748b', textAlign: 'center', fontSize: 9 }}>
                      {result.slot.flatWidth}×{result.slot.flatHeight} mm
                    </Text>
                    <Text style={{ ...styles.tableCellRight, color: '#475569', fontSize: 9 }}></Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCell}>Matière</Text>
                    <Text style={{ ...styles.tableCell, color: '#64748b', textAlign: 'center' }}>
                      {result.impositionResult ? `${result.impositionResult.platesNeeded} plaque(s)` : '—'}
                    </Text>
                    <Text style={styles.tableCellRight}>{result.costResult.materialCostMarged.toFixed(2)} €</Text>
                  </View>
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
                  <View style={styles.tableRowAlt}>
                    <Text style={styles.tableCell}>Découpe</Text>
                    <Text style={{ ...styles.tableCell, color: '#64748b', textAlign: 'center' }}>
                      {Math.round(result.costResult.cuttingMachineTimeMin)} min
                    </Text>
                    <Text style={styles.tableCellRight}>{result.costResult.cuttingCost.toFixed(2)} €</Text>
                  </View>
                  <View style={styles.tableRowSubtotal}>
                    <Text style={{ ...styles.tableCell, fontFamily: 'Helvetica-Bold', color: '#059669' }}>
                      Sous-total {result.slot.productSearch || `Produit ${i + 1}`}
                    </Text>
                    <Text style={{ ...styles.tableCell, textAlign: 'center' }}></Text>
                    <Text style={styles.tableCellRightGreen}>{result.costResult.subtotal.toFixed(2)} €</Text>
                  </View>
                </View>
              ))
            }

            {/* Mode multi : groupes amalgame */}
            {isMultiProduct && amalgameGroups.map((group) => {
              const groupResult = amalgameGroupResults.find(r => r.groupId === group.id)
              if (!groupResult) return null
              const slotsInGroup = productSlotResults.filter(r => r.slot.amalgameGroupId === group.id)
              if (slotsInGroup.length === 0) return null
              const isImpression = group.amalgameType === 'impression_decoupe'
              return (
                <View key={group.id}>
                  {/* En-tête du groupe */}
                  <View style={{ ...styles.tableRowProduct, backgroundColor: '#ede9fe' }}>
                    <Text style={{ ...styles.tableCell, fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#5b21b6' }}>
                      Amalgame : {group.name} — {isImpression ? 'Impression + Découpe' : 'Découpe seule'}
                    </Text>
                    <Text style={{ color: '#7c3aed', textAlign: 'center', fontSize: 9 }}>
                      {groupResult.platesCount} plaque{groupResult.platesCount > 1 ? 's' : ''}
                    </Text>
                    <Text style={{ ...styles.tableCellRight, color: '#5b21b6', fontSize: 9 }}></Text>
                  </View>

                  {/* Produits du groupe */}
                  {slotsInGroup.map((r, si) => (
                    <View key={si} style={{ flexDirection: 'row', padding: '3 10 3 20', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#faf5ff' }}>
                      <Text style={{ ...styles.tableCellSub, color: '#7c3aed' }}>
                        · {r.slot.productSearch || `Produit`} — {r.slot.quantity} pcs — {r.slot.flatWidth}×{r.slot.flatHeight} mm
                      </Text>
                      <Text style={{ ...styles.tableCellSub, textAlign: 'center' }}>
                        {r.impositionResult ? `${r.impositionResult.itemsPerPlate} poses/pl.` : '—'}
                      </Text>
                      <Text style={{ width: 80, textAlign: 'right', color: '#94a3b8', fontSize: 9 }}></Text>
                    </View>
                  ))}

                  {/* Coûts du groupe */}
                  {isImpression && (
                    <>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Matière</Text>
                        <Text style={{ ...styles.tableCell, color: '#64748b', textAlign: 'center' }}>
                          {groupResult.platesCount} plaque{groupResult.platesCount > 1 ? 's' : ''}
                        </Text>
                        <Text style={styles.tableCellRight}>{groupResult.materialCostMarged.toFixed(2)} €</Text>
                      </View>
                      <View style={styles.tableRowAlt}>
                        <Text style={styles.tableCell}>Impression</Text>
                        <Text style={{ ...styles.tableCell, color: '#64748b', textAlign: 'center' }}>
                          {Math.round(groupResult.machineTimeMin)} min
                        </Text>
                        <Text style={styles.tableCellRight}>{groupResult.printingCost.toFixed(2)} €</Text>
                      </View>
                    </>
                  )}
                  <View style={isImpression ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={styles.tableCell}>Découpe</Text>
                    <Text style={{ ...styles.tableCell, color: '#64748b', textAlign: 'center' }}>
                      {Math.round(groupResult.cuttingMachineTimeMin)} min
                      {groupResult.cuttingSetupCost > 0 ? ` + calage` : ''}
                    </Text>
                    <Text style={styles.tableCellRight}>
                      {(groupResult.cuttingMachineCost + groupResult.cuttingSetupCost).toFixed(2)} €
                    </Text>
                  </View>

                  <View style={styles.tableRowSubtotal}>
                    <Text style={{ ...styles.tableCell, fontFamily: 'Helvetica-Bold', color: '#059669' }}>
                      Sous-total {group.name}
                    </Text>
                    <Text style={{ ...styles.tableCell, textAlign: 'center' }}></Text>
                    <Text style={styles.tableCellRightGreen}>{groupResult.totalCost.toFixed(2)} €</Text>
                  </View>
                </View>
              )
            })}

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

          </View>
        </View>

        {/* ── Accessoires ── */}
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

        {/* ── Transport ── */}
        {costResult.transportTotal > 0 && formValues.transportDeliveries && formValues.transportDeliveries.length > 0 && formValues.transportDeliveries.some(d => d.mode) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transport</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Mode</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Département</Text>
                {!isClient && <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Qté</Text>}
                {!isClient && <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Poids</Text>}
                {!isClient && <Text style={styles.tableHeaderTextRight}>Options GEODIS</Text>}
              </View>
              {formValues.transportDeliveries.filter(d => d.mode).map((d, i) => (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {d.mode === 'PACK30' ? 'Pack 30' : d.mode === 'MESSAGERIE_PLUS' ? 'Messagerie+' : 'Affrètement'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{d.department ?? '—'}</Text>
                  {!isClient && (
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                      {d.units} {d.mode === 'AFFRETEMENT' ? 'pal.' : 'colis'}
                    </Text>
                  )}
                  {!isClient && (
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                      {d.mode !== 'AFFRETEMENT' && d.weightKg != null ? `${d.weightKg} kg` : '—'}
                    </Text>
                  )}
                  {!isClient && (
                    <Text style={styles.tableCellRight}>
                      {d.optionsHT ? `${d.optionsHT.toFixed(2)} €` : '—'}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Consommables (mode interne) ── */}
        {!isClient && hasFaconnage && selectedConsumables.length > 0 && (
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

        {/* ── Total HT (mode interne, après transport/consommables) ── */}
        {!isClient && (
          <View style={styles.tableFooter} wrap={false}>
            <Text style={styles.tableFooterLabel}>Total HT</Text>
            <View>
              <Text style={styles.tableFooterValue}>{displayTotal.toFixed(2)} €</Text>
              <Text style={{ ...styles.footerText, color: '#94a3b8', textAlign: 'right' }}>
                soit {(displayTotal / (displayQuantity || 1)).toFixed(2)} € / pce
              </Text>
            </View>
          </View>
        )}

        {/* ── Total HT + validité + signature (mode client, après transport/accessoires) ── */}
        {isClient && (
          <View wrap={false}>
            <View style={styles.totalBlock}>
              <View style={styles.totalBlockLeft}>
                <Text style={styles.totalBlockLabel}>Total HT</Text>
                <Text style={styles.totalBlockSubLabel}>Hors taxes — TVA non applicable</Text>
              </View>
              <View>
                <Text style={styles.totalBlockValue}>{displayTotal.toFixed(2)} €</Text>
                <Text style={styles.totalBlockPerUnit}>
                  soit {(displayTotal / (displayQuantity || 1)).toFixed(2)} € / pce
                </Text>
              </View>
            </View>

            <View style={styles.validityBlock}>
              <Text style={styles.validityText}>Devis valable 1 mois à compter de la date d'édition.</Text>
              <Text style={styles.salutationText}>Sincères salutations,</Text>
              <Text style={{ ...styles.salutationText, fontFamily: 'Helvetica-Bold' }}>Baptiste GRENTE</Text>
            </View>

            <View style={styles.signatureBox}>
              <Text style={styles.signatureIntro}>
                En acceptant le présent devis, le client accepte les CGV de Kontfeel sans exception ni réserve :
              </Text>
              <View style={styles.signatureGrid}>
                <View style={styles.signatureField}>
                  <Text style={styles.signatureFieldLabel}>Date :</Text>
                </View>
                <View style={styles.signatureField}>
                  <Text style={styles.signatureFieldLabel}>Bon pour accord :</Text>
                </View>
                <View style={styles.signatureField}>
                  <Text style={styles.signatureFieldLabel}>Signature :</Text>
                </View>
              </View>
              <Text style={styles.signatureNote}>
                Délai de fabrication : A convenir ensemble selon les éléments remis
              </Text>
              <Text style={styles.signatureNote}>
                Conditions de règlement : Particulières à la première commande
              </Text>
            </View>

            <Text style={styles.legalText}>
              SARL KONTFEEL au capital de 5000 EUROS — RCS Rouen 838 361 905 — TVA FR 818 383 619 05
            </Text>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {isClient
              ? `© ${new Date().getFullYear()} Kontfeel — Document confidentiel`
              : `© ${new Date().getFullYear()} Kontfeel — Usage interne, ne pas diffuser`}
          </Text>
          <Text style={styles.footerText}>Dossier : {studyNumber} — {date}</Text>
        </View>

      </Page>

      {/* ── Page 2 : CGV (mode client uniquement) ── */}
      {isClient && (
        <Page size="A4" style={styles.cgvPage}>
          <Text style={styles.cgvMainTitle}>CONDITIONS GENERALES DE VENTE</Text>
          <Text style={styles.cgvLegal}>
            SARL KONTFEEL au capital de 5000 EUROS — RCS Rouen 838 361 905 — TVA FR 818 383 619 05
          </Text>

          <View style={styles.cgvColumns}>
            <View style={styles.cgvColumn}>
              {CGV_SECTIONS.slice(0, 6).map((section, i) => (
                <View key={i} style={styles.cgvSection}>
                  <Text style={styles.cgvSectionTitle}>{section.title}</Text>
                  <Text style={styles.cgvText}>{section.text}</Text>
                </View>
              ))}
            </View>
            <View style={styles.cgvColumn}>
              {CGV_SECTIONS.slice(6).map((section, i) => (
                <View key={i} style={styles.cgvSection}>
                  <Text style={styles.cgvSectionTitle}>{section.title}</Text>
                  <Text style={styles.cgvText}>{section.text}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>© {new Date().getFullYear()} Kontfeel — CGV</Text>
            <Text style={styles.footerText}>Dossier : {studyNumber}</Text>
          </View>
        </Page>
      )}
    </Document>
  )
}
