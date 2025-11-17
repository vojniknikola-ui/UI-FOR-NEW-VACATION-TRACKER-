import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/business'

export async function RecentRequests() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return <div>Loading...</div>
  }

  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/requests?limit=5`,
      {
        headers: {
          cookie: '', // This will be set by Next.js
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch requests')
    }

    const { requests } = await response.json()

    if (requests.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
            <CardDescription>Your recent vacation and sick leave requests</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No requests found.</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>Your recent vacation and sick leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request: any) => (
              <div key={request.id} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {request.requestedDays} days • {request.reason || 'No reason provided'}
                  </p>
                </div>
                <Badge
                  variant={
                    request.status === 'approved' ? 'default' :
                    request.status === 'rejected' ? 'destructive' :
                    'secondary'
                  }
                >
                  {request.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  } catch (error) {
    console.error('Error fetching recent requests:', error)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>Your recent vacation and sick leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load requests.</p>
        </CardContent>
      </Card>
    )
  }
}