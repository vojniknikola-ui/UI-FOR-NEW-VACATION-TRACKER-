import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { SickLeaveRequestForm } from '@/components/requests/sick-leave-request-form'

export default async function SickLeaveRequestPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Request Sick Leave</h1>
          <p className="text-muted-foreground">
            Submit a sick leave request. Sick leave requests are auto-approved.
          </p>
        </div>
        <SickLeaveRequestForm />
      </div>
    </div>
  )
}