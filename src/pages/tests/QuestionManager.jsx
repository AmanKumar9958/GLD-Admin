import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Save,
  CheckCircle2,
  Circle,
  HelpCircle,
  Lightbulb,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  ListOrdered,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowUp,
  ArrowDown,
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
  fetchTestWithQuestions,
  saveTestQuestions,
} from '../../services/testAdminService'

const DEFAULT_SECTIONS = [
  'General Intelligence & Reasoning',
  'Quantitative Aptitude',
  'General English',
  'General Awareness',
]

export const QuestionManager = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const [test, setTest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeSectionFilter, setActiveSectionFilter] = useState('All')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [customSectionInput, setCustomSectionInput] = useState('')
  const [showCustomSectionModal, setShowCustomSectionModal] = useState(false)

  const getDraftKey = (testId) => 'gld_questions_draft_' + testId;

  // Auto-save unsaved questions to localStorage whenever they change
  useEffect(() => {
    if (id && questions && questions.length > 0 && hasUnsavedChanges) {
      try {
        localStorage.setItem(getDraftKey(id), JSON.stringify(questions));
      } catch (e) {}
    }
  }, [id, questions, hasUnsavedChanges]);


  // 1. Load Test and Questions
  // Warn user before leaving if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    async function load() {
      if (!id) return
      try {
        setIsLoading(true)
        const data = await fetchTestWithQuestions(id)
        setTest(data)

        // Check if local draft exists
        let draftFound = false;
        try {
          const savedDraft = localStorage.getItem(getDraftKey(id));
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setQuestions(parsed);
              setHasUnsavedChanges(true);
              draftFound = true;
            }
          }
        } catch (e) {}

        if (!draftFound) {
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions)
          } else {
          // Add first blank question
          setQuestions([
            createNewQuestion(
              1,
              data.positive_marks ?? 1,
              data.negative_marks ?? 0.25,
              DEFAULT_SECTIONS[0]
            ),
          ])
        }
        }
      } catch (err) {
        console.error('Failed to load questions:', err)
        alert('Failed to load test questions: ' + err.message)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  // Helper: Create a fresh new question
  const createNewQuestion = (order, pos = 1, neg = 0.25, sec = 'General Intelligence & Reasoning') => ({
    id: 'new_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    section_name: sec,
    question_text: '',
    question_image_url: '',
    options: ['', '', '', ''],
    correct_option_index: 0,
    explanation: '',
    positive_marks: pos,
    negative_marks: neg,
    order_index: order,
  })

  // Unique sections in current questions + defaults
  const availableSections = useMemo(() => {
    const set = new Set([...DEFAULT_SECTIONS])
    questions.forEach((q) => {
      if (q.section_name) set.add(q.section_name)
    })
    return Array.from(set)
  }, [questions])

  // Current Question
  const currentQuestion = questions[selectedIndex] || questions[0]

  // Update current question field
  const updateCurrentQuestion = (field, value) => {
    setQuestions((prev) => {
      const updated = [...prev]
      updated[selectedIndex] = {
        ...updated[selectedIndex],
        [field]: value,
      }
      return updated
    })
    setHasUnsavedChanges(true)
  }

  // Update specific option
  const updateOptionText = (optIdx, text) => {
    if (!currentQuestion) return
    const newOptions = [...(currentQuestion.options || ['', '', '', ''])]
    newOptions[optIdx] = text
    updateCurrentQuestion('options', newOptions)
  }

  // Add Question
  const handleAddQuestion = (andSelect = true) => {
    const nextOrder = questions.length + 1
    const newQ = createNewQuestion(
      nextOrder,
      test?.positive_marks ?? 1,
      test?.negative_marks ?? 0.25,
      currentQuestion?.section_name || DEFAULT_SECTIONS[0]
    )
    setQuestions((prev) => [...prev, newQ])
    setHasUnsavedChanges(true)
    if (andSelect) {
      setSelectedIndex(questions.length)
    }
  }

  // Duplicate Question
  const handleDuplicateQuestion = () => {
    if (!currentQuestion) return
    const dup = {
      ...currentQuestion,
      id: 'new_' + Date.now(),
      order_index: questions.length + 1,
    }
    setQuestions((prev) => [...prev, dup])
    setSelectedIndex(questions.length)
    setHasUnsavedChanges(true)
  }

  // Delete Question
  const handleDeleteQuestion = (idxToDelete) => {
    if (questions.length <= 1) {
      alert('A test must have at least one question.')
      return
    }
    const confirmed = window.confirm(`Delete Question #${idxToDelete + 1}?`)
    if (!confirmed) return

    setQuestions((prev) => {
      const filtered = prev.filter((_, i) => i !== idxToDelete)
      return filtered.map((q, i) => ({ ...q, order_index: i + 1 }))
    })
    setSelectedIndex((prev) => Math.max(0, prev >= idxToDelete ? prev - 1 : prev))
    setHasUnsavedChanges(true)
  }

  // Move Question Order
  const handleMoveQuestion = (direction) => {
    if (direction === 'up' && selectedIndex === 0) return
    if (direction === 'down' && selectedIndex === questions.length - 1) return

    const targetIndex = direction === 'up' ? selectedIndex - 1 : selectedIndex + 1
    setQuestions((prev) => {
      const updated = [...prev]
      const temp = updated[selectedIndex]
      updated[selectedIndex] = updated[targetIndex]
      updated[targetIndex] = temp
      return updated.map((q, i) => ({ ...q, order_index: i + 1 }))
    })
    setSelectedIndex(targetIndex)
    setHasUnsavedChanges(true)
  }

  // Save All Questions
  const handleSaveAll = async () => {
    // Validate that questions have text and options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question_text.trim()) {
        alert(`Question #${i + 1} has empty question text. Please fill it before saving.`)
        setSelectedIndex(i)
        return
      }
      const hasEmptyOpt = (q.options || []).some((opt) => !String(opt).trim())
      if (hasEmptyOpt) {
        alert(`Question #${i + 1} has one or more empty options. Please fill all 4 options.`)
        setSelectedIndex(i)
        return
      }
    }

    try {
      setIsSaving(true)
      await saveTestQuestions(id, questions)
      setHasUnsavedChanges(false)
        try { localStorage.removeItem(getDraftKey(id)); } catch (e) {}
      // Reload fresh state with generated IDs
      const reloaded = await fetchTestWithQuestions(id)
      setQuestions(reloaded.questions)
      alert('All questions successfully saved!')
    } catch (err) {
      alert('Error saving questions: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Bulk Import Parser
  const handleParseBulk = () => {
    if (!bulkText.trim()) return

    try {
      // Check if user pasted JSON
      if (bulkText.trim().startsWith('[') && bulkText.trim().endsWith(']')) {
        const parsed = JSON.parse(bulkText)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted = parsed.map((item, idx) => ({
            id: 'new_' + Date.now() + '_' + idx,
            section_name: item.section || item.section_name || DEFAULT_SECTIONS[0],
            question_text: item.question || item.question_text || '',
            question_image_url: item.image_url || '',
            options: item.options || ['', '', '', ''],
            correct_option_index: Number(item.correct_index ?? item.correct_option_index ?? 0),
            explanation: item.explanation || '',
            positive_marks: Number(item.positive_marks ?? test?.positive_marks ?? 1),
            negative_marks: Number(item.negative_marks ?? test?.negative_marks ?? 0.25),
            order_index: questions.length + idx + 1,
          }))

          setQuestions((prev) => [...prev, ...formatted])
          setHasUnsavedChanges(true)
          setShowBulkModal(false)
          setBulkText('')
          alert(`Successfully imported ${formatted.length} questions!`)
          return
        }
      }

      // Plain text block parser:
      // Question text
      // A) Option 1
      // B) Option 2
      // C) Option 3
      // D) Option 4
      // Answer: B
      // Explanation: ...
      const blocks = bulkText.split(/\n\s*\n/)
      const parsedList = []

      blocks.forEach((block, bIdx) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
        if (lines.length >= 5) {
          const qText = lines[0].replace(/^(Q\d+[.:]|Question\s*\d+[.:])\s*/i, '')
          const opts = []
          let ansIdx = 0
          let explanation = ''

          lines.slice(1).forEach((line) => {
            const optMatch = line.match(/^([A-D1-4])[).:]\s*(.*)$/i)
            const ansMatch = line.match(/^(?:Answer|Ans)[.:]\s*([A-D1-4])/i)
            const expMatch = line.match(/^(?:Explanation|Solution)[.:]\s*(.*)$/i)

            if (optMatch && opts.length < 4) {
              opts.push(optMatch[2])
            } else if (ansMatch) {
              const letter = ansMatch[1].toUpperCase()
              if (letter === 'A' || letter === '1') ansIdx = 0
              if (letter === 'B' || letter === '2') ansIdx = 1
              if (letter === 'C' || letter === '3') ansIdx = 2
              if (letter === 'D' || letter === '4') ansIdx = 3
            } else if (expMatch) {
              explanation = expMatch[1]
            }
          })

          while (opts.length < 4) {
            opts.push(`Option ${opts.length + 1}`)
          }

          parsedList.push({
            id: 'new_' + Date.now() + '_' + bIdx,
            section_name: currentQuestion?.section_name || DEFAULT_SECTIONS[0],
            question_text: qText,
            question_image_url: '',
            options: opts,
            correct_option_index: ansIdx,
            explanation,
            positive_marks: test?.positive_marks ?? 1,
            negative_marks: test?.negative_marks ?? 0.25,
            order_index: questions.length + bIdx + 1,
          })
        }
      })

      if (parsedList.length === 0) {
        alert('Could not detect questions format. Please ensure each question has question text, 4 options (A, B, C, D), and Answer.')
        return
      }

      setQuestions((prev) => [...prev, ...parsedList])
      setHasUnsavedChanges(true)
      setShowBulkModal(false)
      setBulkText('')
      alert(`Successfully imported ${parsedList.length} questions!`)
    } catch (err) {
      alert('Error parsing bulk import: ' + err.message)
    }
  }

  // Filter questions for sidebar list
  const filteredQuestionIndices = useMemo(() => {
    return questions
      .map((q, idx) => ({ q, idx }))
      .filter(({ q }) => {
        if (activeSectionFilter === 'All') return true
        return q.section_name === activeSectionFilter
      })
      .map(({ idx }) => idx)
  }, [questions, activeSectionFilter])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-gray-700" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-12">
      {/* 1. TOP HEADER BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (hasUnsavedChanges) {
                const leave = window.confirm('You have unsaved changes. Leave without saving?')
                if (!leave) return
              }
              navigate('/tests')
            }}
            className="h-9 w-9 p-0 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                {test?.title || 'Question Builder'}
              </h1>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {test?.category}
              </span>
              {hasUnsavedChanges && (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <AlertCircle className="h-3 w-3" />
                  Unsaved changes
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Duration: {test?.duration_minutes} Mins • Total Questions: {questions.length} • Marking: (+{test?.positive_marks}/-{test?.negative_marks})
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-1.5 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
            <span>Bulk Import</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 font-semibold px-4"
          >
            {isSaving ? (
              <Spinner className="h-4 w-4 mr-1 text-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Save All Questions</span>
          </Button>
        </div>
      </div>

      {/* 2. SECTION FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSectionFilter('All')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
            activeSectionFilter === 'All'
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Sections ({questions.length})
        </button>

        {availableSections.map((sec) => {
          const count = questions.filter((q) => q.section_name === sec).length
          return (
            <button
              key={sec}
              onClick={() => setActiveSectionFilter(sec)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeSectionFilter === sec
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {sec} ({count})
            </button>
          )
        })}
      </div>

      {/* 3. MAIN WORKSPACE: Sidebar Navigator + Question Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT NAVIGATOR: Question List (3 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="p-3 border-b border-gray-100 flex flex-row items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Questions List
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddQuestion(true)}
                className="h-7 text-xs px-2 flex items-center gap-1 bg-gray-50 border-gray-300 hover:bg-gray-100"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Question</span>
              </Button>
            </CardHeader>

            <CardContent className="p-2 max-h-[620px] overflow-y-auto space-y-1.5">
              {filteredQuestionIndices.map((qIdx) => {
                const q = questions[qIdx]
                const isSelected = qIdx === selectedIndex
                const isAnswerSet = (q.options || []).some((opt) => opt && opt.trim() !== '')

                return (
                  <div
                    key={q.id || qIdx}
                    onClick={() => setSelectedIndex(qIdx)}
                    className={`group flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 shadow-sm'
                        : 'bg-white border-gray-200/70 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {/* Q Number Badge */}
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {qIdx + 1}
                    </div>

                    {/* Question summary */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 line-clamp-1">
                        {q.question_text || (
                          <span className="italic text-gray-400">Blank question text...</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-500 truncate max-w-[130px]">
                          {q.section_name || 'General'}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                          Ans: Opt {q.correct_option_index + 1}
                        </span>
                      </div>
                    </div>

                    {/* Delete action */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteQuestion(qIdx)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 p-1"
                      title="Delete question"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL: Question Editor (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {currentQuestion ? (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-blue-600 text-white font-bold text-xs px-2.5 py-1">
                    Question #{selectedIndex + 1} of {questions.length}
                  </span>

                  {/* Section Selector */}
                  <select
                    value={currentQuestion.section_name || DEFAULT_SECTIONS[0]}
                    onChange={(e) => updateCurrentQuestion('section_name', e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium focus:border-blue-500 focus:outline-none"
                  >
                    {availableSections.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Marks per Question */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs text-gray-600">Marks (+):</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={currentQuestion.positive_marks ?? test?.positive_marks ?? 1}
                      onChange={(e) => updateCurrentQuestion('positive_marks', e.target.value)}
                      className="h-7 w-16 text-xs text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs text-gray-600">Neg (-):</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={currentQuestion.negative_marks ?? test?.negative_marks ?? 0.25}
                      onChange={(e) => updateCurrentQuestion('negative_marks', e.target.value)}
                      className="h-7 w-16 text-xs text-center"
                    />
                  </div>

                  {/* Move Up/Down Controls */}
                  <div className="flex items-center border border-gray-200 rounded-md bg-white">
                    <button
                      type="button"
                      disabled={selectedIndex === 0}
                      onClick={() => handleMoveQuestion('up')}
                      className="p-1 hover:bg-gray-100 disabled:opacity-30 text-gray-600"
                      title="Move Question Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={selectedIndex === questions.length - 1}
                      onClick={() => handleMoveQuestion('down')}
                      className="p-1 hover:bg-gray-100 disabled:opacity-30 text-gray-600 border-l border-gray-200"
                      title="Move Question Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                {/* 1. Question Text */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Question Text
                    </Label>
                    <span className="text-[11px] text-gray-400">Supports direct copy-paste</span>
                  </div>
                  <textarea
                    rows={4}
                    value={currentQuestion.question_text || ''}
                    onChange={(e) => updateCurrentQuestion('question_text', e.target.value)}
                    placeholder="Enter question statement here, e.g.: Select the most appropriate synonym of the given word: 'Callous'..."
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-sans"
                  />
                </div>

                {/* Question Image URL (optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-gray-500" />
                      <span>Optional Diagram / Figure Image URL</span>
                    </Label>
                  </div>
                  <Input
                    value={currentQuestion.question_image_url || ''}
                    onChange={(e) => updateCurrentQuestion('question_image_url', e.target.value)}
                    placeholder="https://... (image URL for math/reasoning questions if any)"
                    className="text-xs"
                  />
                  {currentQuestion.question_image_url ? (
                    <div className="mt-2 p-2 border border-gray-200 rounded-md bg-gray-50 flex items-center gap-2">
                      <img
                        src={currentQuestion.question_image_url}
                        alt="Question Preview"
                        className="max-h-24 rounded object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    </div>
                  ) : null}
                </div>

                {/* 2. 4 Options with Correct Answer Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Options & Correct Answer
                    </Label>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      Click "Mark as Correct" on the right of the right choice
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {[0, 1, 2, 3].map((optIdx) => {
                      const isCorrect = currentQuestion.correct_option_index === optIdx
                      const optVal = currentQuestion.options?.[optIdx] || ''

                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          {/* Option Number */}
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {optIdx + 1}
                          </span>

                          {/* Option Input */}
                          <Input
                            value={optVal}
                            onChange={(e) => updateOptionText(optIdx, e.target.value)}
                            placeholder={`Enter option ${optIdx + 1}...`}
                            className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-sm shadow-none font-sans"
                          />

                          {/* Correct Answer Toggle Button */}
                          <button
                            type="button"
                            onClick={() => updateCurrentQuestion('correct_option_index', optIdx)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                              isCorrect
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'border border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Correct Answer</span>
                              </>
                            ) : (
                              <>
                                <Circle className="h-4 w-4 text-gray-300" />
                                <span>Mark as Correct</span>
                              </>
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Detailed Solution & Explanation */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Solution & Step-by-Step Explanation
                    </Label>
                  </div>
                  <textarea
                    rows={3}
                    value={currentQuestion.explanation || ''}
                    onChange={(e) => updateCurrentQuestion('explanation', e.target.value)}
                    placeholder="Provide detailed explanation, formulas, or rules. Students will see this in the Solutions tab on their mobile app."
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-sans"
                  />
                </div>

                {/* BOTTOM ACTION BAR */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDuplicateQuestion}
                      className="text-gray-600 hover:bg-gray-100"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                      Duplicate
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuestion(selectedIndex)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete Question
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={selectedIndex === 0}
                      onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    {selectedIndex < questions.length - 1 ? (
                      <Button
                        size="sm"
                        onClick={() => setSelectedIndex((prev) => prev + 1)}
                        className="bg-gray-900 text-white hover:bg-gray-800"
                      >
                        <span>Next Question</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAddQuestion(true)}
                        className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Save & Add Next Question</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-12 text-center text-gray-500">No question selected.</div>
          )}
        </div>
      </div>

      {/* BULK IMPORT DIALOG */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 font-bold">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <span>Bulk Import Questions</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Paste multiple questions at once. You can paste standard text format (Questions with A, B, C, D and Answer) or JSON array.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-200">
              <span className="font-bold text-gray-800">Supported format:</span>
              <pre className="text-[11px] text-gray-700 mt-1">
{`1. What is the capital of India?
A) Mumbai
B) New Delhi
C) Kolkata
D) Chennai
Answer: B
Explanation: New Delhi is the official capital.
`}
              </pre>
            </div>

            <textarea
              rows={9}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Paste your questions here..."
              className="w-full rounded-md border border-gray-300 p-2.5 text-xs font-mono focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBulkModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleParseBulk}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Parse & Import Questions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
