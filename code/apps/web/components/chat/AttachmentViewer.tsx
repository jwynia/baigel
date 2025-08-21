'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Download, 
  X, 
  File, 
  Image, 
  Video, 
  Music, 
  FileText,
  ExternalLink,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Attachment } from '@/lib/types'

interface AttachmentViewerProps {
  attachment: Attachment
  onDownload?: () => void
  onRemove?: () => void
}

export function AttachmentViewer({ attachment, onDownload, onRemove }: AttachmentViewerProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [mediaError, setMediaError] = useState(false)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(!attachment.thumbnail)

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = () => {
    if (attachment.type.startsWith('image/')) return Image
    if (attachment.type.startsWith('video/')) return Video
    if (attachment.type.startsWith('audio/')) return Music
    if (attachment.type === 'application/pdf' || attachment.type.includes('document')) return FileText
    return File
  }

  const getFileTypeLabel = () => {
    if (attachment.type.startsWith('image/')) return 'Image file'
    if (attachment.type.startsWith('video/')) return 'Video file'
    if (attachment.type.startsWith('audio/')) return 'Audio file'
    if (attachment.type === 'application/pdf') return 'PDF document'
    if (attachment.type.includes('document')) return 'Document file'
    return 'File'
  }

  const isImage = attachment.type.startsWith('image/')
  const isVideo = attachment.type.startsWith('video/')
  const isAudio = attachment.type.startsWith('audio/')
  const isPdf = attachment.type === 'application/pdf'
  const FileIcon = getFileIcon()

  const handleDownload = useCallback(async () => {
    if (!onDownload || isDownloading) return

    setIsDownloading(true)
    setDownloadProgress(0)

    // Simulate download progress
    const duration = 2000 + Math.random() * 1000
    const steps = 20
    const increment = 100 / steps
    const stepDuration = duration / steps

    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration))
      setDownloadProgress(Math.min(100, i * increment))
    }

    onDownload()
    setIsDownloading(false)
    setDownloadProgress(null)
  }, [onDownload, isDownloading])

  const handleRemove = useCallback(() => {
    if (!onRemove) return
    setRemoveConfirmOpen(true)
  }, [onRemove])

  const confirmRemove = useCallback(() => {
    if (onRemove) {
      onRemove()
    }
    setRemoveConfirmOpen(false)
  }, [onRemove])

  const handleImageClick = useCallback(() => {
    if (isImage && !imageError) {
      setLightboxOpen(true)
    }
  }, [isImage, imageError])

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleMediaError = useCallback(() => {
    setMediaError(true)
  }, [])

  // Simulate preview generation
  React.useEffect(() => {
    if (!attachment.thumbnail && isGeneratingPreview) {
      const timer = setTimeout(() => {
        setIsGeneratingPreview(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [attachment.thumbnail, isGeneratingPreview])

  return (
    <>
      <Card className="p-3 max-w-sm">
        <div className="flex items-start gap-3">
          {/* Thumbnail/Preview */}
          <div className="flex-shrink-0">
            {isImage && !imageError && (attachment.thumbnail || attachment.url) ? (
              <div 
                className="relative w-12 h-12 rounded cursor-pointer overflow-hidden"
                onClick={handleImageClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleImageClick()
                  }
                }}
              >
                <img
                  src={attachment.thumbnail || attachment.url}
                  alt={`${attachment.name} thumbnail`}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              </div>
            ) : isVideo && !mediaError ? (
              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                <Video className="h-6 w-6 text-muted-foreground" />
              </div>
            ) : isAudio && !mediaError ? (
              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                <Music className="h-6 w-6 text-muted-foreground" />
              </div>
            ) : isGeneratingPreview ? (
              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                <FileIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate" title={attachment.name}>
              {attachment.name}
            </h4>
            <p className="text-xs text-muted-foreground">
              {getFileTypeLabel()} • {formatFileSize(attachment.size)}
            </p>

            {/* Error States */}
            {imageError && isImage && (
              <p className="text-xs text-red-600 mt-1">Preview unavailable</p>
            )}
            {mediaError && (isVideo || isAudio) && (
              <p className="text-xs text-red-600 mt-1">Media unavailable</p>
            )}
            {isGeneratingPreview && (
              <p className="text-xs text-muted-foreground mt-1">Generating preview...</p>
            )}

            {/* Download Progress */}
            {isDownloading && downloadProgress !== null && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Downloading...</span>
                  <span>{Math.round(downloadProgress)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1 mt-1">
                  <div
                    className="bg-primary h-1 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                    role="progressbar"
                    aria-valuenow={downloadProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            {onDownload && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDownload}
                disabled={isDownloading}
                aria-label={`Download ${attachment.name}`}
              >
                {isDownloading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
              </Button>
            )}
            {onRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRemove}
                aria-label={`Remove ${attachment.name}`}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Media Players */}
        {isVideo && !mediaError && (
          <div className="mt-3">
            <video
              controls
              className="w-full rounded"
              onError={handleMediaError}
              aria-label="Video player"
              role="application"
            >
              <source src={attachment.url} type={attachment.type} />
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {isAudio && !mediaError && (
          <div className="mt-3 space-y-2">
            <div className="h-8 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
              Audio waveform visualization
            </div>
            <audio
              controls
              className="w-full h-8"
              onError={handleMediaError}
              aria-label="Audio player"
              role="application"
            >
              <source src={attachment.url} type={attachment.type} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        )}

        {isPdf && (
          <div className="mt-3 space-y-2">
            <div className="h-20 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
              PDF preview placeholder
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => window.open(attachment.url, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              Open in new tab
            </Button>
          </div>
        )}
      </Card>

      {/* Image Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-full p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="truncate">{attachment.name}</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4">
            <img
              src={attachment.url}
              alt={`Full size ${attachment.name}`}
              className="w-full h-auto max-h-[70vh] object-contain rounded"
            />
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close lightbox"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
      <Dialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Removal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm">
                  Are you sure you want to remove "{attachment.name}"?
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setRemoveConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmRemove}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}