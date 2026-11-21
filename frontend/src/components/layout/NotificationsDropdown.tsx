import React, { useEffect, useState } from 'react'
import { BellIcon } from '@/assets/svg/Icons'
import { useAuthStore } from '@/store/authStore'
import api from '@/services/api'
import { useNavigate } from 'react-router-dom'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  is_read: boolean
  link: string | null
}

export const NotificationsDropdown = () => {
  const { user } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return

    // Load initial notifications
    api.get<Notification[]>('/notifications/').then((res) => {
      setNotifications(res.data)
      setUnreadCount(res.data.filter(n => !n.is_read).length)
    }).catch(console.error)

    // Setup WebSocket
    const token = localStorage.getItem('access_token') // usually we'd pass token as query param
    const wsUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('http', 'ws')
    const ws = new WebSocket(`${wsUrl}/notifications/ws/${user.id}`)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as Notification
      setNotifications((prev) => [data, ...prev])
      setUnreadCount((prev) => prev + 1)
    }

    return () => ws.close()
  }, [user])

  const handleRead = async (id: number, link: string | null) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications((prev) => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount((prev) => Math.max(0, prev - 1))
      if (link) {
        setIsOpen(false)
        navigate(link)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 text-[10px] flex items-center justify-center font-bold text-white bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
            {unreadCount > 0 && (
              <span onClick={handleMarkAllRead} className="text-xs text-blue-500 hover:text-blue-600 cursor-pointer font-medium">Mark all read</span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">No notifications yet.</div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleRead(notif.id, notif.link)}
                  className={`p-3 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!notif.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  <p className={`text-sm ${!notif.is_read ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
