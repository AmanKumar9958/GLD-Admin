import { supabase } from '../lib/supabase'

/**
 * COURSES
 */
export async function fetchCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('title', { ascending: true })

  if (error) throw error
  return data
}

export async function fetchCourseWithRelations(courseId) {
  // Fetch course details
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (courseError) throw courseError

  // Fetch modules with their videos
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select(`
      *,
      videos (*)
    `)
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (modulesError) throw modulesError

  return {
    ...course,
    modules: modules.map(m => ({
      ...m,
      videos: (m.videos || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    }))
  }
}

export async function createCourse(payload) {
  const { data, error } = await supabase
    .from('courses')
    .insert([{
      title: payload.title,
      category: payload.category,
      price: Number(payload.price) || 0,
      instructor_name: payload.instructorName,
      is_published: !!payload.isPublished,
      thumbnail_url: payload.thumbnailUrl || null
    }])
    .select()
    .single()

  if (error) throw error
  return data.id
}

export async function updateCourse(courseId, payload) {
  const updateData = {
    title: payload.title,
    category: payload.category,
    price: Number(payload.price) || 0,
    instructor_name: payload.instructorName,
    is_published: !!payload.isPublished,
  }

  if (payload.thumbnailUrl) {
    updateData.thumbnail_url = payload.thumbnailUrl
  }

  const { error } = await supabase
    .from('courses')
    .update(updateData)
    .eq('id', courseId)

  if (error) throw error
}

export async function deleteCourse(courseId) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId)

  if (error) throw error
}

/**
 * MODULES
 */
export async function fetchModules(courseId) {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data
}

export async function createModule(courseId, payload) {
  const { data, error } = await supabase
    .from('modules')
    .insert([{
      course_id: courseId,
      title: payload.title,
      order_index: Number(payload.orderIndex) || 0
    }])
    .select()
    .single()

  if (error) throw error
  return data.id
}

/**
 * VIDEOS
 */
export async function createVideo(moduleId, payload) {
  const { data, error } = await supabase
    .from('videos')
    .insert([{
      module_id: moduleId,
      title: payload.title,
      duration: Number(payload.duration) || 0,
      is_preview: !!payload.isPreview,
      bunny_video_id: payload.bunnyVideoId
    }])
    .select()
    .single()

  if (error) throw error
  return data.id
}

/**
 * STORAGE (Thumbnails)
 */
export async function uploadThumbnail(file) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
  const filePath = `course-thumbnails/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('thumbnails')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('thumbnails')
    .getPublicUrl(filePath)

  return publicUrl
}

/**
 * STUDENTS / USERS
 */
export async function fetchStudents() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .neq('role', 'admin')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchDashboardStats() {
  const [coursesCount, usersCount] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).neq('role', 'admin')
  ])

  if (coursesCount.error) throw coursesCount.error
  if (usersCount.error) throw usersCount.error

  return {
    courses: coursesCount.count || 0,
    students: usersCount.count || 0
  }
}

