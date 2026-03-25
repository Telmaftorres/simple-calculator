import { getUsers } from '@/app/actions/user-actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { UserManagement } from './user-management'
import { ModeToggle } from '@/components/mode-toggle'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const users = await getUsers()

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
        </div>
        <ModeToggle />
      </div>

      <UserManagement users={users} />
    </div>
  )
}
