import { prisma } from './db'

export async function logAuditEvent(
  userId: string | null,
  action: string,
  details?: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress,
        userAgent
      }
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
    // Don't throw error to avoid breaking the main flow
  }
}