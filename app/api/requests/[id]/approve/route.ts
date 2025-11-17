import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAuditEvent } from '@/lib/audit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const requestId = parseInt(id)
    if (isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 })
    }

    const body = await request.json()
    const { approved, reason } = body

    if (typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'Approved status is required' }, { status: 400 })
    }

    // Get the vacation request
    const vacationRequest = await prisma.vacationRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    })

    if (!vacationRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (vacationRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request has already been processed' }, { status: 400 })
    }

    const now = new Date()

    // Update the request
    const updatedRequest = await prisma.vacationRequest.update({
      where: { id: requestId },
      data: {
        status: approved ? 'approved' : 'rejected',
        [isAdmin ? 'adminApprovedBy' : 'pmApprovedBy']: session.user.id,
        [isAdmin ? 'adminApprovedAt' : 'pmApprovedAt']: now,
        rejectedBy: approved ? null : session.user.id,
        rejectedAt: approved ? null : now,
        rejectionReason: approved ? null : reason
      }
    })

    // Update user's balance
    const balance = await prisma.userVacationBalance.findUnique({
      where: { userId: vacationRequest.userId }
    })

    if (balance) {
      if (approved) {
        // Move from pending to used
        await prisma.userVacationBalance.update({
          where: { userId: vacationRequest.userId },
          data: {
            pendingDays: balance.pendingDays - vacationRequest.requestedDays,
            usedDays: balance.usedDays + vacationRequest.requestedDays
          }
        })
      } else {
        // Remove from pending
        await prisma.userVacationBalance.update({
          where: { userId: vacationRequest.userId },
          data: {
            pendingDays: balance.pendingDays - vacationRequest.requestedDays
          }
        })
      }
    }

    // Log audit event
    await logAuditEvent(
      session.user.id,
      approved ? 'APPROVE_REQUEST' : 'REJECT_REQUEST',
      `${approved ? 'Approved' : 'Rejected'} request ${requestId} for user ${vacationRequest.user.username}`
    )

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Error processing request approval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}