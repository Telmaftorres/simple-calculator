import { getConsumables } from '@/app/actions/consumables'
import ConsumablesClient from './consumables-client'

export const metadata = {
  title: 'Consommables | Admin',
}

export default async function ConsumablesPage() {
  const consumables = await getConsumables()

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <ConsumablesClient initialConsumables={consumables} />
    </div>
  )
}
