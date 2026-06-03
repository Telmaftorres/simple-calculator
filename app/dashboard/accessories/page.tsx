import { auth } from '@/auth'
import { getAccessories } from '@/app/actions/accessories'
import AccessoriesClient from './AccessoriesClient'

export const dynamic = 'force-dynamic'

export default async function AccessoriesPage() {
  const session = await auth()
  const companyId = session?.user?.companyId ?? 0
  const accessories = await getAccessories(companyId)

  return <AccessoriesClient initialAccessories={accessories} />
}
