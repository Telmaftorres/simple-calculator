import { getAccessories } from '@/app/actions/accessories'
import AccessoriesClient from './accessories-client'

export const dynamic = 'force-dynamic'

export default async function AccessoriesPage() {
  const accessories = await getAccessories()

  return <AccessoriesClient initialAccessories={accessories} />
}
