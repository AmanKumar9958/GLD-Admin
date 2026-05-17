import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, XCircle, Loader2, ChevronUp, ChevronDown, X } from 'lucide-react'
import { uploadStore, useUploads } from '../../store/uploadStore'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Checkbox } from '../../components/ui/checkbox'
import { Spinner } from '../../components/ui/spinner'
import {
  createCourse,
  createModule,
  createVideo,
  fetchCourseWithRelations,
  updateCourse,
  uploadThumbnail,
  updateModuleOrder,
} from '../../services/courseService'
import { Progress } from '../../components/ui/progress'
import { uploadVideoToBunny } from '../../services/bunnyService'

const courseSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  category: z.string().min(2, 'Category is required'),
  price: z.coerce.number().nonnegative('Price must be 0 or greater'),
  instructorName: z.string().min(2, 'Instructor name is required'),
  isPublished: z.boolean().optional(),
})

export const CourseForm = () => {
  const { id } = useParams()
  const isEditing = useMemo(() => Boolean(id), [id])
  const navigate = useNavigate()
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [moduleTitle, setModuleTitle] = useState('')
  const [error, setError] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')

  const form = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      category: '',
      price: 0,
      instructorName: '',
      isPublished: false,
    },
  })

  useEffect(() => {
    if (!isEditing) {
      setLoading(false)
      return
    }

    const loadCourse = async () => {
      try {
        setLoading(true)
        const course = await fetchCourseWithRelations(id)
        if (course) {
          form.reset({
            title: course.title || '',
            category: course.category || '',
            price: course.price || 0,
            instructorName: course.instructor_name || course.instructorName || '',
            isPublished: !!(course.is_published ?? course.isPublished),
          })
          setModules(course.modules || [])
          if (course.thumbnail_url) {
            setThumbnailPreview(course.thumbnail_url)
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load course')
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [id, isEditing, form])

  const refreshModules = async () => {
    if (!id) return
    const course = await fetchCourseWithRelations(id)
    setModules(course.modules || [])
  }

  const onSubmit = async (values) => {
    setSaving(true)
    setError('')
    try {
      let thumbnailUrl = thumbnailPreview

      if (thumbnailFile) {
        thumbnailUrl = await uploadThumbnail(thumbnailFile)
      }

      const payload = {
        ...values,
        thumbnailUrl,
      }

      if (isEditing) {
        await updateCourse(id, payload)
      } else {
        const newCourseId = await createCourse(payload)
        navigate(`/courses/${newCourseId}`, { replace: true })
        return
      }
      navigate('/courses')
    } catch (err) {
      setError(err.message || 'Unable to save course')
    } finally {
      setSaving(false)
    }
  }

  const handleAddModule = async () => {
    if (!moduleTitle || !id) return
    try {
      await createModule(id, { title: moduleTitle, orderIndex: modules.length + 1 })
      setModuleTitle('')
      refreshModules()
    } catch (err) {
      setError(err.message || 'Unable to add module')
    }
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Course' : 'Create Course'}</CardTitle>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Course Title" {...form.register('title')} />
              {form.formState.errors.title?.message && (
                <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" placeholder="Category" {...form.register('category')} />
              {form.formState.errors.category?.message && (
                <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register('price')}
              />
              {form.formState.errors.price?.message && (
                <p className="text-sm text-red-600">{form.formState.errors.price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructorName">Instructor Name</Label>
              <Input
                id="instructorName"
                placeholder="Instructor"
                {...form.register('instructorName')}
              />
              {form.formState.errors.instructorName?.message && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.instructorName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail</Label>
              <div className="flex items-center gap-4">
                {thumbnailPreview && (
                  <img
                    src={thumbnailPreview}
                    alt="Preview"
                    className="h-16 w-16 rounded-md object-cover"
                  />
                )}
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-8">
              <Checkbox
                id="isPublished"
                checked={form.watch('isPublished')}
                onCheckedChange={(checked) => form.setValue('isPublished', !!checked)}
              />
              <Label htmlFor="isPublished" className="font-normal text-gray-700">
                Mark as Published
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => navigate('/courses')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size="sm" className="border-t-white" label="Saving" /> : null}
              <span className={saving ? 'sr-only' : ''}>
                {isEditing ? 'Save Changes' : 'Create Course'}
              </span>
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Curriculum Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing && (
            <p className="text-sm text-gray-600">
              Save the course first to start adding modules and videos.
            </p>
          )}
          {isEditing && (
            <>
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="moduleTitle">Module Title</Label>
                  <Input
                    id="moduleTitle"
                    placeholder="Module name"
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                  />
                </div>
                <Button type="button" className="md:w-48" onClick={handleAddModule}>
                  Add Module
                </Button>
              </div>
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                </div>
              )}
              {!loading && modules.length === 0 && (
                <p className="text-sm text-gray-600">No modules yet. Add your first module.</p>
              )}
              <Accordion type="single" collapsible className="w-full space-y-2">
                {modules.map((module) => (
                  <ChapterItem
                    key={module.id}
                    chapter={module}
                    courseId={id}
                    onRefresh={refreshModules}
                  />
                ))}
              </Accordion>
            </>
          )}
        </CardContent>
      </Card>
      <GlobalUploadWidget />
    </div>
  )
}

const GlobalUploadWidget = () => {
  const uploads = useUploads();
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-hide when complete and wait a few seconds
  useEffect(() => {
    if (uploads.length > 0 && uploads.every(u => u.status === 'complete')) {
      const timer = setTimeout(() => {
        uploadStore.clearCompleted();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [uploads]);

  if (!uploads.length) return null;

  const uploadingCount = uploads.filter(u => u.status === 'uploading').length;
  const completeCount = uploads.filter(u => u.status === 'complete').length;
  const errorCount = uploads.filter(u => u.status === 'error').length;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-lg shadow-2xl overflow-hidden border border-gray-200 bg-white font-sans animate-in slide-in-from-bottom-8">
      {/* Header */}
      <div 
        className="flex items-center justify-between bg-gray-900 px-4 py-3 cursor-pointer text-white transition-colors hover:bg-gray-800"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex flex-col">
          <span className="text-sm font-semibold">
            {uploadingCount > 0 
              ? `Uploading ${uploadingCount} item${uploadingCount > 1 ? 's' : ''}...` 
              : `${completeCount} upload${completeCount > 1 ? 's' : ''} complete`}
          </span>
          {errorCount > 0 && <span className="text-xs text-red-400">{errorCount} failed</span>}
        </div>
        <div className="flex items-center gap-2">
          <button className="focus:outline-none">
            {isMinimized ? <ChevronUp className="w-5 h-5 text-gray-400 hover:text-white" /> : <ChevronDown className="w-5 h-5 text-gray-400 hover:text-white" />}
          </button>
          {uploadingCount === 0 && (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                uploadStore.clearCompleted(); 
              }} 
              className="focus:outline-none"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Upload List */}
      {!isMinimized && (
        <div className="max-h-64 overflow-y-auto bg-gray-50/50">
          {uploads.map(u => (
            <div key={u.id} className="flex flex-col border-b border-gray-100 last:border-0 p-3 bg-white">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex flex-col overflow-hidden pr-2">
                  <span className="text-sm font-medium text-gray-800 truncate" title={u.title}>{u.title}</span>
                  {u.error && <span className="text-xs text-red-600 truncate" title={u.error}>{u.error}</span>}
                </div>
                <div className="flex-shrink-0 flex items-center justify-center w-6">
                  {u.status === 'uploading' && (
                    <div className="relative flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                    </div>
                  )}
                  {u.status === 'complete' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {u.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                </div>
              </div>
              {u.status === 'uploading' && (
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${u.progress}%` }}></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ChapterItem = ({ chapter, courseId, onRefresh }) => {
  const [subModuleTitle, setSubModuleTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAddSubModule = async () => {
    if (!subModuleTitle || !courseId) return
    setAdding(true)
    try {
      await createModule(courseId, {
        title: subModuleTitle,
        parentId: chapter.id,
        orderIndex: (chapter.subModules || []).length + 1
      })
      setSubModuleTitle('')
      onRefresh()
    } catch (err) {
      console.error('Failed to add sub-module:', err)
    } finally {
      setAdding(false)
    }
  }

  const handleMoveSubModule = async (subModuleId, direction) => {
    const siblings = [...(chapter.subModules || [])]
    const index = siblings.findIndex(s => s.id === subModuleId)
    if (index === -1) return

    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === siblings.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const current = siblings[index]
    const target = siblings[targetIndex]

    try {
      const currentNewOrder = target.order_index || (targetIndex + 1)
      const targetNewOrder = current.order_index || (index + 1)

      const finalCurrentNewOrder = currentNewOrder === targetNewOrder 
        ? (direction === 'up' ? currentNewOrder - 1 : currentNewOrder + 1) 
        : currentNewOrder;

      await Promise.all([
        updateModuleOrder(current.id, finalCurrentNewOrder),
        updateModuleOrder(target.id, targetNewOrder)
      ])

      onRefresh()
    } catch (err) {
      console.error('Failed to move sub-module:', err)
    }
  }

  return (
    <AccordionItem key={chapter.id} value={chapter.id}>
      <AccordionTrigger className="text-base font-semibold text-gray-900 hover:no-underline">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
            C
          </span>
          {chapter.title}
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">
        {/* Sub-module Creator */}
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor={`subModuleTitle-${chapter.id}`} className="text-xs text-gray-500">New Sub-Module / Exercise Title</Label>
            <Input
              id={`subModuleTitle-${chapter.id}`}
              placeholder="e.g. Exercise 1.1"
              value={subModuleTitle}
              onChange={(e) => setSubModuleTitle(e.target.value)}
              className="bg-white"
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="md:w-36"
            disabled={adding || !subModuleTitle}
            onClick={handleAddSubModule}
          >
            {adding ? 'Adding...' : 'Add Sub-Module'}
          </Button>
        </div>

        {/* Sub-modules List */}
        <div className="space-y-3 pl-2">
          {(!chapter.subModules || chapter.subModules.length === 0) ? (
            <p className="text-xs text-gray-500 italic">No sub-modules added yet. Add a sub-module to start uploading videos.</p>
          ) : (
            chapter.subModules.map((subModule, index) => (
              <SubModuleItem
                key={subModule.id}
                subModule={subModule}
                courseId={courseId}
                onRefresh={onRefresh}
                onMove={handleMoveSubModule}
                isFirst={index === 0}
                isLast={index === chapter.subModules.length - 1}
              />
            ))
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

const SubModuleItem = ({ subModule, courseId, onRefresh, onMove, isFirst, isLast }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="rounded-lg border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50/50 border-b border-gray-100">
        <div 
          className="flex flex-1 items-center gap-2 cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Collapse/Expand Arrow Icon */}
          <span className="text-gray-400 hover:text-gray-600 transition-transform duration-200">
            <svg 
              className={`h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600 shadow-sm">
            E
          </span>
          <span className="font-semibold text-gray-800 text-sm">
            {subModule.title}
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
            {subModule.videos?.length || 0} Video{(subModule.videos?.length === 1) ? "" : "s"}
          </span>
        </div>

        {/* Up / Down Order controls */}
        <div className="flex items-center gap-1 pl-2 border-l border-gray-100">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md hover:bg-gray-200"
            disabled={isFirst}
            onClick={() => onMove(subModule.id, 'up')}
            title="Move Up"
          >
            <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md hover:bg-gray-200"
            disabled={isLast}
            onClick={() => onMove(subModule.id, 'down')}
            title="Move Down"
          >
            <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-3 bg-white border-t border-gray-50 animate-in fade-in slide-in-from-top-1 duration-200">
          <ModuleVideos
            module={subModule}
            courseId={courseId}
            onVideoCreated={onRefresh}
          />
        </div>
      )}
    </div>
  )
}

const videoSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  duration: z.coerce.number().positive('Duration must be positive'),
  isPreview: z.boolean().optional(),
  file: z.any().optional(),
})

const ModuleVideos = ({ module, courseId, onVideoCreated }) => {
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: '',
      duration: '',
      isPreview: false,
      file: undefined,
    },
  })

  const submitVideo = (values) => {
    if (!courseId || !module?.id) return
    const uploadId = Date.now().toString()

    setDialogOpen(false)
    form.reset()

    uploadStore.addUpload({
      id: uploadId,
      title: values.title,
      progress: 0,
      error: null
    })

    // Background upload execution
    ;(async () => {
      try {
        const { videoId } = await uploadVideoToBunny(
          values.file, 
          values.title, 
          (prog) => uploadStore.updateUpload(uploadId, { progress: prog })
        )

        await createVideo(module.id, {
          ...values,
          bunnyVideoId: videoId,
        })
        
        uploadStore.updateUpload(uploadId, { status: 'complete', progress: 100 })
        onVideoCreated?.()
      } catch (err) {
        uploadStore.updateUpload(uploadId, { status: 'error', error: err.message || 'Unable to add video' })
      }
    })()
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <p className="font-medium text-gray-900">Videos</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Add Video</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogCloseButton />
            <DialogHeader>
              <DialogTitle>Add Video</DialogTitle>
              <DialogDescription>Upload a new video for this module.</DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={form.handleSubmit(submitVideo)}>
              <div className="space-y-2">
                <Label htmlFor="videoTitle">Title</Label>
                <Input id="videoTitle" {...form.register('title')} />
                {form.formState.errors.title?.message && (
                  <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" type="number" step="0.1" {...form.register('duration')} />
                {form.formState.errors.duration?.message && (
                  <p className="text-sm text-red-600">{form.formState.errors.duration.message}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPreview"
                  checked={form.watch('isPreview')}
                  onCheckedChange={(checked) => form.setValue('isPreview', !!checked)}
                />
                <Label htmlFor="isPreview" className="font-normal text-gray-700">
                  Mark as Preview
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="videoFile">Video File</Label>
                <Input
                  id="videoFile"
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    form.setValue('file', file)
                  }}
                />
              </div>

              <DialogFooter>
                <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Video
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {/* Render completed videos */}
        {module.videos?.length ? (
          module.videos.map((video) => (
            <div
              key={video.id}
              className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm shadow-sm border border-gray-100"
            >
              <div>
                <p className="font-medium">{video.title}</p>
                <p className="text-xs text-gray-500">
                  {video.duration} min • {video.is_preview ? 'Preview' : 'Full'}
                </p>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                {video.bunny_video_id}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-600">No videos yet.</p>
        )}
      </div>
    </div>
  )
}

