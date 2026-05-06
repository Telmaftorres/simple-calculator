import { prisma } from '@/lib/server/prisma'
import { notFound } from 'next/navigation'
import TemplateForm from '../../TemplateForm'

interface PageProps {
  params: Promise<{ id: string; tid: string }>
}

export const dynamic = 'force-dynamic'

export default async function EditTemplatePage({ params }: PageProps) {
  const { id, tid } = await params
  const productTypeId = parseInt(id)
  const templateId = parseInt(tid)
  if (isNaN(productTypeId) || isNaN(templateId)) return notFound()

  const [productType, template, plates, allAccessories] = await Promise.all([
    prisma.productType.findUnique({
      where: { id: productTypeId },
      include: {
        elements: { orderBy: { name: 'asc' } },
        options: {
          orderBy: { position: 'asc' },
          include: { variants: { orderBy: { position: 'asc' } } },
        },
      },
    }),
    prisma.productTemplate.findUnique({
      where: { id: templateId },
      include: {
        accessories: {
          include: { accessory: { select: { id: true, name: true, price: true } } },
        },
        amalgameRuns: {
          orderBy: { position: 'asc' },
          include: { items: true },
        },
        templateElements: true,
        templateVariants: true,
        templateOptionConfigs: true,
      },
    }),
    prisma.plate.findMany({ orderBy: { name: 'asc' } }),
    prisma.accessory.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, price: true } }),
  ])

  if (!productType || !template) return notFound()

  return (
    <TemplateForm
      productTypeId={productTypeId}
      productTypeName={productType.name}
      plates={plates}
      allAccessories={allAccessories}
      flatWidthFormula={productType.flatWidthFormula}
      flatHeightFormula={productType.flatHeightFormula}
      initialData={{
        id: template.id,
        name: template.name,
        formatType: (template.formatType as '2d' | '3d') ?? '2d',
        flatWidth: template.flatWidth,
        flatDepth: template.flatDepth,
        flatHeight: template.flatHeight,
        plateId: template.plateId,
        hasImpression: template.hasImpression,
        printMode: template.printMode as 'production' | 'quality',
        printSetupType: template.printSetupType as 'none' | 'standard' | 'complexe',
        isRectoVerso: template.isRectoVerso,
        rectoVersoType: template.rectoVersoType as 'identical' | 'different' | null,
        hasVarnish: template.hasVarnish,
        hasFlatColor: template.hasFlatColor,
        inkMlPerPlate: template.inkMlPerPlate,
        inkMlVerso: template.inkMlVerso,
        varnishSurfacePercent: template.varnishSurfacePercent,
        flatColorSurfacePercent: template.flatColorSurfacePercent,
        cuttingTimePerPoseSeconds: template.cuttingTimePerPoseSeconds,
        cuttingSetupType: template.cuttingSetupType as 'none' | 'standard' | 'complexe',
        hasFaconnage: template.hasFaconnage,
        assemblyTimePerPieceSeconds: template.assemblyTimePerPieceSeconds,
        hasConditionnement: template.hasConditionnement,
        packTimePerPieceSeconds: template.packTimePerPieceSeconds,
        hasAssemblyNotice: template.hasAssemblyNotice,
        hasAccessoires: template.hasAccessoires,
        notes: template.notes ?? '',
      }}
      typeElements={productType.elements}
      typeOptions={productType.options}
      initialElements={template.templateElements.map((e) => ({
        elementId: e.elementId,
        quantity: e.quantity,
        flatWidth: e.flatWidth ?? null,
        flatHeight: e.flatHeight ?? null,
        flatDepth: e.flatDepth ?? null,
        plateId: e.plateId ?? null,
        amalgameGroupId: e.amalgameGroupId ?? null,
        hasImpression: e.hasImpression,
        printMode: e.printMode as 'production' | 'quality',
        printSetupType: e.printSetupType as 'none' | 'standard' | 'complexe',
        isRectoVerso: e.isRectoVerso,
        rectoVersoType: e.rectoVersoType as 'identical' | 'different' | null,
        hasVarnish: e.hasVarnish,
        hasFlatColor: e.hasFlatColor,
        inkMlPerPlate: e.inkMlPerPlate,
        inkMlVerso: e.inkMlVerso,
        varnishSurfacePercent: e.varnishSurfacePercent,
        flatColorSurfacePercent: e.flatColorSurfacePercent,
        cuttingTimePerPoseSeconds: e.cuttingTimePerPoseSeconds,
        cuttingSetupType: e.cuttingSetupType as 'none' | 'standard' | 'complexe',
      }))}
      initialVariantConfigs={template.templateVariants.map((v) => ({ variantId: v.variantId, defaultQuantity: v.defaultQuantity }))}
      initialOptionConfigs={template.templateOptionConfigs.map((o) => ({ optionId: o.optionId, defaultQuantity: o.defaultQuantity }))}
      initialAccessories={template.accessories.map((a) => ({
        accessoryId: a.accessoryId,
        name: a.accessory.name,
        price: a.accessory.price,
        quantity: a.quantity,
      }))}
      initialAmalgameGroupsJson={template.amalgameGroupsJson}
    />
  )
}
