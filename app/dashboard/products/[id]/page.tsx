import { prisma } from '@/lib/server/prisma'
import ElementsClient from './ElementsClient'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function ProductElementsPage({ params }: PageProps) {
  const { id } = await params
  const productId = parseInt(id)

  if (isNaN(productId)) return notFound()

  const product = await prisma.productType.findUnique({
    where: { id: productId },
    include: {
      elements: true,
      templates: {
        include: { plate: { select: { id: true, name: true, material: true } } },
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!product) return notFound()

  return <ElementsClient product={product} />
}
