import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUpload } from '@/components/chat/FileUpload'

// Mock file for testing
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('FileUpload Component', () => {
  const mockOnFilesAdded = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render drag and drop zone', () => {
      render(<FileUpload onFilesAdded={mockOnFilesAdded} />)
      
      expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument()
      expect(screen.getByText(/choose files/i)).toBeInTheDocument()
    })

    it('should show file input when clicked', () => {
      render(<FileUpload onFilesAdded={mockOnFilesAdded} />)
      
      const fileInput = screen.getByRole('button', { name: /choose files/i })
      expect(fileInput).toBeInTheDocument()
    })

    it('should be disabled when disabled prop is true', () => {
      render(<FileUpload onFilesAdded={mockOnFilesAdded} disabled />)
      
      const uploadZone = screen.getByRole('button')
      expect(uploadZone).toBeDisabled()
    })
  })

  describe('File Selection', () => {
    const getFileInput = () => screen.getAllByLabelText(/choose files/i).find(el => el.tagName === 'INPUT') as HTMLInputElement

    it('should handle single file selection', async () => {
      render(<FileUpload onFilesAdded={mockOnFilesAdded} />)
      
      const file = createMockFile('test.jpg', 1024, 'image/jpeg')
      const input = getFileInput()
      
      await user.upload(input, file)
      
      expect(mockOnFilesAdded).toHaveBeenCalledWith([file])
    })

    it('should handle multiple file selection', async () => {
      render(<FileUpload onFilesAdded={mockOnFilesAdded} />)
      
      const files = [
        createMockFile('test1.jpg', 1024, 'image/jpeg'),
        createMockFile('test2.png', 2048, 'image/png')
      ]
      const input = getFileInput()
      
      await user.upload(input, files)
      
      expect(mockOnFilesAdded).toHaveBeenCalledWith(files)
    })

    it('should respect maxFiles limit', async () => {
      render(<FileUpload onFilesAdded={mockOnFilesAdded} maxFiles={2} />)
      
      const files = [
        createMockFile('test1.jpg', 1024, 'image/jpeg'),
        createMockFile('test2.png', 2048, 'image/png'),
        createMockFile('test3.gif', 1024, 'image/gif')
      ]
      const input = getFileInput()
      
      await user.upload(input, files)
      
      expect(screen.getByText(/Maximum.*2.*files.*allowed/i)).toBeInTheDocument()
      expect(mockOnFilesAdded).not.toHaveBeenCalled()
    })
  })

  describe('File Validation', () => {
    const getFileInput = () => screen.getAllByLabelText(/choose files/i).find(el => el.tagName === 'INPUT') as HTMLInputElement

    it('should validate file size', async () => {
      const maxSize = 1024 // 1KB
      render(<FileUpload onFilesAdded={mockOnFilesAdded} maxSize={maxSize} />)
      
      const largeFile = createMockFile('large.jpg', 2048, 'image/jpeg')
      const input = getFileInput()
      
      await user.upload(input, largeFile)
      
      expect(screen.getByText(/File size.*exceeds/i)).toBeInTheDocument()
      expect(mockOnFilesAdded).not.toHaveBeenCalled()
    })

    it('should validate file types', async () => {
      render(<FileUpload onFilesAdded={mockOnFilesAdded} acceptedTypes={['image/*']} />)
      
      const textFile = createMockFile('test.txt', 1024, 'text/plain')
      const input = getFileInput()
      
      await user.upload(input, textFile)
      
      expect(screen.getByText(/File type.*is not supported/i)).toBeInTheDocument()
      expect(mockOnFilesAdded).not.toHaveBeenCalled()
    })

    it('should accept valid file types', async () => {
      render(<FileUpload onFilesAdded={mockOnFilesAdded} acceptedTypes={['image/*']} />)
      
      const imageFile = createMockFile('test.jpg', 1024, 'image/jpeg')
      const input = getFileInput()
      
      await user.upload(input, imageFile)
      
      expect(mockOnFilesAdded).toHaveBeenCalledWith([imageFile])
    })
  })

  describe('Drag and Drop', () => {
    it('should handle drag enter and leave events', () => {
      render(<FileUpload onFilesAdded={mockOnFilesAdded} />)
      
      const dropZone = screen.getByRole('button')
      
      fireEvent.dragEnter(dropZone)
      expect(dropZone).toHaveClass('border-primary')
      
      fireEvent.dragLeave(dropZone)
      expect(dropZone).not.toHaveClass('border-primary')
    })

    it('should handle file drop', async () => {
      render(<FileUpload onFilesAdded={mockOnFilesAdded} />)
      
      const file = createMockFile('dropped.jpg', 1024, 'image/jpeg')
      const dropZone = screen.getByRole('button')
      
      const dropEvent = new Event('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] }
      })
      
      fireEvent(dropZone, dropEvent)
      
      await waitFor(() => {
        expect(mockOnFilesAdded).toHaveBeenCalledWith([file])
      })
    })

    it('should prevent default drag behaviors', () => {
      render(<FileUpload onFilesAdded={mockOnFilesAdded} />)
      
      const dropZone = screen.getByRole('button')
      
      const dragOverEvent = new Event('dragover', { bubbles: true })
      const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault')
      
      fireEvent(dropZone, dragOverEvent)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('Progress Simulation', () => {
    const getFileInput = () => screen.getAllByLabelText(/choose files/i).find(el => el.tagName === 'INPUT') as HTMLInputElement

    it('should show upload progress for selected files', async () => {
      render(<FileUpload onFilesAdded={mockOnFilesAdded} />)
      
      const file = createMockFile('test.jpg', 1024, 'image/jpeg')
      const input = getFileInput()
      
      await user.upload(input, file)
      
      // Should show progress indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      
      // Should complete after simulation
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
      }, { timeout: 6000 })
    })

    it('should simulate upload failure randomly', async () => {
      // Mock Math.random to force failure
      const originalRandom = Math.random
      Math.random = vi.fn(() => 0.03) // Force failure (< 5%)
      
      render(<FileUpload onFilesAdded={mockOnFilesAdded} />)
      
      const file = createMockFile('test.jpg', 1024, 'image/jpeg')
      const input = getFileInput()
      
      await user.upload(input, file)
      
      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
      }, { timeout: 6000 })
      
      Math.random = originalRandom
    })
  })

  describe('Accessibility', () => {
    const getFileInput = () => screen.getAllByLabelText(/choose files/i).find(el => el.tagName === 'INPUT') as HTMLInputElement

    it('should have proper ARIA labels', () => {
      render(<FileUpload onFilesAdded={mockOnFilesAdded} />)
      
      expect(getFileInput()).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveAttribute('aria-describedby')
    })

    it('should support keyboard navigation', async () => {
      render(<FileUpload onFilesAdded={mockOnFilesAdded} />)
      
      const uploadButton = screen.getByRole('button')
      
      await user.tab()
      expect(uploadButton).toHaveFocus()
      
      await user.keyboard('{Enter}')
      // Should trigger file selection dialog
    })

    it('should announce upload status to screen readers', async () => {
      render(<FileUpload onFilesAdded={mockOnFilesAdded} />)
      
      const file = createMockFile('test.jpg', 1024, 'image/jpeg')
      const input = getFileInput()
      
      await user.upload(input, file)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    const getFileInput = () => screen.getAllByLabelText(/choose files/i).find(el => el.tagName === 'INPUT') as HTMLInputElement

    it('should handle empty file selection gracefully', async () => {
      render(<FileUpload onFilesAdded={mockOnFilesAdded} />)
      
      const input = getFileInput()
      
      // Simulate selecting no files
      fireEvent.change(input, { target: { files: [] } })
      
      expect(mockOnFilesAdded).not.toHaveBeenCalled()
    })

    it('should clear errors when new valid files are selected', async () => {
      render(<FileUpload onFilesAdded={mockOnFilesAdded} maxSize={1024} />)
      
      const input = getFileInput()
      
      // First upload invalid file
      const largeFile = createMockFile('large.jpg', 2048, 'image/jpeg')
      await user.upload(input, largeFile)
      expect(screen.getByText(/File size.*exceeds/i)).toBeInTheDocument()
      
      // Then upload valid file
      const validFile = createMockFile('small.jpg', 512, 'image/jpeg')
      await user.upload(input, validFile)
      
      expect(screen.queryByText(/File size.*exceeds/i)).not.toBeInTheDocument()
      expect(mockOnFilesAdded).toHaveBeenCalledWith([validFile])
    })
  })
})