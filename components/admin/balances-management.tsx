"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Edit, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface UserBalance {
  userId: string
  user: {
    id: string
    username: string
    discriminator: string
    avatar: string
  }
  totalDays: number
  usedDays: number
  pendingDays: number
  carriedOverDays: number
  remainingDays: number
  lastUpdated: string
}

export function BalancesManagement() {
  const [balances, setBalances] = useState<UserBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<UserBalance>>({})

  useEffect(() => {
    fetchBalances()
  }, [])

  const fetchBalances = async () => {
    try {
      // For admin, we need to get all users' balances
      const response = await fetch('/api/admin/users/balances')
      if (response.ok) {
        const data = await response.json()
        setBalances(data.balances)
      }
    } catch (error) {
      console.error('Error fetching balances:', error)
      toast.error('Failed to load balances')
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (balance: UserBalance) => {
    setEditing(balance.userId)
    setEditValues({
      totalDays: balance.totalDays,
      usedDays: balance.usedDays,
      pendingDays: balance.pendingDays,
      carriedOverDays: balance.carriedOverDays
    })
  }

  const cancelEditing = () => {
    setEditing(null)
    setEditValues({})
  }

  const saveBalance = async (userId: string) => {
    try {
      const response = await fetch('/api/balances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...editValues
        }),
      })

      if (response.ok) {
        toast.success('Balance updated successfully')
        setEditing(null)
        setEditValues({})
        fetchBalances() // Refresh the list
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      console.error('Error updating balance:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update balance')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading balances...</div>
  }

  return (
    <div className="space-y-4">
      {balances.map((balance) => (
        <Card key={balance.userId}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={balance.user.avatar || ''} />
                  <AvatarFallback>
                    {balance.user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{balance.user.username}</CardTitle>
                  <CardDescription>
                    Last updated: {new Date(balance.lastUpdated).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
              {editing === balance.userId ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveBalance(balance.userId)}>
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => startEditing(balance)}>
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Total Days</Label>
                {editing === balance.userId ? (
                  <Input
                    type="number"
                    value={editValues.totalDays || 0}
                    onChange={(e) => setEditValues({ ...editValues, totalDays: parseInt(e.target.value) || 0 })}
                  />
                ) : (
                  <Badge variant="secondary">{balance.totalDays}</Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label>Used Days</Label>
                {editing === balance.userId ? (
                  <Input
                    type="number"
                    value={editValues.usedDays || 0}
                    onChange={(e) => setEditValues({ ...editValues, usedDays: parseInt(e.target.value) || 0 })}
                  />
                ) : (
                  <Badge variant="destructive">{balance.usedDays}</Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label>Pending Days</Label>
                {editing === balance.userId ? (
                  <Input
                    type="number"
                    value={editValues.pendingDays || 0}
                    onChange={(e) => setEditValues({ ...editValues, pendingDays: parseInt(e.target.value) || 0 })}
                  />
                ) : (
                  <Badge variant="outline">{balance.pendingDays}</Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label>Carried Over</Label>
                {editing === balance.userId ? (
                  <Input
                    type="number"
                    value={editValues.carriedOverDays || 0}
                    onChange={(e) => setEditValues({ ...editValues, carriedOverDays: parseInt(e.target.value) || 0 })}
                  />
                ) : (
                  <Badge variant="secondary">{balance.carriedOverDays}</Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label>Remaining</Label>
                <Badge variant="default">{balance.remainingDays}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}