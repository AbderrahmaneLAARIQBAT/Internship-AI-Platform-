import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { SearchIcon, MenuIcon, LogoutIcon } from '@/assets/svg/Icons'
import { Input } from '@/components/ui/Form'
import { NotificationsDropdown } from './NotificationsDropdown'

interface NavbarProps {
  onMenuToggle: () => void
  search?: string
  onSearch?: (val: string) => void
  title?: string
}

export const Navbar = ({ onMenuToggle, search, onSearch, title }: NavbarProps) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U'

  return (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60">
      <div className="flex items-center gap-4 px-6 h-16">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        {/* Page title */}
        {title && (
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white hidden sm:block">
            {title}
          </h2>
        )}

        {/* Search */}
        {onSearch !== undefined && (
          <div className="flex-1 max-w-xs ml-4">
            <Input
              placeholder="Search..."
              icon={<SearchIcon className="h-4 w-4" />}
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="!py-2"
            />
          </div>
        )}

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <NotificationsDropdown />

          {/* User menu */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-700">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">
                {user?.full_name}
              </p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogoutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
