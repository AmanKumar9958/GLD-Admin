import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './components/layout/AdminLayout'
import { AuthProvider, ProtectedRoute } from './context/AuthContext'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Settings } from './pages/Settings'
import { Students } from './pages/Students'
import { CourseForm } from './pages/courses/CourseForm'
import { CourseList } from './pages/courses/CourseList'

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<CourseList />} />
            <Route path="courses/new" element={<CourseForm />} />
            <Route path="courses/:id" element={<CourseForm />} />
            <Route path="students" element={<Students />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
