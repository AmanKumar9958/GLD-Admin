import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Users,
  BookOpen,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  Award,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { fetchDashboardStats } from '../services/courseService'
import { fetchTestDashboardStats } from '../services/testAdminService'
import { Spinner } from '../components/ui/spinner'
import { SendNotificationModal } from '../components/SendNotificationModal'

export const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ courses: 0, students: 0 })
  const [testStats, setTestStats] = useState({
    totalTests: 0,
    publishedTests: 0,
    totalAttempts: 0,
    totalQuestions: 0,
    recentAttempts: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        const [courseData, testData] = await Promise.all([
          fetchDashboardStats(),
          fetchTestDashboardStats(),
        ])
        setStats(courseData)
        setTestStats(testData)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">
            Welcome to GLD Admin. Monitor student mock test activity, question banks, and courses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/tests/new')}
            className="bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Create Mock Test</span>
          </Button>
          <SendNotificationModal />
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Mock Tests Card */}
        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-md">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">
                Mock Tests
              </span>
              <FileText className="h-5 w-5 text-blue-200" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            {loading ? (
              <Spinner className="text-white" />
            ) : (
              <p className="text-3xl font-extrabold">{testStats.totalTests}</p>
            )}
            <p className="mt-1 text-xs text-blue-100">
              {testStats.publishedTests} Active Live • {testStats.totalQuestions} Questions
            </p>
          </CardContent>
        </Card>

        {/* Student Exam Attempts Card */}
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none shadow-md">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
                Exam Attempts
              </span>
              <TrendingUp className="h-5 w-5 text-emerald-200" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            {loading ? (
              <Spinner className="text-white" />
            ) : (
              <p className="text-3xl font-extrabold">{testStats.totalAttempts}</p>
            )}
            <p className="mt-1 text-xs text-emerald-100">Completed test submissions</p>
          </CardContent>
        </Card>

        {/* Total Students Card */}
        <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white border-none shadow-md">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-100 uppercase tracking-wider">
                Registered Students
              </span>
              <Users className="h-5 w-5 text-rose-200" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            {loading ? (
              <Spinner className="text-white" />
            ) : (
              <p className="text-3xl font-extrabold">{stats.students}</p>
            )}
            <p className="mt-1 text-xs text-rose-100">Student accounts</p>
          </CardContent>
        </Card>

        {/* Courses Card */}
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none shadow-md">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-100 uppercase tracking-wider">
                Courses
              </span>
              <BookOpen className="h-5 w-5 text-amber-200" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            {loading ? (
              <Spinner className="text-white" />
            ) : (
              <p className="text-3xl font-extrabold">{stats.courses}</p>
            )}
            <p className="mt-1 text-xs text-amber-100">Video course packages</p>
          </CardContent>
        </Card>
      </div>

      {/* 2-Column Section: Recent Test Submissions + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Test Submissions (8 cols) */}
        <div className="lg:col-span-8">
          <Card className="border-gray-200 shadow-sm h-full flex flex-col justify-between">
            <div>
              <CardHeader className="p-5 pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-gray-900">
                    Recent Test Submissions
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">
                    Latest student attempts across all mock test series
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/tests')}
                  className="text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-1"
                >
                  <span>View All Tests</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 flex justify-center">
                    <Spinner className="text-gray-700" />
                  </div>
                ) : testStats.recentAttempts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-xs">
                    No student submissions yet. Once students take tests in the mobile app, their scores will stream here.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {testStats.recentAttempts.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-50/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">
                            {item.student_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {item.student_name}
                            </div>
                            <div className="text-xs text-gray-500 line-clamp-1">
                              {item.test_title}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              {item.score} <span className="text-xs text-gray-400">/{item.total_marks}</span>
                            </div>
                            <div className="text-[11px] font-medium text-emerald-600">
                              {item.accuracy}% Accuracy
                            </div>
                          </div>
                          <div className="text-[11px] text-gray-400 hidden sm:block">
                            {item.submitted_at
                              ? new Date(item.submitted_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </div>

            <div className="p-3 bg-gray-50/60 border-t border-gray-100 rounded-b-xl text-center">
              <button
                onClick={() => navigate('/tests')}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900"
              >
                Go to Tests Management ➔
              </button>
            </div>
          </Card>
        </div>

        {/* Right: Quick Launch & Test Creation Guide (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-purple-50/40">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <CardTitle className="text-sm font-bold text-indigo-950">
                  Quick Actions
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2">
              <Button
                variant="outline"
                onClick={() => navigate('/tests/new')}
                className="w-full justify-start text-xs font-semibold bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-900"
              >
                <Plus className="h-3.5 w-3.5 mr-2 text-indigo-600" />
                Create New Test Series
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/tests')}
                className="w-full justify-start text-xs font-semibold bg-white hover:bg-gray-50 border-gray-200 text-gray-800"
              >
                <FileText className="h-3.5 w-3.5 mr-2 text-gray-600" />
                Manage Existing Tests
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/courses')}
                className="w-full justify-start text-xs font-semibold bg-white hover:bg-gray-50 border-gray-200 text-gray-800"
              >
                <BookOpen className="h-3.5 w-3.5 mr-2 text-gray-600" />
                View Courses
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Mock Test Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2 text-xs text-gray-600">
              <p>• Group questions into sections (Reasoning, Quant, English) to let students switch sections easily.</p>
              <p>• Always provide a step-by-step explanation for each question—it appears in the student's solution view.</p>
              <p>• Use negative marking (e.g., -0.25 or -0.50) to replicate official SSC and Banking patterns.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
