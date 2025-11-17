import { addDays, differenceInBusinessDays, isWeekend, format, parseISO, isBefore, isAfter } from 'date-fns'

export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  return differenceInBusinessDays(endDate, startDate) + 1
}

export function validateVacationRequest(startDate: Date, endDate: Date, balance: number): {
  isValid: boolean
  error?: string
  requestedDays: number
} {
  const now = new Date()
  const requestedDays = calculateBusinessDays(startDate, endDate)

  // Check if start date is in the future
  if (isBefore(startDate, now)) {
    return { isValid: false, error: 'Start date must be in the future', requestedDays }
  }

  // Check if end date is after start date
  if (isBefore(endDate, startDate)) {
    return { isValid: false, error: 'End date must be after start date', requestedDays }
  }

  // Check if requested days exceed balance
  if (requestedDays > balance) {
    return { isValid: false, error: `Requested ${requestedDays} days exceeds available balance of ${balance} days`, requestedDays }
  }

  // Check minimum notice period (2 weeks)
  const twoWeeksFromNow = addDays(now, 14)
  if (isBefore(startDate, twoWeeksFromNow)) {
    return { isValid: false, error: 'Vacation requests must be submitted at least 2 weeks in advance', requestedDays }
  }

  return { isValid: true, requestedDays }
}

export function validateSickLeaveRequest(startDate: Date, endDate: Date): {
  isValid: boolean
  error?: string
  requestedDays: number
} {
  const now = new Date()
  const requestedDays = calculateBusinessDays(startDate, endDate)

  // Check if start date is not too far in the past (max 3 days)
  const threeDaysAgo = addDays(now, -3)
  if (isBefore(startDate, threeDaysAgo)) {
    return { isValid: false, error: 'Sick leave requests cannot be submitted more than 3 days after the start date', requestedDays }
  }

  // Check if end date is after start date
  if (isBefore(endDate, startDate)) {
    return { isValid: false, error: 'End date must be after start date', requestedDays }
  }

  // Check maximum sick leave period (30 days)
  if (requestedDays > 30) {
    return { isValid: false, error: 'Sick leave cannot exceed 30 days', requestedDays }
  }

  return { isValid: true, requestedDays }
}

export function checkBalanceSufficiency(requestedDays: number, currentBalance: {
  totalDays: number
  usedDays: number
  pendingDays: number
  carriedOverDays: number
}): boolean {
  const availableDays = currentBalance.totalDays + currentBalance.carriedOverDays - currentBalance.usedDays - currentBalance.pendingDays
  return requestedDays <= availableDays
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MMM dd, yyyy')
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MMM dd, yyyy HH:mm')
}

export function isHoliday(date: Date): boolean {
  // Simple holiday check - in a real app, this would check against a holiday database
  // For now, just return false
  return false
}

export function calculateWorkingHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  return (endMinutes - startMinutes) / 60
}

export function getCurrentYear(): number {
  return new Date().getFullYear()
}

export function getVacationYearStart(): Date {
  const now = new Date()
  // Assuming vacation year starts on January 1st
  return new Date(now.getFullYear(), 0, 1)
}

export function getVacationYearEnd(): Date {
  const now = new Date()
  // Assuming vacation year ends on December 31st
  return new Date(now.getFullYear(), 11, 31)
}