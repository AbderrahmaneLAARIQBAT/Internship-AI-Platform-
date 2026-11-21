import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { BrainIcon, AIIcon, UsersIcon, AnalyticsIcon, DepartmentIcon, CheckIcon } from '@/assets/svg/Icons'

const features = [
  {
    icon: <AIIcon className="h-6 w-6" />,
    title: 'AI-Powered CV Analysis',
    desc: 'Automatically extract skills, education, and contact information from PDF CVs using NLP.',
    color: 'blue',
  },
  {
    icon: <BrainIcon className="h-6 w-6" />,
    title: 'Intelligent Matching',
    desc: 'Our weighted scoring engine matches candidates to departments based on skills and profile.',
    color: 'violet',
  },
  {
    icon: <UsersIcon className="h-6 w-6" />,
    title: 'Candidate Management',
    desc: 'Full lifecycle management from application to acceptance with status tracking.',
    color: 'emerald',
  },
  {
    icon: <AnalyticsIcon className="h-6 w-6" />,
    title: 'Real-time Analytics',
    desc: 'Dashboard with charts showing candidate distribution, skill trends, and department capacity.',
    color: 'orange',
  },
]

const stats = [
  { label: 'Candidates Processed', value: '2,400+' },
  { label: 'Departments Served', value: '50+' },
  { label: 'Match Accuracy', value: '92%' },
  { label: 'Time Saved', value: '75%' },
]

const colorMap: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  violet: 'from-violet-500 to-violet-600 text-violet-600 bg-violet-50 dark:bg-violet-900/20',
  emerald: 'from-emerald-500 to-emerald-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  orange: 'from-orange-500 to-orange-600 text-orange-600 bg-orange-50 dark:bg-orange-900/20',
}

export const LandingPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white overflow-x-hidden">
      {/* Hero */}
      <div className="relative min-h-screen flex flex-col">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-blue-600/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
        </div>

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-glow">
              <BrainIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">Intern AI Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')} className="!text-slate-300">
              Sign In
            </Button>
            <Button onClick={() => navigate('/register')}>Get Started</Button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm mb-8">
            <AIIcon className="h-4 w-4" />
            AI-Powered Internship Management
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Smart Matching
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              for Internship Success
            </span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed">
            AI-driven platform for managing internship applications, extracting skills from CVs,
            and intelligently matching candidates to the right departments.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" onClick={() => navigate('/register')} className="!px-8">
              Start for Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="!px-8 !border-slate-600 !text-slate-300">
              View Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 w-full max-w-3xl">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  {s.value}
                </div>
                <div className="text-sm text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Everything You Need</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            A complete platform for managing the full internship lifecycle with AI superpowers.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => {
            const colors = colorMap[f.color].split(' ')
            return (
              <div key={f.title} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-200 group">
                <div className={`w-12 h-12 rounded-2xl ${colors[2]} ${colors[3] || ''} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <span className={colors[2]}>{f.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-slate-400 mb-8">Launch your AI-powered internship platform in minutes.</p>
          <Button size="lg" onClick={() => navigate('/register')} className="!px-10">
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-slate-500 text-sm">
        <p>© 2025 Intern AI Platform · Built for PFE Project · FastAPI + React + PostgreSQL</p>
      </footer>
    </div>
  )
}
