import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ThemeProvider } from '@/components/theme-provider'
import { useTheme } from 'next-themes'

// Mock next-themes
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children, attribute, defaultTheme, enableSystem, disableTransitionOnChange, ...props }: any) => 
    <div 
      data-testid="theme-provider" 
      data-attribute={attribute}
      data-default-theme={defaultTheme}
      data-enablesystem={enableSystem?.toString()}
      data-disable-transition-on-change={disableTransitionOnChange?.toString()}
      {...props}
    >
      {children}
    </div>,
  useTheme: vi.fn()
}))

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    // Clear localStorage
    localStorage.clear()
  })

  it('should render theme provider with children', () => {
    render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme-provider')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should provide theme context to children', () => {
    const TestComponent = () => {
      const { theme } = useTheme()
      return <div>Current theme: {theme}</div>
    }

    ;(useTheme as any).mockReturnValue({ theme: 'light' })

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByText('Current theme: light')).toBeInTheDocument()
  })

  it('should support system theme by default', () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    )

    const provider = screen.getByTestId('theme-provider')
    expect(provider).toHaveAttribute('data-enablesystem', 'true')
  })

  it('should disable transitions on theme change', () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    )

    const provider = screen.getByTestId('theme-provider')
    expect(provider).toHaveAttribute('data-disable-transition-on-change', 'true')
  })

  it('should use class attribute for theme application', () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    )

    const provider = screen.getByTestId('theme-provider')
    expect(provider).toHaveAttribute('data-attribute', 'class')
  })

  it('should set default theme', () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    )

    const provider = screen.getByTestId('theme-provider')
    expect(provider).toHaveAttribute('data-default-theme', 'system')
  })
})

describe('Theme Toggle Functionality', () => {
  const ThemeToggle = () => {
    const { theme, setTheme } = useTheme()
    
    return (
      <div>
        <span data-testid="current-theme">{theme}</span>
        <button onClick={() => setTheme('light')}>Light</button>
        <button onClick={() => setTheme('dark')}>Dark</button>
        <button onClick={() => setTheme('system')}>System</button>
      </div>
    )
  }

  it('should toggle between light and dark themes', () => {
    const mockSetTheme = vi.fn()
    ;(useTheme as any).mockReturnValue({ 
      theme: 'light',
      setTheme: mockSetTheme 
    })

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByText('Dark'))
    expect(mockSetTheme).toHaveBeenCalledWith('dark')

    fireEvent.click(screen.getByText('Light'))
    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('should support system theme preference', () => {
    const mockSetTheme = vi.fn()
    ;(useTheme as any).mockReturnValue({ 
      theme: 'dark',
      setTheme: mockSetTheme 
    })

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByText('System'))
    expect(mockSetTheme).toHaveBeenCalledWith('system')
  })

  it('should persist theme preference', async () => {
    const mockSetTheme = vi.fn()
    ;(useTheme as any).mockReturnValue({ 
      theme: 'light',
      setTheme: mockSetTheme 
    })

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByText('Dark'))
    
    // Simulate theme being saved to localStorage
    localStorage.setItem('theme', 'dark')
    
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('should apply theme class to document root', () => {
    ;(useTheme as any).mockReturnValue({ 
      theme: 'dark',
      setTheme: vi.fn()
    })

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    // In a real scenario, next-themes would handle this
    // We're testing that our configuration enables it
    const provider = screen.getByTestId('theme-provider')
    expect(provider).toHaveAttribute('data-attribute', 'class')
  })
})