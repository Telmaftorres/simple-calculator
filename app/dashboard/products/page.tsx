import { getProductTypes } from '../../actions/reference-data'
import ProductsClient from './ProductsClient'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const products = await getProductTypes()

  return <ProductsClient initialProductTypes={products} />
}
