import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileUpload } from '@/components/chat/FileUpload'

describe('FileUpload Simple Tests', () => {
  const mockOnFilesAdded = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the upload area', () => {
    render(<FileUpload onFilesAdded={mockOnFilesAdded} />)
    
    expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument()
  })

  it('should call onFilesAdded when files are selected via input change', () => {
    render(<FileUpload onFilesAdded={mockOnFilesAdded} />)
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    
    // Create a mock file
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    // Simulate file selection
    Object.defineProperty(input, 'files', {
      value: [file],
      configurable: true
    })
    
    fireEvent.change(input)
    
    expect(mockOnFilesAdded).toHaveBeenCalledWith([file])
  })
})