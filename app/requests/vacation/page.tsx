import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { VacationRequestForm } from '@/components/requests/vacation-request-form'

export default async function VacationRequestPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Request Vacation</h1>
          <p className="text-muted-foreground">
            Submit a new vacation request for approval.
          </p>
        </div>
        <VacationRequestForm />
      </div>
    </div>
  )
}