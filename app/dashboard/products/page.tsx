import { auth } from '@/auth'
import { getProductTypes } from '../../actions/reference-data'
import ProductsClient from './ProductsClient'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const session = await auth()
  const companyId = session?.user?.companyId ?? 0
  const products = await getProductTypes(companyId)

  return <ProductsClient initialProductTypes={products} />
}
