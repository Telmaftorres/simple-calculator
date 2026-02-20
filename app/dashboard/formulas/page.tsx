import { getProductTypes } from '../../actions/get-data'
import FormulasClient from './formulas-client'

export const dynamic = 'force-dynamic'

export default async function FormulasPage() {
  const products = await getProductTypes()

  return <FormulasClient initialProductTypes={products} />
}
