import React, { useState, useRef, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BrainIcon } from '@/assets/svg/Icons'
import { aiApi, candidatesApi, departmentsApi } from '@/services/api'
import toast from 'react-hot-toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_PROMPTS = [
  { label: '🏆 Top candidates', query: 'Show me the top 5 candidates by AI score with their skills' },
  { label: '📧 Write acceptance email', query: 'Write a professional acceptance email for an intern position' },
  { label: '❌ Write rejection email', query: 'Write a professional and empathetic rejection email for a candidate' },
  { label: '💼 Interview questions', query: 'Generate 5 general technical interview questions for a software engineering intern' },
  { label: '📊 Candidate summary', query: 'What is the current distribution of candidates by status?' },
  { label: '🎯 Best for Data Science', query: 'Who are the best candidates for a Data Science department?' },
]

const SearchableCandidateSelect = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['candidates', 'dropdown'],
    queryFn: () => candidatesApi.list({ size: 500 }).then(res => res.data)
  })

  const candidates = data?.items || []

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filtered = candidates.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  const selectedCandidate = candidates.find(c => String(c.id) === value)
  const displayText = value === '' ? 'All Candidates' : selectedCandidate ? `${selectedCandidate.first_name} ${selectedCandidate.last_name}` : 'Unknown'

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className="text-xs w-48 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer flex justify-between items-center"
        onClick={() => { setIsOpen(!isOpen); setSearch('') }}
      >
        <span className="truncate">{displayText}</span>
        <span className="text-[10px]">▼</span>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg right-0 overflow-hidden flex flex-col max-h-64">
          <input
            autoFocus
            type="text"
            placeholder="Search candidate..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs p-2 border-b border-slate-100 dark:border-slate-700 bg-transparent outline-none text-slate-900 dark:text-white"
          />
          <div className="overflow-y-auto flex-1">
            <div 
              className="px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer text-slate-700 dark:text-slate-300"
              onClick={() => { onChange(''); setIsOpen(false) }}
            >
              All Candidates
            </div>
            {filtered.map(c => (
              <div 
                key={c.id}
                className="px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer text-slate-700 dark:text-slate-300 truncate"
                onClick={() => { onChange(String(c.id)); setIsOpen(false) }}
              >
                {c.first_name} {c.last_name}
              </div>
            ))}
            {isLoading && (
              <div className="px-3 py-2 text-xs text-slate-400">Loading...</div>
            )}
            {isError && (
              <div className="px-3 py-2 text-xs text-red-400">Failed to load candidates.</div>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-slate-400">No candidates found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const SearchableDepartmentSelect = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['departments', 'dropdown'],
    queryFn: () => departmentsApi.list({ size: 100 }).then(res => res.data)
  })

  const items = data?.items || []

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filtered = items.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  const selected = items.find(d => String(d.id) === value)
  const displayText = value === '' ? 'All Departments' : selected ? selected.name : 'Unknown'

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className="text-xs w-48 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer flex justify-between items-center"
        onClick={() => { setIsOpen(!isOpen); setSearch('') }}
      >
        <span className="truncate">{displayText}</span>
        <span className="text-[10px]">▼</span>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg right-0 overflow-hidden flex flex-col max-h-64">
          <input
            autoFocus
            type="text"
            placeholder="Search department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs p-2 border-b border-slate-100 dark:border-slate-700 bg-transparent outline-none text-slate-900 dark:text-white"
          />
          <div className="overflow-y-auto flex-1">
            <div 
              className="px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer text-slate-700 dark:text-slate-300"
              onClick={() => { onChange(''); setIsOpen(false) }}
            >
              All Departments
            </div>
            {filtered.map(d => (
              <div 
                key={d.id}
                className="px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer text-slate-700 dark:text-slate-300 truncate"
                onClick={() => { onChange(String(d.id)); setIsOpen(false) }}
              >
                {d.name}
              </div>
            ))}
            {isLoading && (
              <div className="px-3 py-2 text-xs text-slate-400">Loading...</div>
            )}
            {isError && (
              <div className="px-3 py-2 text-xs text-red-400">Failed to load.</div>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-slate-400">No departments found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const renderMarkdown = (text: string) => {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    
  html = html.replace(/```(?:html|json|js|ts|python|bash)?\n?([\s\S]*?)```/g, '<pre class="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-xs my-2 border border-slate-700"><code>$1</code></pre>')
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-pink-600 dark:text-pink-400 font-mono text-xs">$1</code>')
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold mt-3 mb-1">$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-4 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-black mt-5 mb-2">$1</h1>')
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-3 py-1 my-2 bg-slate-50 dark:bg-slate-800/50 italic text-slate-600 dark:text-slate-400">$1</blockquote>')
  html = html.replace(/^[-\*]\s(.*)$/gim, '<li class="ml-4 list-disc">$1</li>')
  html = html.replace(/^\d+\.\s(.*)$/gim, '<li class="ml-4 list-decimal">$1</li>')
  html = html.replace(/\n/g, '<br/>')
  
  html = html.replace(/<\/h([1-3])><br\/>/g, '</h$1>')
  html = html.replace(/<\/pre><br\/>/g, '</pre>')
  html = html.replace(/<\/li><br\/>/g, '</li>')

  return <div dangerouslySetInnerHTML={{ __html: html }} className="space-y-1" />
}

export const AssistantPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "👋 Hello! I'm your HR AI Assistant. I can help you:\n\n• Find and compare the best candidates\n• Generate interview questions\n• Write acceptance or rejection emails\n• Summarize candidate profiles\n• Answer any recruitment-related question\n\nWhat would you like to know?",
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [candidateId, setCandidateId] = useState<string>('')
  const [departmentId, setDepartmentId] = useState<string>('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (query: string) => {
    if (!query.trim() || loading) return

    const userMsg: Message = { role: 'user', content: query, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await aiApi.chat(
        query,
        undefined,
        candidateId ? parseInt(candidateId) : undefined,
        departmentId ? parseInt(departmentId) : undefined
      )
      const responseText = res.data?.data || res.data?.message || String(res.data)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      }])
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || 'Failed to get a response. Please check your AI configuration in Settings.'
      toast.error(errMsg)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${errMsg}`,
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared. How can I help you?",
      timestamp: new Date(),
    }])
  }

  return (
    <Layout title="HR AI Assistant">
      <div className="max-w-4xl mx-auto flex flex-col gap-4 h-[calc(100vh-140px)]">

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.label}
              onClick={() => sendMessage(p.query)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30
                hover:border-blue-400 transition-all text-slate-700 dark:text-slate-300
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {p.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <SearchableDepartmentSelect value={departmentId} onChange={setDepartmentId} />
            <SearchableCandidateSelect value={candidateId} onChange={setCandidateId} />
          </div>
        </div>

        {/* Chat window */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    renderMarkdown(msg.content)
                  ) : (
                    msg.content
                  )}
                  <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </CardContent>

          {/* Input area */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 flex gap-3">
            <textarea
              className="flex-1 resize-none bg-slate-50 dark:bg-slate-900 border border-slate-200
                dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none
                focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white
                placeholder-slate-400 transition-all"
              rows={2}
              placeholder="Ask anything about candidates, departments, or generate emails… (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => sendMessage(input)}
                loading={loading}
                disabled={!input.trim() || loading}
                icon={<BrainIcon className="h-4 w-4" />}
              >
                Send
              </Button>
              <Button variant="outline" size="sm" onClick={clearChat} disabled={loading}>
                Clear
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
