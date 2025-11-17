import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface QuickActionsProps {
  userRoles: string[]
}

export function QuickActions({ userRoles }: QuickActionsProps) {
  const isPM = userRoles.includes('pm')
  const isAdmin = userRoles.includes('admin')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button asChild className="h-auto p-4 flex-col gap-2">
            <Link href="/requests/vacation">
              <Plus className="h-6 w-6" />
              <span>Request Vacation</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
            <Link href="/requests/sick-leave">
              <FileText className="h-6 w-6" />
              <span>Request Sick Leave</span>
            </Link>
          </Button>

          {(isPM || isAdmin) && (
            <>
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                <Link href="/approvals">
                  <Users className="h-6 w-6" />
                  <span>Review Requests</span>
                </Link>
              </Button>

              {isAdmin && (
                <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                  <Link href="/admin/reports">
                    <BarChart3 className="h-6 w-6" />
                    <span>View Reports</span>
                  </Link>
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}