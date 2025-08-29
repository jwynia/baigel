'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, File, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFilesAdded: (files: File[]) => void
  maxFiles?: number
  maxSize?: number // in bytes
  acceptedTypes?: string[]
  disabled?: boolean
}

export function FileUpload({
  onFilesAdded,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ['*'],
  disabled = false
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<Array<{ file: File; progress: number; id: string }>>([])
  const [errors, setErrors] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const validateFiles = useCallback((files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = []
    const errors: string[] = []

    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`)
      return { valid, errors }
    }

    files.forEach(file => {
      // Check file size
      if (file.size > maxSize) {
        errors.push(`File size for "${file.name}" exceeds ${formatFileSize(maxSize)}`)
        return
      }

      // Check file type
      if (acceptedTypes.length > 0 && !acceptedTypes.includes('*')) {
        const isValid = acceptedTypes.some(type => {
          if (type.endsWith('/*')) {
            const category = type.split('/')[0]
            return file.type.startsWith(category + '/')
          }
          return file.type === type
        })

        if (!isValid) {
          errors.push(`File type "${file.type}" is not supported`)
          return
        }
      }

      valid.push(file)
    })

    return { valid, errors }
  }, [maxFiles, maxSize, acceptedTypes])

  const simulateUpload = useCallback(async (files: File[]) => {
    const uploadingItems = files.map(file => ({
      file,
      progress: 0,
      id: Math.random().toString(36).substr(2, 9)
    }))

    setUploadingFiles(uploadingItems)

    // Simulate upload progress
    for (const item of uploadingItems) {
      // Simulate random failure (5% chance)
      const shouldFail = Math.random() < 0.05

      if (shouldFail) {
        setErrors(prev => [...prev, `Upload failed for "${item.file.name}"`])
        setUploadingFiles(prev => prev.filter(u => u.id !== item.id))
        continue
      }

      // Simulate progress over 2-5 seconds
      const duration = 2000 + Math.random() * 3000
      const steps = 20
      const increment = 100 / steps
      const stepDuration = duration / steps

      for (let i = 0; i <= steps; i++) {
        await new Promise(resolve => setTimeout(resolve, stepDuration))
        setUploadingFiles(prev =>
          prev.map(u =>
            u.id === item.id
              ? { ...u, progress: Math.min(100, i * increment) }
              : u
          )
        )
      }
    }

    // Complete uploads
    setUploadingFiles([])
    setSuccessMessage(`Successfully uploaded ${files.length} file(s)`)
    setTimeout(() => setSuccessMessage(''), 3000)
  }, [])

  const handleFileSelection = useCallback(async (files: File[]) => {
    if (disabled || files.length === 0) return

    setErrors([])
    setSuccessMessage('')

    const { valid, errors } = validateFiles(files)

    if (errors.length > 0) {
      setErrors(errors)
      return
    }

    if (valid.length > 0) {
      // Call the callback immediately
      onFilesAdded(valid)
      // Then simulate upload progress
      await simulateUpload(valid)
    }
  }, [disabled, validateFiles, onFilesAdded, simulateUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragOver(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    handleFileSelection(files)
  }, [disabled, handleFileSelection])

  const handleClick = useCallback(() => {
    if (disabled) return
    fileInputRef.current?.click()
  }, [disabled])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFileSelection(files)
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }, [handleFileSelection])

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          'relative border-2 border-dashed p-6 transition-colors cursor-pointer',
          isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Button
          variant="ghost"
          className="w-full h-auto p-6 flex flex-col items-center gap-3"
          onClick={handleClick}
          disabled={disabled}
          aria-describedby="upload-description"
          aria-label="Choose files to upload"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">
              Drag & drop files here, or click to choose files
            </p>
            <p className="text-xs text-muted-foreground mt-1" id="upload-description">
              Maximum {maxFiles} files, up to {formatFileSize(maxSize)} each
            </p>
          </div>
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleInputChange}
          accept={acceptedTypes.join(',')}
          aria-label="Choose files to upload"
        />
      </Card>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map(({ file, progress, id }) => (
            <div key={id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-background rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-100 border border-green-200 rounded-lg text-green-800 text-sm" role="status" aria-live="polite">
          {successMessage}
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-red-100 border border-red-200 rounded-lg text-red-800 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}