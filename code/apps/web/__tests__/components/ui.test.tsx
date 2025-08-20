import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

describe('Shadcn UI Components', () => {
  describe('Button Component', () => {
    it('should render button with default variant', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-primary')
    })

    it('should render button with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button', { name: /secondary/i })
      expect(button).toHaveClass('bg-secondary')
    })

    it('should render button with destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button', { name: /delete/i })
      expect(button).toHaveClass('bg-destructive')
    })

    it('should handle click events', () => {
      let clicked = false
      render(<Button onClick={() => clicked = true}>Click</Button>)
      fireEvent.click(screen.getByRole('button'))
      expect(clicked).toBe(true)
    })

    it('should support disabled state', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should support different sizes', () => {
      const { rerender } = render(<Button size="sm">Small</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-9')
      
      rerender(<Button size="default">Default</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-10')
      
      rerender(<Button size="lg">Large</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-11')
    })
  })

  describe('Card Component', () => {
    it('should render card with all sections', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Content here</CardContent>
          <CardFooter>Footer content</CardFooter>
        </Card>
      )

      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card Description')).toBeInTheDocument()
      expect(screen.getByText('Content here')).toBeInTheDocument()
      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })

    it('should apply proper styling classes', () => {
      const { container } = render(<Card className="custom-class">Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('rounded-lg', 'border', 'custom-class')
    })
  })

  describe('Dialog Component', () => {
    it('should render dialog trigger and open on click', () => {
      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
              <DialogDescription>Dialog Description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: /open dialog/i })
      expect(trigger).toBeInTheDocument()
      
      fireEvent.click(trigger)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Dialog Title')).toBeInTheDocument()
    })

    it('should close dialog on escape key', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
              <DialogDescription>Test Description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Input Component', () => {
    it('should render input with placeholder', () => {
      render(<Input placeholder="Enter text" />)
      const input = screen.getByPlaceholderText('Enter text')
      expect(input).toBeInTheDocument()
    })

    it('should handle value changes', () => {
      let value = ''
      render(<Input onChange={(e) => value = e.target.value} />)
      const input = screen.getByRole('textbox')
      
      fireEvent.change(input, { target: { value: 'test input' } })
      expect(value).toBe('test input')
    })

    it('should support disabled state', () => {
      render(<Input disabled />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('should support different types', () => {
      const { rerender } = render(<Input type="email" />)
      const emailInput = screen.getByRole('textbox')
      expect(emailInput).toHaveAttribute('type', 'email')
      
      rerender(<Input type="text" />)
      const textInput = screen.getByRole('textbox')
      expect(textInput).toHaveAttribute('type', 'text')
    })
  })

  describe('Select Component', () => {
    it('should render select with options', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toBeInTheDocument()
      expect(screen.getByText('Choose option')).toBeInTheDocument()
    })

    it('should handle selection', () => {
      let selectedValue = ''
      render(
        <Select onValueChange={(value) => selectedValue = value}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Test Option</SelectItem>
          </SelectContent>
        </Select>
      )

      fireEvent.click(screen.getByRole('combobox'))
      fireEvent.click(screen.getByText('Test Option'))
      expect(selectedValue).toBe('test')
    })
  })

  describe('DropdownMenu Component', () => {
    it('should render dropdown trigger', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByRole('button', { name: /menu/i })
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    })

    it('should have proper trigger attributes', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => {}}>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByRole('button')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(trigger).toHaveAttribute('data-state', 'closed')
    })
  })
})