import { getProductTypes } from '../../actions/get-data'
import ProductsClient from './products-client'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const products = await getProductTypes()

  return <ProductsClient initialProductTypes={products} />
}
