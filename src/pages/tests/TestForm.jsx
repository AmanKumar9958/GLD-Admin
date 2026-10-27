import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Sparkles,
  Clock,
  Award,
  CheckCircle2,
  FileText,
  DollarSign,
  HelpCircle,
  Save,
  ChevronRight,
  Plus,
  FolderPlus,
  Check,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Spinner } from '../../components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  createTest,
  updateTest,
  fetchTestWithQuestions,
  fetchCategories,
  addCategory,
  DEFAULT_CATEGORIES,
} from '../../services/testAdminService'

const PRESETS = [
  {
    id: 'ssc',
    name: 'SSC CGL / CHSL Full Mock',
    category: 'SSC',
    duration_minutes: 60,
    total_marks: 200,
    positive_marks: 2.0,
    negative_marks: 0.5,
    description: 'Tier-1 Mock Test with 100 questions divided into 4 sections: General Intelligence & Reasoning, General Awareness, Quantitative Aptitude, and English Comprehension.',
  },
  {
    id: 'banking',
    name: 'IBPS / SBI PO Prelims',
    category: 'Banking',
    duration_minutes: 60,
    total_marks: 100,
    positive_marks: 1.0,
    negative_marks: 0.25,
    description: 'Standard banking prelims pattern with 100 questions: English Language (30 Qs), Quantitative Aptitude (35 Qs), and Reasoning Ability (35 Qs).',
  },
  {
    id: 'speed',
    name: '15-Min Daily Speed Quiz',
    category: 'General',
    duration_minutes: 15,
    total_marks: 20,
    positive_marks: 2.0,
    negative_marks: 0.5,
    description: 'Fast-paced 10-Question daily booster test to sharpen problem-solving accuracy under time pressure.',
  },
]

export const TestForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Categories list
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categorySuccessMsg, setCategorySuccessMsg] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'SSC',
    duration_minutes: 60,
    total_marks: 100,
    positive_marks: 1.0,
    negative_marks: 0.25,
    is_free: true,
    price: 0,
    is_published: true,
  })

  // Load Categories & Test
  useEffect(() => {
    async function init() {
      try {
        const catList = await fetchCategories()
        setCategories(catList)

        if (id) {
          setIsLoading(true)
          const data = await fetchTestWithQuestions(id)
          setFormData({
            title: data.title || '',
            description: data.description || '',
            category: data.category || 'SSC',
            duration_minutes: data.duration_minutes || 60,
            total_marks: data.total_marks || 100,
            positive_marks: data.positive_marks || 1,
            negative_marks: data.negative_marks || 0.25,
            is_free: data.is_free !== false,
            price: data.price || 0,
            is_published: data.is_published !== false,
          })

          // Ensure loaded category is in category list
          if (data.category && !catList.includes(data.category)) {
            setCategories((prev) => [...prev, data.category])
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load test details')
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [id])

  // Handle adding a new category
  const handleAddNewCategory = (e) => {
    e?.preventDefault()
    const trimmed = newCategoryName.trim()
    if (!trimmed) return

    addCategory(trimmed)

    setCategories((prev) => {
      if (!prev.includes(trimmed)) return [...prev, trimmed]
      return prev
    })

    // Automatically select the new category for this test
    setFormData((prev) => ({ ...prev, category: trimmed }))
    setNewCategoryName('')
    setShowNewCategoryModal(false)

    // Show quick feedback
    setCategorySuccessMsg(`Category "${trimmed}" created & selected!`)
    setTimeout(() => setCategorySuccessMsg(''), 4000)
  }

  // Apply a preset
  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      title: prev.title || preset.name,
      category: preset.category,
      duration_minutes: preset.duration_minutes,
      total_marks: preset.total_marks,
      positive_marks: preset.positive_marks,
      negative_marks: preset.negative_marks,
      description: preset.description,
    }))
  }

  const handleSubmit = async (proceedToQuestions = false) => {
    if (!formData.title.trim()) {
      alert('Please enter a test title')
      return
    }

    try {
      setIsSaving(true)
      setError('')

      let savedTest
      if (isEditing) {
        savedTest = await updateTest(id, formData)
      } else {
        savedTest = await createTest(formData)
      }

      if (proceedToQuestions) {
        navigate(`/tests/${savedTest.id}/questions`)
      } else {
        navigate('/tests')
      }
    } catch (err) {
      setError(err.message || 'Failed to save test')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-gray-700" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header with Back button */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              {isEditing ? 'Edit Test Settings' : 'Create New Mock Test'}
            </h1>
            <p className="text-xs text-gray-500">
              Configure exam title, time duration, marking scheme, and access controls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/tests')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={isSaving}
            className="bg-gray-900 text-white hover:bg-gray-800 flex items-center gap-1.5"
          >
            {isSaving ? (
              <Spinner className="h-4 w-4 mr-1 text-white" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            <span>{isEditing ? 'Save & Edit Questions' : 'Save & Add Questions'}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      ) : null}

      {categorySuccessMsg ? (
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200 animate-fadeIn">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{categorySuccessMsg}</span>
        </div>
      ) : null}

      {/* QUICK PRESETS BANNER (Only when creating new test) */}
      {!isEditing && (
        <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-blue-50/70">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <CardTitle className="text-sm font-semibold text-indigo-900">
                Quick Setup: Choose an Exam Template
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-indigo-700">
              Click any template below to auto-populate duration, marks, and standard negative marking.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="flex flex-col text-left p-3 rounded-lg border border-indigo-200/80 bg-white hover:border-indigo-500 hover:shadow-sm transition-all"
                >
                  <span className="text-xs font-bold text-gray-900">{preset.name}</span>
                  <span className="text-[11px] text-gray-500 mt-1">
                    {preset.duration_minutes} Mins • {preset.total_marks} Marks
                  </span>
                  <span className="text-[10px] font-medium text-emerald-600 mt-0.5">
                    +{preset.positive_marks} / -{preset.negative_marks} scheme
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 1: Basic Information */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="p-5 pb-3 border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span>1. Basic Exam Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-xs font-semibold text-gray-700">
              Test Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. SSC CGL 2026 : Full Length Mock Test - 01"
              className="mt-1"
            />
          </div>

          {/* Category & New Category Action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="category" className="text-xs font-semibold text-gray-700">
                  Exam Category
                </Label>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Category</span>
                </button>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setShowNewCategoryModal(true)
                    } else {
                      setFormData({ ...formData, category: e.target.value })
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__add_new__" className="text-blue-600 font-semibold">
                    + Add New Category...
                  </option>
                </select>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewCategoryModal(true)}
                  className="px-2.5 h-9 shrink-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  title="Create New Category"
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-xs font-semibold text-gray-700">
                Short Description / Instructions
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Full syllabus comprehensive mock test with negative marking"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STEP 2: Timing & Marking Scheme */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="p-5 pb-3 border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <span>2. Timing & Marking Scheme</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Duration */}
            <div>
              <Label htmlFor="duration" className="text-xs font-semibold text-gray-700">
                Duration (Minutes) <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="360"
                  value={formData.duration_minutes}
                  onChange={(e) =>
                    setFormData({ ...formData, duration_minutes: Number(e.target.value) })
                  }
                  className="pr-12"
                />
                <span className="absolute right-3 top-2 text-xs text-gray-400">Mins</span>
              </div>
            </div>

            {/* Total Marks */}
            <div>
              <Label htmlFor="totalMarks" className="text-xs font-semibold text-gray-700">
                Total Max Marks <span className="text-red-500">*</span>
              </Label>
              <Input
                id="totalMarks"
                type="number"
                min="1"
                value={formData.total_marks}
                onChange={(e) =>
                  setFormData({ ...formData, total_marks: Number(e.target.value) })
                }
                className="mt-1"
              />
            </div>

            {/* Positive Marks */}
            <div>
              <Label htmlFor="posMarks" className="text-xs font-semibold text-gray-700">
                Correct Answer Marks (+) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="posMarks"
                type="number"
                step="0.25"
                min="0"
                value={formData.positive_marks}
                onChange={(e) =>
                  setFormData({ ...formData, positive_marks: Number(e.target.value) })
                }
                className="mt-1"
                placeholder="e.g. 2.0"
              />
            </div>

            {/* Negative Marks */}
            <div>
              <Label htmlFor="negMarks" className="text-xs font-semibold text-gray-700">
                Wrong Answer Deduction (-) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="negMarks"
                type="number"
                step="0.25"
                min="0"
                value={formData.negative_marks}
                onChange={(e) =>
                  setFormData({ ...formData, negative_marks: Number(e.target.value) })
                }
                className="mt-1"
                placeholder="e.g. 0.5"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tip: These are default marks for every question in this test. You can also override marks per question if a section has different weightage.
          </p>
        </CardContent>
      </Card>

      {/* STEP 3: Pricing & Visibility */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="p-5 pb-3 border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span>3. Access & Visibility</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
            <div>
              <div className="font-semibold text-sm text-gray-900">Free Practice Test</div>
              <div className="text-xs text-gray-500">
                When checked, all students can attempt this mock test for free without purchasing.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_free}
                onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {!formData.is_free && (
            <div className="max-w-xs">
              <Label htmlFor="price" className="text-xs font-semibold text-gray-700">
                Test Price (₹)
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2 text-sm text-gray-500">₹</span>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="pl-7"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
            <div>
              <div className="font-semibold text-sm text-gray-900">Publish to Mobile App</div>
              <div className="text-xs text-gray-500">
                When active, this test is visible to students in the mobile app's Mock Tests section.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Save Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={isSaving}
        >
          Save & Return to List
        </Button>
        <Button
          onClick={() => handleSubmit(true)}
          disabled={isSaving}
          className="bg-gray-900 text-white hover:bg-gray-800 flex items-center gap-1.5"
        >
          {isSaving ? <Spinner className="h-4 w-4 mr-1 text-white" /> : null}
          <span>{isEditing ? 'Save & Open Questions' : 'Save & Add Questions'}</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* NEW CATEGORY MODAL */}
      <Dialog open={showNewCategoryModal} onOpenChange={setShowNewCategoryModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 font-bold">
              <FolderPlus className="h-5 w-5 text-blue-600" />
              <span>Create New Exam Category</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Add a new category (e.g. UPSC, Defence / CDS, Teaching, GATE). It will be available for all future tests and in the mobile app.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddNewCategory} className="space-y-4 py-2">
            <div>
              <Label htmlFor="newCategoryInput" className="text-xs font-semibold text-gray-700">
                Category Name
              </Label>
              <Input
                id="newCategoryInput"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Defence / NDA, UPSC, Teaching"
                autoFocus
                className="mt-1"
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewCategoryModal(false)
                  setNewCategoryName('')
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!newCategoryName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
