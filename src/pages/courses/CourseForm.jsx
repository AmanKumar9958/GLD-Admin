import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
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
} from '../../services/courseService'

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
              <Label htmlFor="price">Price</Label>
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
                  <AccordionItem key={module.id} value={module.id}>
                    <AccordionTrigger>{module.title}</AccordionTrigger>
                    <AccordionContent>
                      <ModuleVideos
                        module={module}
                        courseId={id}
                        onVideoCreated={refreshModules}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </>
          )}
        </CardContent>
      </Card>
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const form = useForm({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: '',
      duration: '',
      isPreview: false,
      file: undefined,
    },
  })

  const submitVideo = async (values) => {
    if (!courseId || !module?.id) return
    setSaving(true)
    setError('')
    try {
      // Mock upload to Bunny.net preserved as requested
      const { bunnyVideoId } = await mockUploadToBunny(values.file)

      await createVideo(module.id, {
        ...values,
        bunnyVideoId,
      })
      
      setDialogOpen(false)
      form.reset()
      onVideoCreated?.()
    } catch (err) {
      setError(err.message || 'Unable to add video')
    } finally {
      setSaving(false)
    }
  }

  // Placeholder for Bunny.net upload preserved as requested
  const mockUploadToBunny = async (file) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const fakeId = `bunny_${Date.now()}_${file?.name || 'video'}`
        resolve({ bunnyVideoId: fakeId })
      }, 400)
    })
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <DialogFooter>
                <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Spinner size="sm" className="border-t-white" label="Saving" /> : null}
                  <span className={saving ? 'sr-only' : ''}>Save Video</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {module.videos?.length ? (
          module.videos.map((video) => (
            <div
              key={video.id}
              className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm"
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

