import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AttachmentViewer } from '@/components/chat/AttachmentViewer'

const mockAttachment = {
  id: 'att-123',
  name: 'test-image.jpg',
  type: 'image/jpeg',
  size: 1024,
  url: 'blob:test-url',
  thumbnail: 'data:image/jpeg;base64,test-thumbnail'
}

describe('AttachmentViewer Component', () => {
  const mockOnDownload = vi.fn()
  const mockOnRemove = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render attachment with basic info', () => {
      render(<AttachmentViewer attachment={mockAttachment} />)
      
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument()
      expect(screen.getByText(/1.*KB/i)).toBeInTheDocument()
    })

    it('should render download button when onDownload is provided', () => {
      render(<AttachmentViewer attachment={mockAttachment} onDownload={mockOnDownload} />)
      
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument()
    })

    it('should render remove button when onRemove is provided', () => {
      render(<AttachmentViewer attachment={mockAttachment} onRemove={mockOnRemove} />)
      
      expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
    })

    it('should not render action buttons when callbacks not provided', () => {
      render(<AttachmentViewer attachment={mockAttachment} />)
      
      expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
    })
  })

  describe('Image Attachments', () => {
    it('should render image with thumbnail', () => {
      render(<AttachmentViewer attachment={mockAttachment} />)
      
      const img = screen.getByRole('img', { name: /test-image.jpg/i })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', mockAttachment.thumbnail)
    })

    it('should fall back to main URL when no thumbnail', () => {
      const attachmentNoThumb = { ...mockAttachment, thumbnail: undefined }
      render(<AttachmentViewer attachment={attachmentNoThumb} />)
      
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', mockAttachment.url)
    })

    it('should open lightbox when image is clicked', async () => {
      render(<AttachmentViewer attachment={mockAttachment} />)
      
      const img = screen.getByRole('img')
      await user.click(img)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('img', { name: /full size/i })).toBeInTheDocument()
    })

    it('should close lightbox with escape key', async () => {
      render(<AttachmentViewer attachment={mockAttachment} />)
      
      const img = screen.getByRole('img')
      await user.click(img)
      
      await user.keyboard('{Escape}')
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Video Attachments', () => {
    const videoAttachment = {
      ...mockAttachment,
      name: 'test-video.mp4',
      type: 'video/mp4'
    }

    it('should render video player for video files', () => {
      render(<AttachmentViewer attachment={videoAttachment} />)
      
      const video = screen.getByRole('application', { name: /video player/i })
      expect(video).toBeInTheDocument()
      expect(video).toHaveAttribute('controls')
    })

    it('should show video metadata', () => {
      render(<AttachmentViewer attachment={videoAttachment} />)
      
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
      expect(screen.getByText(/video/i)).toBeInTheDocument()
    })
  })

  describe('Audio Attachments', () => {
    const audioAttachment = {
      ...mockAttachment,
      name: 'test-audio.mp3',
      type: 'audio/mp3'
    }

    it('should render audio player for audio files', () => {
      render(<AttachmentViewer attachment={audioAttachment} />)
      
      const audio = screen.getByRole('application', { name: /audio player/i })
      expect(audio).toBeInTheDocument()
      expect(audio).toHaveAttribute('controls')
    })

    it('should show waveform visualization placeholder', () => {
      render(<AttachmentViewer attachment={audioAttachment} />)
      
      expect(screen.getByText(/audio waveform/i)).toBeInTheDocument()
    })
  })

  describe('Document Attachments', () => {
    const pdfAttachment = {
      ...mockAttachment,
      name: 'document.pdf',
      type: 'application/pdf'
    }

    it('should render document preview for PDF files', () => {
      render(<AttachmentViewer attachment={pdfAttachment} />)
      
      expect(screen.getByText(/pdf preview/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /open in new tab/i })).toBeInTheDocument()
    })

    it('should show document icon for other document types', () => {
      const docAttachment = {
        ...mockAttachment,
        name: 'document.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
      
      render(<AttachmentViewer attachment={docAttachment} />)
      
      expect(screen.getByText(/document preview/i)).toBeInTheDocument()
    })
  })

  describe('File Actions', () => {
    it('should call onDownload when download button is clicked', async () => {
      render(<AttachmentViewer attachment={mockAttachment} onDownload={mockOnDownload} />)
      
      const downloadBtn = screen.getByRole('button', { name: /download/i })
      await user.click(downloadBtn)
      
      expect(mockOnDownload).toHaveBeenCalledTimes(1)
    })

    it('should call onRemove when remove button is clicked', async () => {
      render(<AttachmentViewer attachment={mockAttachment} onRemove={mockOnRemove} />)
      
      const removeBtn = screen.getByRole('button', { name: /remove/i })
      await user.click(removeBtn)
      
      expect(mockOnRemove).toHaveBeenCalledTimes(1)
    })

    it('should show download progress simulation', async () => {
      render(<AttachmentViewer attachment={mockAttachment} onDownload={mockOnDownload} />)
      
      const downloadBtn = screen.getByRole('button', { name: /download/i })
      await user.click(downloadBtn)
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.getByText(/downloading/i)).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should confirm before removing attachment', async () => {
      render(<AttachmentViewer attachment={mockAttachment} onRemove={mockOnRemove} />)
      
      const removeBtn = screen.getByRole('button', { name: /remove/i })
      await user.click(removeBtn)
      
      expect(screen.getByText(/confirm.*removal/i)).toBeInTheDocument()
      
      const confirmBtn = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmBtn)
      
      expect(mockOnRemove).toHaveBeenCalledTimes(1)
    })
  })

  describe('File Size Formatting', () => {
    it('should format bytes correctly', () => {
      const smallAttachment = { ...mockAttachment, size: 512 }
      render(<AttachmentViewer attachment={smallAttachment} />)
      
      expect(screen.getByText(/512.*B/i)).toBeInTheDocument()
    })

    it('should format kilobytes correctly', () => {
      const kbAttachment = { ...mockAttachment, size: 1536 }
      render(<AttachmentViewer attachment={kbAttachment} />)
      
      expect(screen.getByText(/1\.5.*KB/i)).toBeInTheDocument()
    })

    it('should format megabytes correctly', () => {
      const mbAttachment = { ...mockAttachment, size: 2097152 }
      render(<AttachmentViewer attachment={mbAttachment} />)
      
      expect(screen.getByText(/2.*MB/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing thumbnail gracefully', () => {
      const brokenAttachment = { ...mockAttachment, thumbnail: '' }
      render(<AttachmentViewer attachment={brokenAttachment} />)
      
      const img = screen.getByRole('img')
      fireEvent.error(img)
      
      expect(screen.getByText(/preview.*unavailable/i)).toBeInTheDocument()
    })

    it('should handle broken media files', () => {
      const videoAttachment = {
        ...mockAttachment,
        name: 'broken.mp4',
        type: 'video/mp4'
      }
      
      render(<AttachmentViewer attachment={videoAttachment} />)
      
      const video = screen.getByRole('application')
      fireEvent.error(video)
      
      expect(screen.getByText(/media.*unavailable/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for images', () => {
      render(<AttachmentViewer attachment={mockAttachment} />)
      
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('alt', expect.stringContaining('test-image.jpg'))
    })

    it('should support keyboard navigation in lightbox', async () => {
      render(<AttachmentViewer attachment={mockAttachment} />)
      
      const img = screen.getByRole('img')
      await user.tab()
      await user.keyboard('{Enter}')
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      
      const closeBtn = screen.getByRole('button', { name: /close/i })
      expect(closeBtn).toHaveFocus()
    })

    it('should announce file type to screen readers', () => {
      render(<AttachmentViewer attachment={mockAttachment} />)
      
      expect(screen.getByText(/image.*file/i)).toBeInTheDocument()
    })
  })

  describe('Thumbnail Generation', () => {
    it('should generate placeholder thumbnails for unsupported types', () => {
      const unknownAttachment = {
        ...mockAttachment,
        name: 'unknown.xyz',
        type: 'application/octet-stream',
        thumbnail: undefined
      }
      
      render(<AttachmentViewer attachment={unknownAttachment} />)
      
      expect(screen.getByText(/file icon/i)).toBeInTheDocument()
    })

    it('should show loading state while generating thumbnails', () => {
      const attachment = { ...mockAttachment, thumbnail: undefined }
      render(<AttachmentViewer attachment={attachment} />)
      
      expect(screen.getByText(/generating.*preview/i)).toBeInTheDocument()
    })
  })
})