import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Form'
import { BrainIcon, AIIcon } from '@/assets/svg/Icons'
import toast from 'react-hot-toast'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

type LoginValues = z.infer<typeof loginSchema>

export const LoginPage = () => {
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginValues) => {
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid credentials. Try admin@company.com / password'
      if (typeof msg === 'string') {
        toast.error(msg)
      } else if (Array.isArray(msg)) {
        toast.error(msg[0]?.msg || 'Validation Error')
      } else {
        toast.error('An error occurred during login')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 font-sans">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-glow mb-4">
            <BrainIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Intern AI Platform</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="admin@company.com"
              {...register('email')}
              error={errors.email?.message}
              className="!bg-white/10 !border-white/20 !text-white placeholder:!text-slate-500"
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
              className="!bg-white/10 !border-white/20 !text-white"
            />
            <Button
              type="submit"
              loading={isLoading}
              className="w-full !py-3 !text-base"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-300 font-medium mb-2 flex items-center gap-1.5">
              <AIIcon className="h-3.5 w-3.5" /> Demo Credentials
            </p>
            <div className="space-y-1 text-xs text-slate-400">
              <p>admin@company.com — <span className="text-slate-300">Admin access</span></p>
              <p>hr@company.com — <span className="text-slate-300">HR access</span></p>
              <p className="mt-1 text-slate-500">Password: <code className="text-blue-300">password</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
