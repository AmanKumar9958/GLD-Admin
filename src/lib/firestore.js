import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

function ensureDb() {
  if (!db) {
    throw new Error('Firebase is not configured. Please add Firebase env vars.')
  }
  return db
}

const coursesCollection = collection(db, 'courses')

export async function fetchCourses() {
  ensureDb()
  const q = query(coursesCollection, orderBy('title', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((courseDoc) => ({
    id: courseDoc.id,
    ...courseDoc.data(),
  }))
}

export async function fetchCourseWithRelations(courseId) {
  ensureDb()
  const courseDoc = await getDoc(doc(coursesCollection, courseId))
  if (!courseDoc.exists()) {
    return null
  }

  const modules = await fetchModulesWithVideos(courseId)

  return {
    id: courseDoc.id,
    ...courseDoc.data(),
    modules,
  }
}

export async function createCourse(payload) {
  ensureDb()
  const sanitized = {
    ...payload,
    price: Number(payload.price) || 0,
    isPublished: payload.isPublished ?? false,
  }

  const courseRef = await addDoc(coursesCollection, sanitized)
  return courseRef.id
}

export async function updateCourse(courseId, payload) {
  ensureDb()
  const courseRef = doc(coursesCollection, courseId)
  await updateDoc(courseRef, {
    ...payload,
    price: Number(payload.price) || 0,
    isPublished: payload.isPublished ?? false,
  })
}

export async function deleteCourse(courseId) {
  ensureDb()
  const courseRef = doc(coursesCollection, courseId)
  await deleteDoc(courseRef)
}

export async function fetchModulesWithVideos(courseId) {
  ensureDb()
  const modulesRef = collection(doc(coursesCollection, courseId), 'modules')
  const q = query(modulesRef, orderBy('orderIndex', 'asc'))
  const moduleSnapshot = await getDocs(q)

  const modules = await Promise.all(
    moduleSnapshot.docs.map(async (moduleDoc) => {
      const videosRef = collection(moduleDoc.ref, 'videos')
      const videosSnapshot = await getDocs(videosRef)
      const videos = videosSnapshot.docs.map((videoDoc) => ({
        id: videoDoc.id,
        ...videoDoc.data(),
      }))

      return { id: moduleDoc.id, ...moduleDoc.data(), videos }
    }),
  )

  return modules
}

export async function createModule(courseId, payload) {
  ensureDb()
  const modulesRef = collection(doc(coursesCollection, courseId), 'modules')
  const nextOrder = Number(payload.orderIndex) || Date.now()
  const moduleRef = await addDoc(modulesRef, {
    title: payload.title,
    orderIndex: nextOrder,
  })
  return moduleRef.id
}

export async function createVideo(courseId, moduleId, payload) {
  ensureDb()
  const videosRef = collection(
    doc(doc(coursesCollection, courseId), 'modules', moduleId),
    'videos',
  )

  const { file, ...rest } = payload
  const { bunnyVideoId } = await mockUploadToBunny(file)

  const videoPayload = {
    title: rest.title,
    duration: Number(rest.duration) || 0,
    isPreview: !!rest.isPreview,
    bunnyVideoId,
  }

  const videoRef = await addDoc(videosRef, videoPayload)
  return videoRef.id
}

export async function mockUploadToBunny(file) {
  // Placeholder for Bunny.net upload. Replace with real implementation later.
  return new Promise((resolve) => {
    setTimeout(() => {
      const fakeId = `bunny_${Date.now()}_${file?.name || 'video'}`
      resolve({ bunnyVideoId: fakeId })
    }, 400)
  })
}
