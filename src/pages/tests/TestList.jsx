import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Plus,
  Search,
  Clock,
  Award,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Pencil,
  Trash2,
  ListOrdered,
  Eye,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
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
  fetchAdminTests,
  deleteTest,
  toggleTestPublish,
  createTest,
} from '../../services/testAdminService'

const CATEGORIES = ['All', 'SSC', 'Banking', 'Railways', 'State Exams', 'General']

const QUICK_PRESETS = [
  {
    title: 'SSC CGL Tier-1 Full Mock',
    category: 'SSC',
    duration_minutes: 60,
    total_marks: 200,
    positive_marks: 2.0,
    negative_marks: 0.5,
    is_free: true,
    price: 0,
    is_published: false,
    description: '100 Questions covering General Intelligence & Reasoning, General Awareness, Quantitative Aptitude, and English Comprehension.',
  },
  {
    title: 'IBPS PO / Clerk Prelims Mock',
    category: 'Banking',
    duration_minutes: 60,
    total_marks: 100,
    positive_marks: 1.0,
    negative_marks: 0.25,
    is_free: true,
    price: 0,
    is_published: false,
    description: 'Standard 100 Questions Banking Prelims Mock with Quantitative, Reasoning, and English sections.',
  },
  {
    title: '15-Min Speed Booster Quiz',
    category: 'General',
    duration_minutes: 15,
    total_marks: 20,
    positive_marks: 2.0,
    negative_marks: 0.5,
    is_free: true,
    price: 0,
    is_published: false,
    description: 'Rapid-fire 10-Question speed booster test for daily practice.',
  },
]

export const TestList = () => {
  const navigate = useNavigate()
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showPresetMenu, setShowPresetMenu] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const loadTests = async () => {
    try {
      setLoading(true)
      const data = await fetchAdminTests()
      setTests(data)
    } catch (err) {
      setError(err.message || 'Failed to load mock tests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTests()
  }, [])

  const handleDelete = async (testId, testTitle) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${testTitle}"?\nAll associated questions and student attempts will also be permanently deleted.`
    )
    if (!confirmDelete) return

    try {
      await deleteTest(testId)
      setTests((prev) => prev.filter((t) => t.id !== testId))
    } catch (err) {
      alert(err.message || 'Failed to delete test')
    }
  }

  const handleTogglePublish = async (test) => {
    try {
      const updated = await toggleTestPublish(test.id, !test.is_published)
      setTests((prev) =>
        prev.map((t) => (t.id === test.id ? { ...t, is_published: updated.is_published } : t))
      )
    } catch (err) {
      alert(err.message || 'Failed to change publish status')
    }
  }

  const handleCreateFromPreset = async (preset) => {
    try {
      setIsActionLoading(true)
      setShowPresetMenu(false)
      const newTest = await createTest(preset)
      navigate(`/tests/${newTest.id}/questions`)
    } catch (err) {
      alert('Error creating test from template: ' + err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory =
        selectedCategory === 'All' || t.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [tests, searchQuery, selectedCategory])

  // Top Statistics
  const stats = useMemo(() => {
    const totalTests = tests.length
    const publishedTests = tests.filter((t) => t.is_published).length
    const totalQuestions = tests.reduce((sum, t) => sum + (t.questions_count || 0), 0)
    const totalAttempts = tests.reduce((sum, t) => sum + (t.attempts_count || 0), 0)
    return { totalTests, publishedTests, totalQuestions, totalAttempts }
  }, [tests])

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mock Tests Management</h1>
          <p className="text-sm text-gray-500">
            Create and manage timed mock test series, exam questions, marking schemes, and student rankings.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="relative flex items-center gap-2">
          {/* Preset Dropdown Button */}
          <div className="relative">
            <Button
              variant="outline"
              className="flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              onClick={() => setShowPresetMenu((prev) => !prev)}
            >
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>Use Exam Preset</span>
            </Button>

            {showPresetMenu && (
              <div className="absolute right-0 top-12 z-50 w-72 rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
                <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Choose a Ready Template:
                </div>
                {QUICK_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    className="flex w-full flex-col items-start rounded-md p-2 text-left hover:bg-indigo-50 transition-colors"
                    onClick={() => handleCreateFromPreset(preset)}
                  >
                    <div className="text-sm font-semibold text-gray-900">{preset.title}</div>
                    <div className="text-xs text-gray-500">
                      {preset.duration_minutes} Mins • {preset.total_marks} Marks • (+{preset.positive_marks}/-{preset.negative_marks})
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white"
            onClick={() => navigate('/tests/new')}
          >
            <Plus className="h-4 w-4" />
            <span>Create Test</span>
          </Button>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tests</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTests}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Published Live</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.publishedTests}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Questions in Bank</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.totalQuestions}</p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <ListOrdered className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Student Attempts</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.totalAttempts}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-gray-200">
        <CardHeader className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tests by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Spinner className="h-8 w-8 text-gray-700" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : filteredTests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <HelpCircle className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-base font-semibold text-gray-700">No mock tests found</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Get started by creating your first mock test or choosing a preset template.
              </p>
              <Button
                onClick={() => navigate('/tests/new')}
                className="bg-gray-900 text-white hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Test
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Test Details</TableHead>
                    <TableHead className="font-semibold text-gray-700">Category</TableHead>
                    <TableHead className="font-semibold text-gray-700">Duration & Marks</TableHead>
                    <TableHead className="font-semibold text-gray-700">Questions</TableHead>
                    <TableHead className="font-semibold text-gray-700">Pricing</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Submissions</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTests.map((test) => (
                    <TableRow key={test.id} className="hover:bg-gray-50/80">
                      {/* Test Title & Description */}
                      <TableCell className="max-w-xs">
                        <div className="font-medium text-gray-900">{test.title}</div>
                        {test.description ? (
                          <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                            {test.description}
                          </div>
                        ) : null}
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {test.category}
                        </span>
                      </TableCell>

                      {/* Duration & Marks */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span>{test.duration_minutes} mins</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                          <Award className="h-3.5 w-3.5 text-gray-400" />
                          <span>{test.total_marks} Marks (+{test.positive_marks}/-{test.negative_marks})</span>
                        </div>
                      </TableCell>

                      {/* Questions Count */}
                      <TableCell>
                        <button
                          onClick={() => navigate(`/tests/${test.id}/questions`)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          <ListOrdered className="h-3.5 w-3.5" />
                          <span>{test.questions_count} Questions</span>
                        </button>
                      </TableCell>

                      {/* Pricing */}
                      <TableCell>
                        {test.is_free ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            FREE
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-gray-900">
                            ₹{test.price}
                          </span>
                        )}
                      </TableCell>

                      {/* Published Toggle */}
                      <TableCell>
                        <button
                          onClick={() => handleTogglePublish(test)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                            test.is_published
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {test.is_published ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Live</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5 text-gray-400" />
                              <span>Draft</span>
                            </>
                          )}
                        </button>
                      </TableCell>

                      {/* Submissions */}
                      <TableCell>
                        <button
                          onClick={() => navigate(`/tests/${test.id}/attempts`)}
                          className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-blue-600"
                        >
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          <span>{test.attempts_count} taken</span>
                        </button>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                            title="Manage Questions"
                            onClick={() => navigate(`/tests/${test.id}/questions`)}
                          >
                            <ListOrdered className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-gray-600 hover:bg-gray-100"
                            title="Edit Settings"
                            onClick={() => navigate(`/tests/${test.id}/edit`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-amber-600 hover:bg-amber-50"
                            title="Student Attempts & Rankings"
                            onClick={() => navigate(`/tests/${test.id}/attempts`)}
                          >
                            <TrendingUp className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-red-600 hover:bg-red-50"
                            title="Delete Test"
                            onClick={() => handleDelete(test.id, test.title)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
