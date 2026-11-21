import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { DocumentIcon } from '@/assets/svg/Icons'

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  accept?: Record<string, string[]>
  maxSize?: number // bytes
  label?: string
  selectedFile?: File | null
}

export const FileUpload = ({ 
  onFileSelect, 
  accept = { 'application/pdf': ['.pdf'], 'application/msword': ['.doc', '.docx'] },
  maxSize = 5 * 1024 * 1024, // 5MB
  label = "Upload File",
  selectedFile
}: FileUploadProps) => {
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
  }, [onFileSelect])

  const [preview, setPreview] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreview(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    }
    setPreview(null)
  }, [selectedFile])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false
  })

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <div 
        {...getRootProps()} 
        className={`
          flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer
          transition-all duration-200
          ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'}
          ${isDragReject ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
          hover:bg-slate-100 dark:hover:bg-slate-800
        `}
      >
        <input {...getInputProps()} />
        {preview && selectedFile?.type.startsWith('image/') ? (
          <img src={preview} alt="Preview" className="h-full w-full object-contain p-2 rounded-xl" />
        ) : preview && selectedFile?.type === 'application/pdf' ? (
          <iframe src={`${preview}#toolbar=0&navpanes=0&scrollbar=0`} className="h-full w-full rounded-xl p-1" title="PDF Preview" />
        ) : selectedFile ? (
          <>
            <DocumentIcon className={`h-8 w-8 mb-2 ${isDragActive ? 'text-indigo-500' : 'text-slate-400'}`} />
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 text-center px-4 truncate w-full">
              {selectedFile.name}
            </p>
          </>
        ) : (
          <>
            <DocumentIcon className={`h-8 w-8 mb-2 ${isDragActive ? 'text-indigo-500' : 'text-slate-400'}`} />
            <div className="text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-indigo-500">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                PDF, DOC, DOCX, JPG, PNG up to {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
