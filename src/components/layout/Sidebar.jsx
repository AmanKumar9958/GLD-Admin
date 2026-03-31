import { BookOpen, Home, Settings, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'

const links = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export const Sidebar = () => {
  return (
    <aside className="flex w-56 flex-col border-r border-gray-200 bg-white p-4">
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
    </aside>
  )
}
