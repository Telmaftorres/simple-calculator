import { prisma } from '@/lib/prisma'
import ElementsClient from './elements-client'
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
    include: { elements: true },
  })

  if (!product) return notFound()

  return <ElementsClient product={product} />
}
