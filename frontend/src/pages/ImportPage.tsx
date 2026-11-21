import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { ImportSummary } from '@/types'
import { intakeApi } from '@/services/api'
import toast from 'react-hot-toast'

const SAMPLE_CSV = `first_name,last_name,email,phone,university,degree,graduation_year,linkedin_url,github_url
John,Smith,john.smith@example.com,+1234567890,MIT,Master Computer Science,2024,https://linkedin.com/in/johnsmith,https://github.com/johnsmith
Sara,Ben Ali,sara.benali@example.com,,University of Algiers,Bachelor Software Engineering,2025,,`

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-2xl p-5 ${color} flex flex-col gap-1`}>
      <span className="text-3xl font-bold">{value}</span>
      <span className="text-sm font-medium opacity-80">{label}</span>
    </div>
  )
}

export const ImportPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportSummary | null>(null)

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a .csv file')
      return
    }
    setSelectedFile(file)
    setResult(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleImport = async () => {
    if (!selectedFile) return
    setLoading(true)
    try {
      const res = await intakeApi.importCsv(selectedFile)
      setResult(res.data)
      if (res.data.imported > 0) {
        toast.success(`Successfully imported ${res.data.imported} candidates!`)
      } else if (res.data.skipped > 0 && res.data.imported === 0) {
        toast('All candidates were already in the system.', { icon: 'ℹ️' })
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_candidates.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Layout title="Import Candidates">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header info */}
        <Card>
          <CardHeader>
            <CardTitle>Bulk CSV Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Import multiple candidates at once from a CSV file. Duplicate emails are automatically
              skipped. AI analysis will run in the background for newly imported candidates.
            </p>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 text-xs font-mono text-slate-600 dark:text-slate-400 overflow-x-auto">
              <strong className="text-slate-900 dark:text-white">Required columns:</strong>{' '}
              first_name, last_name, email
              <br />
              <strong className="text-slate-900 dark:text-white">Optional:</strong>{' '}
              phone, university, degree, graduation_year, linkedin_url, github_url, notes
            </div>
            <Button variant="outline" size="sm" onClick={downloadSample}>
              Download Sample CSV
            </Button>
          </CardContent>
        </Card>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
            ${dragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : selectedFile
                ? 'border-green-400 bg-green-50 dark:bg-green-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600'
            }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
          {selectedFile ? (
            <>
              <div className="text-4xl mb-3">📄</div>
              <p className="font-semibold text-green-700 dark:text-green-400">{selectedFile.name}</p>
              <p className="text-sm text-slate-500 mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB · Click to change
              </p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">📂</div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Drag & drop your CSV here
              </p>
              <p className="text-sm text-slate-400 mt-1">or click to browse</p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleImport}
            loading={loading}
            disabled={!selectedFile || loading}
            className="flex-1"
          >
            {loading ? 'Importing...' : 'Import Candidates'}
          </Button>
          {selectedFile && (
            <Button
              variant="outline"
              onClick={() => { setSelectedFile(null); setResult(null) }}
              disabled={loading}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  label="Total Processed"
                  value={result.total}
                  color="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <StatCard
                  label="Imported"
                  value={result.imported}
                  color="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                />
                <StatCard
                  label="Skipped (Duplicates)"
                  value={result.skipped}
                  color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                />
                <StatCard
                  label="Failed"
                  value={result.failed}
                  color="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                />
              </div>

              {result.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Errors</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm bg-red-50 dark:bg-red-950/20 rounded-lg p-3"
                      >
                        <span className="text-red-500 font-bold flex-shrink-0">
                          Row {err.row}:
                        </span>
                        <span className="text-red-700 dark:text-red-400">{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.imported > 0 && (
                <Link to="/candidates">
                  <Button className="w-full">View All Candidates →</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
