import { LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/button'

export const Header = () => {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <Link to="/" className="text-lg font-semibold text-gray-900">
        GLD Admin Panel
      </Link>
      <div className="flex items-center gap-4">
        {user?.email && <span className="text-sm text-gray-600">{user.email}</span>}
        <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  )
}
