import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/business'

export async function TimeLog() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return <div>Loading...</div>
  }

  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/time-entries?limit=10`,
      {
        headers: {
          cookie: '', // This will be set by Next.js
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch time entries')
    }

    const { entries } = await response.json()

    if (entries.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Time Log</CardTitle>
            <CardDescription>Your recent time entries</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No time entries found.</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Time Log</CardTitle>
          <CardDescription>Your recent time entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entries.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {entry.entryType}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(entry.timestamp)} • {entry.location}
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground">
                      {entry.notes}
                    </p>
                  )}
                </div>
                <Badge variant="outline">
                  {entry.entryType}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  } catch (error) {
    console.error('Error fetching time log:', error)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time Log</CardTitle>
          <CardDescription>Your recent time entries</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load time entries.</p>
        </CardContent>
      </Card>
    )
  }
}