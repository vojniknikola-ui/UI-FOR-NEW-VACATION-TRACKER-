import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { BalancesManagement } from '@/components/admin/balances-management'

export default async function BalancesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const userRoles = (session.user as any).roles || []
  const isAdmin = userRoles.includes('admin')

  if (!isAdmin) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Manage User Balances</h1>
        <p className="text-muted-foreground">
          Set, add, or remove vacation days for users.
        </p>
      </div>
      <BalancesManagement />
    </div>
  )
}