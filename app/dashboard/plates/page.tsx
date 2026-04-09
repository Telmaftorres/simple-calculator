import { getPlates } from '../../actions/reference-data'
import PlatesClient from './PlatesClient'

export const dynamic = 'force-dynamic'

export default async function PlatesPage() {
  const plates = await getPlates()

  return <PlatesClient initialPlates={plates} />
}
