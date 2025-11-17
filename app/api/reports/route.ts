import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { VacationReport } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRoles = (session.user as any).roles || []
    const isPM = userRoles.includes('pm')
    const isAdmin = userRoles.includes('admin')

    if (!isPM && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden - PM or Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Get all users with their balances and request counts
    const users = await prisma.user.findMany({
      include: {
        vacationBalance: true,
        vacationRequests: {
          where: {
            createdAt: {
              gte: new Date(year, 0, 1),
              lt: new Date(year + 1, 0, 1)
            }
          }
        }
      }
    })

    const reports: VacationReport[] = users.map(user => {
      const balance = user.vacationBalance
      const requests = user.vacationRequests

      const approvedRequests = requests.filter(r => r.status === 'approved').length
      const rejectedRequests = requests.filter(r => r.status === 'rejected').length

      return {
        userId: user.id,
        username: user.username,
        totalDays: balance?.totalDays || 25,
        usedDays: balance?.usedDays || 0,
        pendingDays: balance?.pendingDays || 0,
        remainingDays: (balance?.totalDays || 25) + (balance?.carriedOverDays || 0) - (balance?.usedDays || 0) - (balance?.pendingDays || 0),
        requestsThisYear: requests.length,
        approvedRequests,
        rejectedRequests
      }
    })

    return NextResponse.json({ reports, year })
  } catch (error) {
    console.error('Error generating reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}