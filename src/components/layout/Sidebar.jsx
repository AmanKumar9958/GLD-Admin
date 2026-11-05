import { BookOpen, Home, Settings, Users, ClipboardList, Globe, ExternalLink } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'

const links = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/tests', label: 'Tests', icon: ClipboardList },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export const Sidebar = () => {
  return (
    <aside className="flex w-56 flex-col justify-between border-r border-gray-200 bg-white p-4">
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100',
                  isActive && 'bg-gray-900 text-white hover:bg-gray-900',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-gray-100 pt-4">
        <a
          href="https://gldianknights.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-2xs group"
          title="Open Main Website in new tab"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <span>Main Website</span>
          </div>
          <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-gray-600" />
        </a>
      </div>
    </aside>
  )
}

export default Sidebar
