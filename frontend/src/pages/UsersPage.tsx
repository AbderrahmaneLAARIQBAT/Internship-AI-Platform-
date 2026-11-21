import React, { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Form'
import { StatusBadge } from '@/components/ui/Badge'
import { TrashIcon, PlusIcon } from '@/assets/svg/Icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  role: z.enum(['admin', 'hr'])
})

type UserFormValues = z.infer<typeof userSchema>

export const UsersPage = () => {
  const { user: currentUser } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  // Redirect if not admin
  if (currentUser?.role !== 'admin') {
    navigate('/dashboard')
    return null
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then(res => res.data)
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'hr' }
  })

  const createMutation = useMutation({
    mutationFn: (data: UserFormValues) => usersApi.create(data),
    onSuccess: () => {
      toast.success('User created successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowForm(false)
      reset()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to create user')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      toast.success('User deleted')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to delete user')
    }
  })

  const onSubmit = (data: UserFormValues) => {
    createMutation.mutate(data)
  }

  return (
    <Layout title="User Management">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Internal Users</h2>
            <p className="text-sm text-slate-500">Manage Admins and HR accounts.</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} icon={<PlusIcon className="w-4 h-4" />}>
            {showForm ? 'Cancel' : 'Add User'}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Full Name" {...register('full_name')} error={errors.full_name?.message} />
                  <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
                  <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                    <select
                      {...register('role')}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="hr">HR Representative</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" loading={createMutation.isPending}>Save User</Button>
                </div>
              </form>
            </div>
          </Card>
        )}

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
                ) : (
                  users?.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/25 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
                            {u.full_name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{u.full_name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 capitalize">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.is_active ? (
                          <span className="text-emerald-500 font-medium text-xs">Active</span>
                        ) : (
                          <span className="text-rose-500 font-medium text-xs">Inactive</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => {
                              if (confirm('Delete this user?')) deleteMutation.mutate(u.id)
                            }}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
