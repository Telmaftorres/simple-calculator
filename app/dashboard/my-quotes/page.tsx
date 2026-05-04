import { getUserQuotes } from '@/app/actions/quotes'
import { getUsersForSharing } from '@/app/actions/user-actions'
import { requireAuth } from '@/lib/server/auth'
import { MyQuotesClient } from './MyQuotesClient'

export default async function MyQuotesPage() {
  const session = await requireAuth()
  const [quotes, users] = await Promise.all([getUserQuotes(), getUsersForSharing()])
  return <MyQuotesClient quotes={quotes} users={users} currentUserId={session.user.id} />
}
