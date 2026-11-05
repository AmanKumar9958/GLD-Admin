import { LogOut, Globe, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/button'

export const Header = () => {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <Link to="/" className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <span>GLD Admin Panel</span>
      </Link>
      <div className="flex items-center gap-3">
        <a
          href="https://gldianknights.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-2xs"
          title="Open https://gldianknights.com/ in new tab"
        >
          <Globe className="h-3.5 w-3.5 text-blue-600" />
          <span>Main Website</span>
          <ExternalLink className="h-3 w-3 text-gray-400" />
        </a>

        {user?.email && (
          <span className="hidden text-xs font-medium text-gray-500 sm:inline">
            {user.email}
          </span>
        )}

        <Button variant="ghost" size="sm" onClick={logout} className="gap-2 text-xs">
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </Button>
      </div>
    </header>
  )
}

export default Header
