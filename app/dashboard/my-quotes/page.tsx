import { getUserQuotes } from '@/app/actions/get-data'
import { MyQuotesClient } from './MyQuotesClient'

export default async function MyQuotesPage() {
  const quotes = await getUserQuotes()
  return <MyQuotesClient quotes={quotes} />
}