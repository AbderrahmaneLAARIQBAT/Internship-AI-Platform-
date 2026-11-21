import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  search?: string
  onSearch?: (val: string) => void
}

export const Layout = ({ children, title, search, onSearch }: LayoutProps) => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <div
        className={`transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}
      >
        <Navbar
          onMenuToggle={() => setCollapsed(!collapsed)}
          title={title}
          search={search}
          onSearch={onSearch}
        />
        <main className="p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
