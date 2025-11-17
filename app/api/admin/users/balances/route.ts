import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRoles = (session.user as any).roles || []
    const isAdmin = userRoles.includes('admin')

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get all users with their balances
    const balances = await prisma.userVacationBalance.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatar: true
          }
        }
      }
    })

    // Calculate remaining days for each balance
    const balancesWithRemaining = balances.map(balance => ({
      ...balance,
      remainingDays: balance.totalDays + balance.carriedOverDays - balance.usedDays - balance.pendingDays
    }))

    return NextResponse.json({ balances: balancesWithRemaining })
  } catch (error) {
    console.error('Error fetching user balances:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}