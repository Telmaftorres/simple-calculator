import { auth } from '@/auth'
import { getConsumables } from '@/app/actions/consumables'
import ConsumablesClient from './ConsumablesClient'

export const metadata = {
  title: 'Consommables | Admin',
}

export default async function ConsumablesPage() {
  const session = await auth()
  const companyId = session?.user?.companyId ?? 0
  const consumables = await getConsumables(companyId)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <ConsumablesClient initialConsumables={consumables} />
    </div>
  )
}
