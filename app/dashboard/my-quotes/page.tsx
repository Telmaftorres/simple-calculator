import { getUserQuotes, getAllQuotes } from '@/app/actions/quotes'
import { getUsersForSharing } from '@/app/actions/user-actions'
import { requireAuth } from '@/lib/server/auth'
import { MyQuotesClient } from './MyQuotesClient'

export default async function MyQuotesPage() {
  const session = await requireAuth()
  const [myQuotes, allQuotes, users] = await Promise.all([
    getUserQuotes(),
    getAllQuotes(),
    getUsersForSharing(),
  ])
  return <MyQuotesClient quotes={myQuotes} allQuotes={allQuotes} users={users} currentUserId={session.user.id} />
}
