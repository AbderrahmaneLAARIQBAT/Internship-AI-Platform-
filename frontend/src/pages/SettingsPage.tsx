import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { SettingsIcon, ShieldIcon, BellIcon, GlobeIcon, LogoutIcon } from '@/assets/svg/Icons'
import { settingsApi } from '@/services/api'
import toast from 'react-hot-toast'

export const SettingsPage = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [darkMode, setDarkMode] = useState(false)

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.list().then(res => res.data),
  })

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string, value: string }) => settingsApi.update(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Setting updated successfully')
    },
    onError: () => toast.error('Failed to update setting')
  })

  const maintenanceSetting = settingsData?.find(s => s.key === 'maintenance_mode')?.value === 'true'

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  return (
    <Layout title="Settings">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <SettingsIcon className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl">
              {user?.full_name?.[0] || 'U'}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{user?.full_name}</h3>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <span className="inline-flex mt-1 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                {user?.role}
              </span>
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <GlobeIcon className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">Dark Mode</p>
                <p className="text-sm text-slate-500">Toggle dark/light interface</p>
              </div>
              <button
                onClick={() => {
                  setDarkMode(!darkMode)
                  document.documentElement.classList.toggle('dark')
                }}
                className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${darkMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">Language</p>
                <p className="text-sm text-slate-500">Interface language</p>
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">English</span>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <ShieldIcon className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400">JWT tokens secured with HS256</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400">Password hashed with bcrypt</p>
            </div>
          </div>
        </Card>

        {/* System Administration (Admin Only) */}
        {user?.role === 'admin' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-indigo-600 dark:text-indigo-400">System Administration</CardTitle>
                <SettingsIcon className="h-5 w-5 text-indigo-400" />
              </CardHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">Maintenance Mode</p>
                    <p className="text-sm text-slate-500">Temporarily disable access for non-admins</p>
                  </div>
                  <button
                    onClick={() => updateSettingMutation.mutate({ key: 'maintenance_mode', value: maintenanceSetting ? 'false' : 'true' })}
                    disabled={updateSettingMutation.isPending}
                    className={`relative w-12 h-6 rounded-full transition-colors ${maintenanceSetting ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${maintenanceSetting ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-emerald-600 dark:text-emerald-400">AI Configuration</CardTitle>
                <ShieldIcon className="h-5 w-5 text-emerald-400" />
              </CardHeader>
              <div className="space-y-4">
                <p className="text-sm text-slate-500 mb-4">Manage your AI API configurations dynamically. Keys are symmetrically encrypted at rest.</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">LLM Provider</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={settingsData?.find(s => s.key === 'llm_provider')?.value || 'gemini'}
                      onChange={(e) => updateSettingMutation.mutate({ key: 'llm_provider', value: e.target.value })}
                    >
                      <option value="gemini">Google Gemini</option>
                      <option value="openai">OpenAI</option>
                      <option value="custom">Custom (OpenAI Compatible)</option>
                    </select>
                  </div>
                  
                  {(settingsData?.find(s => s.key === 'llm_provider')?.value === 'custom') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Base URL</label>
                      <input
                        type="text"
                        placeholder="e.g. http://localhost:11434/v1"
                        defaultValue={settingsData?.find(s => s.key === 'llm_base_url')?.value || ''}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        onBlur={(e) => updateSettingMutation.mutate({ key: 'llm_base_url', value: e.target.value })}
                      />
                      <p className="text-xs text-slate-400 mt-1">Leave empty to use the provider's default URL.</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Model Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. gemini-1.5-pro, gpt-4o, llama3"
                      defaultValue={settingsData?.find(s => s.key === 'llm_model_name')?.value || ''}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      onBlur={(e) => updateSettingMutation.mutate({ key: 'llm_model_name', value: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API Key</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder={settingsData?.find(s => s.key === 'llm_api_key')?.value ? "sk-************" : "Enter API Key"}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value
                            if (val && !val.startsWith('sk-***')) {
                              updateSettingMutation.mutate({ key: 'llm_api_key', value: val })
                              ;(e.target as HTMLInputElement).value = ''
                            }
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Press Enter to save securely.</p>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Danger Zone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
          </CardHeader>
          <Button
            variant="danger"
            icon={<LogoutIcon className="h-4 w-4" />}
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </Card>
      </div>
    </Layout>
  )
}
