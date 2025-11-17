import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ReportsDashboard } from '@/components/admin/reports-dashboard'

export default async function ReportsPage() {
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
        <h1 className="text-3xl font-bold">Vacation Reports</h1>
        <p className="text-muted-foreground">
          View vacation usage statistics and reports.
        </p>
      </div>
      <ReportsDashboard />
    </div>
  )
}