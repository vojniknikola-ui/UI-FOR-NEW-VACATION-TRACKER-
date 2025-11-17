import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ApprovalsList } from '@/components/admin/approvals-list'

export default async function ApprovalsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const userRoles = (session.user as any).roles || []
  const isPM = userRoles.includes('pm')
  const isAdmin = userRoles.includes('admin')

  if (!isPM && !isAdmin) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Request Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve or deny pending vacation requests.
        </p>
      </div>
      <ApprovalsList userRoles={userRoles} />
    </div>
  )
}