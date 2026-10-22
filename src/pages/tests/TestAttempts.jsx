import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  Trophy,
  Award,
  Clock,
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Spinner } from '../../components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  fetchTestWithQuestions,
  fetchTestAttempts,
} from '../../services/testAdminService'

export const TestAttempts = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const [test, setTest] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadData() {
      if (!id) return
      try {
        setIsLoading(true)
        const [testData, attemptsData] = await Promise.all([
          fetchTestWithQuestions(id),
          fetchTestAttempts(id),
        ])
        setTest(testData)
        setAttempts(attemptsData)
      } catch (err) {
        console.error('Failed to load test attempts:', err)
        alert('Failed to load test submissions: ' + err.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [id])

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}m ${s}s`
  }

  // Summary Metrics
  const summary = useMemo(() => {
    if (!attempts.length) {
      return { total: 0, avgScore: 0, topScore: 0, avgAccuracy: 0 }
    }
    const total = attempts.length
    const topScore = Math.max(...attempts.map((a) => a.score))
    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0)
    const avgScore = (totalScore / total).toFixed(1)
    const totalAccuracy = attempts.reduce((sum, a) => sum + (a.accuracy_percentage || 0), 0)
    const avgAccuracy = (totalAccuracy / total).toFixed(1)

    return { total, avgScore, topScore, avgAccuracy }
  }, [attempts])

  const filteredAttempts = useMemo(() => {
    return attempts.filter((a) => {
      const q = searchQuery.toLowerCase()
      return (
        (a.student_name && a.student_name.toLowerCase().includes(q)) ||
        (a.student_email && a.student_email.toLowerCase().includes(q))
      )
    })
  }, [attempts, searchQuery])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-gray-700" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/tests')}
            className="h-9 w-9 p-0 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                {test?.title || 'Test Submissions'}
              </h1>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                Leaderboard & Attempts
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Review student scores, rank distributions, and accuracy breakdown.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/tests/${id}/questions`)}
            className="text-gray-700 border-gray-300"
          >
            Manage Questions
          </Button>
        </div>
      </div>

      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Test Takers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.total}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Top Score</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {summary.topScore} <span className="text-xs text-gray-400">/{test?.total_marks}</span>
              </p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Trophy className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Average Score</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {summary.avgScore} <span className="text-xs text-gray-400">/{test?.total_marks}</span>
              </p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Accuracy</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{summary.avgAccuracy}%</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <Card className="border-gray-200">
        <CardHeader className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="font-bold text-sm text-gray-800">
            All Student Attempts ({filteredAttempts.length})
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredAttempts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <HelpCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="font-semibold text-gray-700">No attempts yet</p>
              <p className="text-xs text-gray-400 mt-1">
                As soon as students appear for this test on the mobile app, their scores and analytics will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-16 font-semibold text-gray-700">Rank</TableHead>
                    <TableHead className="font-semibold text-gray-700">Student</TableHead>
                    <TableHead className="font-semibold text-gray-700">Score</TableHead>
                    <TableHead className="font-semibold text-gray-700">Accuracy</TableHead>
                    <TableHead className="font-semibold text-gray-700">Time Taken</TableHead>
                    <TableHead className="font-semibold text-gray-700">Submitted At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttempts.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50/80">
                      <TableCell>
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            item.rank === 1
                              ? 'bg-amber-100 text-amber-800'
                              : item.rank === 2
                              ? 'bg-slate-200 text-slate-800'
                              : item.rank === 3
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          #{item.rank}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-sm text-gray-900">
                          {item.student_name}
                        </div>
                        <div className="text-xs text-gray-400">{item.student_email}</div>
                      </TableCell>

                      <TableCell>
                        <span className="font-bold text-gray-900 text-sm">
                          {item.score}
                        </span>
                        <span className="text-xs text-gray-400">/{test?.total_marks}</span>
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          {item.accuracy_percentage}%
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-gray-600">
                        {formatTime(item.time_taken_seconds)}
                      </TableCell>

                      <TableCell className="text-xs text-gray-500">
                        {item.submitted_at
                          ? new Date(item.submitted_at).toLocaleString()
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
