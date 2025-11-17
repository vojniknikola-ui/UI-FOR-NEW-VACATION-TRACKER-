import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { validateVacationRequest, validateSickLeaveRequest, calculateBusinessDays } from '@/lib/business'
import { logAuditEvent } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId') || session.user.id
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Check permissions - users can only see their own requests, PMs/admins can see all
    const userRoles = (session.user as any).roles || []
    const canViewAllRequests = userRoles.includes('pm') || userRoles.includes('admin')

    if (userId !== session.user.id && !canViewAllRequests) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const where: any = { userId }
    if (status) {
      where.status = status
    }

    const requests = await prisma.vacationRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.vacationRequest.count({ where })

    return NextResponse.json({ requests, total })
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { startDate, endDate, reason, type = 'vacation' } = body

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Get user's current balance
    const balance = await prisma.userVacationBalance.findUnique({
      where: { userId: session.user.id }
    })

    if (!balance) {
      return NextResponse.json({ error: 'User balance not found' }, { status: 404 })
    }

    let validation
    let isAutoApproved = false
    if (type === 'sick-leave') {
      validation = validateSickLeaveRequest(start, end)
      isAutoApproved = true
    } else {
      validation = validateVacationRequest(start, end, balance.totalDays + balance.carriedOverDays - balance.usedDays - balance.pendingDays)
    }

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Create the request
    const vacationRequest = await prisma.vacationRequest.create({
      data: {
        userId: session.user.id,
        requestedDays: validation.requestedDays,
        startDate: start,
        endDate: end,
        reason,
        status: isAutoApproved ? 'approved' : 'pending'
      }
    })

    // Update balance
    if (isAutoApproved) {
      // For sick leave, directly add to used days (no approval needed)
      await prisma.userVacationBalance.update({
        where: { userId: session.user.id },
        data: {
          usedDays: balance.usedDays + validation.requestedDays
        }
      })
    } else {
      // For vacation, add to pending days
      await prisma.userVacationBalance.update({
        where: { userId: session.user.id },
        data: {
          pendingDays: balance.pendingDays + validation.requestedDays
        }
      })
    }

    // Log audit event
    await logAuditEvent(session.user.id, 'CREATE_REQUEST', `Created ${type} request for ${validation.requestedDays} days`)

    return NextResponse.json(vacationRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}