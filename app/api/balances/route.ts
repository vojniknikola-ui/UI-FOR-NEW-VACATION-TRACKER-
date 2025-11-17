import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAuditEvent } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id

    // Check permissions
    const userRoles = (session.user as any).roles || []
    const canViewAllBalances = userRoles.includes('pm') || userRoles.includes('admin')

    if (userId !== session.user.id && !canViewAllBalances) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const balance = await prisma.userVacationBalance.findUnique({
      where: { userId },
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

    if (!balance) {
      // Create default balance if it doesn't exist
      const newBalance = await prisma.userVacationBalance.create({
        data: { userId },
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
      return NextResponse.json(newBalance)
    }

    // Calculate remaining days
    const remainingDays = balance.totalDays + balance.carriedOverDays - balance.usedDays - balance.pendingDays

    return NextResponse.json({
      ...balance,
      remainingDays
    })
  } catch (error) {
    console.error('Error fetching balance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { userId, totalDays, usedDays, pendingDays, carriedOverDays } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const balance = await prisma.userVacationBalance.upsert({
      where: { userId },
      update: {
        totalDays: totalDays !== undefined ? totalDays : undefined,
        usedDays: usedDays !== undefined ? usedDays : undefined,
        pendingDays: pendingDays !== undefined ? pendingDays : undefined,
        carriedOverDays: carriedOverDays !== undefined ? carriedOverDays : undefined,
        lastUpdated: new Date()
      },
      create: {
        userId,
        totalDays: totalDays || 25,
        usedDays: usedDays || 0,
        pendingDays: pendingDays || 0,
        carriedOverDays: carriedOverDays || 0
      },
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

    // Log audit event
    await logAuditEvent(
      session.user.id,
      'UPDATE_BALANCE',
      `Updated balance for user ${balance.user?.username || userId}`
    )

    return NextResponse.json(balance)
  } catch (error) {
    console.error('Error updating balance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}