import { User, UserVacationBalance, TimeEntry, ActiveSession, VacationRequest, ServerSetting, AuditLog } from "@prisma/client"

export type { User, UserVacationBalance, TimeEntry, ActiveSession, VacationRequest, ServerSetting, AuditLog }

export interface UserWithRoles extends User {
  roles: string[]
}

export interface VacationRequestWithUser extends VacationRequest {
  user: User
}

export interface TimeEntryWithUser extends TimeEntry {
  user: User
}

export interface AuditLogWithUser extends AuditLog {
  user?: User
}

export interface VacationBalance {
  userId: string
  totalDays: number
  usedDays: number
  pendingDays: number
  carriedOverDays: number
  remainingDays: number
  lastUpdated: Date
}

export interface VacationReport {
  userId: string
  username: string
  totalDays: number
  usedDays: number
  pendingDays: number
  remainingDays: number
  requestsThisYear: number
  approvedRequests: number
  rejectedRequests: number
}

export interface TimeLogEntry {
  id: number
  userId: string
  entryType: string
  timestamp: Date
  location: string
  notes?: string
  username: string
}

export type RequestStatus = 'pending' | 'approved' | 'rejected'
export type UserRole = 'user' | 'pm' | 'admin'

export interface CreateVacationRequestData {
  startDate: Date
  endDate: Date
  reason?: string
}

export interface CreateSickLeaveRequestData {
  startDate: Date
  endDate: Date
  reason?: string
}

export interface ApproveRequestData {
  requestId: number
  approved: boolean
  reason?: string
}

export interface UpdateBalanceData {
  userId: string
  totalDays?: number
  usedDays?: number
  pendingDays?: number
  carriedOverDays?: number
}