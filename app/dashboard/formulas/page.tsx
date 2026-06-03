import { auth } from '@/auth'
import { getProductTypes } from '../../actions/reference-data'
import FormulasClient from './FormulasClient'

export const dynamic = 'force-dynamic'

export default async function FormulasPage() {
  const session = await auth()
  const companyId = session?.user?.companyId ?? 0
  const products = await getProductTypes(companyId)

  return <FormulasClient initialProductTypes={products} />
}
