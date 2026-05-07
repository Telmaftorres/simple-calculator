import { prisma } from '@/lib/server/prisma'
import { notFound } from 'next/navigation'
import TemplateForm from '../TemplateForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function NewTemplatePage({ params }: PageProps) {
  const { id } = await params
  const productTypeId = parseInt(id)
  if (isNaN(productTypeId)) return notFound()

  const [productType, plates, allAccessories] = await Promise.all([
    prisma.productType.findUnique({
      where: { id: productTypeId },
      include: {
        elements: { orderBy: { name: 'asc' } },
      },
    }),
    prisma.plate.findMany({ orderBy: { name: 'asc' } }),
    prisma.accessory.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, price: true } }),
  ])

  if (!productType) return notFound()

  return (
    <TemplateForm
      productTypeId={productTypeId}
      productTypeName={productType.name}
      plates={plates}
      allAccessories={allAccessories}
      typeElements={productType.elements}
flatWidthFormula={productType.flatWidthFormula}
      flatHeightFormula={productType.flatHeightFormula}
    />
  )
}
