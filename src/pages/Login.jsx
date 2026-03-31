import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Spinner } from '../components/ui/spinner'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Admin ID is required'),
  password: z.string().min(4),
})

export const Login = () => {
  const { login, error, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState('')

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values) => {
    setFormError('')
    const result = await login(values.email, values.password)
    if (result.success) {
      const redirectPath = location.state?.from?.pathname || '/'
      navigate(redirectPath, { replace: true })
    } else {
      setFormError(result.message || 'Unable to sign in')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Use the provided admin credentials to access the panel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Admin ID</Label>
              <Input
                id="email"
                type="text"
                placeholder="Admin ID"
                {...form.register('email')}
              />
              {form.formState.errors.email?.message && (
                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...form.register('password')}
              />
              {form.formState.errors.password?.message && (
                <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
              )}
            </div>
            {(formError || error) && (
              <p className="text-sm text-red-600">{formError || error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner size="sm" className="border-t-white" label="Signing in" /> : null}
              <span className={loading ? 'sr-only' : ''}>Sign In</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
