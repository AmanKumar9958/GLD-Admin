import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Spinner } from '../../components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { deleteCourse, fetchCourses } from '../../lib/firestore'

export const CourseList = () => {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCourses = async () => {
    try {
      setLoading(true)
      const data = await fetchCourses()
      setCourses(data)
    } catch (err) {
      setError(err.message || 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const handleDelete = async (courseId) => {
    const shouldDelete = window.confirm('Delete this course?')
    if (!shouldDelete) return

    await deleteCourse(courseId)
    loadCourses()
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center justify-between gap-4 sm:flex-row sm:gap-2">
        <div>
          <CardTitle>Courses</CardTitle>
          <p className="text-sm text-gray-600">Manage all available courses.</p>
        </div>
        <Button onClick={() => navigate('/courses/new')}>Create New Course</Button>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && courses.length === 0 && (
          <p className="text-sm text-gray-600">No courses found. Create your first course.</p>
        )}

        {!loading && courses.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>{course.category}</TableCell>
                  <TableCell>{course.instructorName}</TableCell>
                  <TableCell>${Number(course.price || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(course.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
