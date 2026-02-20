import { getPlates } from '../../actions/get-data'
import PlatesClient from './plates-client'

export const dynamic = 'force-dynamic'

export default async function PlatesPage() {
  const plates = await getPlates()

  return <PlatesClient initialPlates={plates} />
}
