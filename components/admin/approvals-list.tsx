"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { VacationRequestWithUser } from '@/types'

interface ApprovalsListProps {
  userRoles: string[]
}

export function ApprovalsList({ userRoles }: ApprovalsListProps) {
  const [requests, setRequests] = useState<VacationRequestWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<number | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/requests?status=pending')
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (requestId: number, approved: boolean, reason?: string) => {
    setProcessing(requestId)
    try {
      const response = await fetch(`/api/requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved, reason }),
      })

      if (response.ok) {
        toast.success(`Request ${approved ? 'approved' : 'rejected'} successfully`)
        // Remove from local state
        setRequests(requests.filter(r => r.id !== requestId))
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      console.error('Error processing approval:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process request')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading requests...</div>
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Clock className="mx-auto h-12 w-12 mb-4" />
            <p>No pending requests to review</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={request.user.avatar || ''} />
                  <AvatarFallback>
                    {request.user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{request.user.username}</CardTitle>
                  <CardDescription>
                    {format(new Date(request.startDate), 'MMM dd, yyyy')} - {format(new Date(request.endDate), 'MMM dd, yyyy')}
                    ({request.requestedDays} days)
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {request.reason && (
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Reason:</strong> {request.reason}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => handleApproval(request.id, true)}
                disabled={processing === request.id}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </Button>
              <Button
                onClick={() => handleApproval(request.id, false)}
                disabled={processing === request.id}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Deny
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}