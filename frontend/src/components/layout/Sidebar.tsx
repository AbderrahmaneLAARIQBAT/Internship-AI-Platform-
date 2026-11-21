import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  DashboardIcon, UsersIcon, DepartmentIcon, AnalyticsIcon, AIIcon,
  ApplicationIcon, SettingsIcon, MenuIcon, XIcon, BrainIcon,
} from '@/assets/svg/Icons'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  { to: '/dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
  { to: '/candidates', icon: <UsersIcon />, label: 'Candidates' },
  { to: '/import', icon: <UsersIcon />, label: 'Import' },
  { to: '/departments', icon: <DepartmentIcon />, label: 'Departments' },
  { to: '/applications', icon: <ApplicationIcon />, label: 'Applications' },
  { to: '/analytics', icon: <AnalyticsIcon />, label: 'Analytics' },
  { to: '/assistant', icon: <BrainIcon />, label: 'AI Assistant' },
  { to: '/settings', icon: <SettingsIcon />, label: 'Settings' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const { user } = useAuthStore()
  
  const items = [...navItems]
  if (user?.role === 'admin') {
    items.push({ to: '/users', icon: <UsersIcon />, label: 'Users' })
    items.push({ to: '/audit-log', icon: <DashboardIcon />, label: 'Audit Log' })
  }

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800
          border-r border-white/5 shadow-2xl
          transition-all duration-300 ease-in-out
          ${collapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-glow flex-shrink-0">
            <BrainIcon className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-white font-bold text-sm leading-tight">Intern AI</h1>
              <p className="text-slate-400 text-xs">Platform</p>
            </div>
          )}
          <button
            onClick={onToggle}
            className="ml-auto p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors hidden md:block"
          >
            <MenuIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 group relative
                ${isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-400 rounded-r-full" />
                  )}
                  <span className={`flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-400' : ''}`}>
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* AI Badge */}
        {!collapsed && (
          <div className="px-4 pb-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AIIcon className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-medium text-blue-300">AI-Powered</span>
              </div>
              <p className="text-xs text-slate-400">Smart matching & CV analysis active</p>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
