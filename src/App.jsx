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
import { TestList } from './pages/tests/TestList'
import { TestForm } from './pages/tests/TestForm'
import { QuestionManager } from './pages/tests/QuestionManager'
import { TestAttempts } from './pages/tests/TestAttempts'

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
            <Route path="tests" element={<TestList />} />
            <Route path="tests/new" element={<TestForm />} />
            <Route path="tests/:id/edit" element={<TestForm />} />
            <Route path="tests/:id/questions" element={<QuestionManager />} />
            <Route path="tests/:id/attempts" element={<TestAttempts />} />
            <Route path="students" element={<Students />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
