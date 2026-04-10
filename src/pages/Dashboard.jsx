import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { fetchDashboardStats } from '../services/courseService'
import { Spinner } from '../components/ui/spinner'

export const Dashboard = () => {
  const [stats, setStats] = useState({ courses: 0, students: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchDashboardStats()
        setStats(data)
      } catch (err) {
        console.error('Failed to load stats:', err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none shadow-indigo-100">
        <CardHeader>
          <CardTitle>Total Courses</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Spinner className="text-white" /> : (
            <p className="text-4xl font-bold">{stats.courses}</p>
          )}
          <p className="mt-2 text-sm text-indigo-100 italic">Active and Draft Courses</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white border-none shadow-rose-100">
        <CardHeader>
          <CardTitle>Total Students</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Spinner className="text-white" /> : (
            <p className="text-4xl font-bold">{stats.students}</p>
          )}
          <p className="mt-2 text-sm text-rose-100 italic">Registered Profiles</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• Create and publish courses from the Courses section.</p>
          <p>• Add modules and upload videos inside each course.</p>
          <p>• Keep student data up to date from the Students tab.</p>
        </CardContent>
      </Card>
    </div>
  )
}

