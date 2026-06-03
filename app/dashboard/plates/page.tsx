import { auth } from '@/auth'
import { getPlates } from '../../actions/reference-data'
import PlatesClient from './PlatesClient'

export const dynamic = 'force-dynamic'

export default async function PlatesPage() {
  const session = await auth()
  const companyId = session?.user?.companyId ?? 0
  const plates = await getPlates(companyId)

  return <PlatesClient initialPlates={plates} />
}
