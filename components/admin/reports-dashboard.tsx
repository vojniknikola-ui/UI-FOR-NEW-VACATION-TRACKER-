"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { VacationReport } from '@/types'
import { toast } from 'sonner'

interface ReportsData {
  reports: VacationReport[]
  year: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function ReportsDashboard() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchReports()
  }, [selectedYear])

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/reports?year=${selectedYear}`)
      if (response.ok) {
        const reportsData = await response.json()
        setData(reportsData)
      } else {
        throw new Error('Failed to fetch reports')
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading reports...</div>
  }

  if (!data) {
    return <div className="text-center py-8">No data available</div>
  }

  const { reports } = data

  // Calculate summary statistics
  const totalUsers = reports.length
  const totalDaysAllocated = reports.reduce((sum, r) => sum + r.totalDays, 0)
  const totalDaysUsed = reports.reduce((sum, r) => sum + r.usedDays, 0)
  const totalDaysPending = reports.reduce((sum, r) => sum + r.pendingDays, 0)
  const totalRequests = reports.reduce((sum, r) => sum + r.requestsThisYear, 0)
  const totalApproved = reports.reduce((sum, r) => sum + r.approvedRequests, 0)
  const totalRejected = reports.reduce((sum, r) => sum + r.rejectedRequests, 0)

  // Data for charts
  const usageData = reports.map(r => ({
    name: r.username,
    used: r.usedDays,
    remaining: r.remainingDays,
    pending: r.pendingDays
  }))

  const requestStatusData = [
    { name: 'Approved', value: totalApproved, color: '#00C49F' },
    { name: 'Rejected', value: totalRejected, color: '#FF8042' },
    { name: 'Pending', value: totalRequests - totalApproved - totalRejected, color: '#FFBB28' }
  ]

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Reports for {selectedYear}</h2>
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Days Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDaysAllocated}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Days Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDaysUsed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vacation Usage by User</CardTitle>
            <CardDescription>Days used, remaining, and pending per user</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="used" stackId="a" fill="#FF8042" />
                <Bar dataKey="remaining" stackId="a" fill="#00C49F" />
                <Bar dataKey="pending" stackId="a" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Status Distribution</CardTitle>
            <CardDescription>Breakdown of approved, rejected, and pending requests</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={requestStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {requestStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed User Reports</CardTitle>
          <CardDescription>Complete breakdown of vacation data for all users</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Total Days</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Rejected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.userId}>
                  <TableCell className="font-medium">{report.username}</TableCell>
                  <TableCell>{report.totalDays}</TableCell>
                  <TableCell>{report.usedDays}</TableCell>
                  <TableCell>{report.pendingDays}</TableCell>
                  <TableCell>{report.remainingDays}</TableCell>
                  <TableCell>{report.requestsThisYear}</TableCell>
                  <TableCell>
                    <Badge variant="default">{report.approvedRequests}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">{report.rejectedRequests}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}