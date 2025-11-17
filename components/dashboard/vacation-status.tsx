import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function VacationStatus() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return <div>Loading...</div>
  }

  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/balances?userId=${session.user.id}`,
      {
        headers: {
          cookie: '', // This will be set by Next.js
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch balance')
    }

    const balance = await response.json()

    return (
      <div className="space-y-2">
        <div className="text-2xl font-bold">{balance.remainingDays || 0}</div>
        <p className="text-xs text-muted-foreground">
          of {balance.totalDays || 25} days remaining
        </p>
        <div className="text-xs text-muted-foreground">
          Used: {balance.usedDays || 0} | Pending: {balance.pendingDays || 0}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error fetching vacation balance:', error)
    return (
      <div className="space-y-2">
        <div className="text-2xl font-bold">--</div>
        <p className="text-xs text-muted-foreground">
          Unable to load balance
        </p>
      </div>
    )
  }
}