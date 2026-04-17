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
    prisma.productType.findUnique({ where: { id: productTypeId } }),
    prisma.productTemplate.findUnique({
      where: { id: templateId },
      include: {
        accessories: {
          include: { accessory: { select: { id: true, name: true, price: true } } },
        },
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
      initialData={{
        id: template.id,
        name: template.name,
        flatWidth: template.flatWidth,
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
        hasTransport: template.hasTransport,
        defaultTransportMode: template.defaultTransportMode as 'PACK30' | 'MESSAGERIE_PLUS' | 'AFFRETEMENT' | null,
        notes: template.notes ?? '',
      }}
      initialAccessories={template.accessories.map((a) => ({
        accessoryId: a.accessoryId,
        name: a.accessory.name,
        price: a.accessory.price,
        quantity: a.quantity,
      }))}
    />
  )
}
