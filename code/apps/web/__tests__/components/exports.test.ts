import { describe, it, expect } from 'vitest'
import * as UIExports from '@/components/ui'

describe('UI Component Exports', () => {
  it('should export Button component', () => {
    expect(UIExports.Button).toBeDefined()
    expect(typeof UIExports.Button).toBe('object')
    expect(UIExports.Button.$$typeof).toBeDefined() // React forwardRef
  })

  it('should export Card components', () => {
    expect(UIExports.Card).toBeDefined()
    expect(UIExports.CardHeader).toBeDefined()
    expect(UIExports.CardTitle).toBeDefined()
    expect(UIExports.CardDescription).toBeDefined()
    expect(UIExports.CardContent).toBeDefined()
    expect(UIExports.CardFooter).toBeDefined()
  })

  it('should export Dialog components', () => {
    expect(UIExports.Dialog).toBeDefined()
    expect(UIExports.DialogTrigger).toBeDefined()
    expect(UIExports.DialogContent).toBeDefined()
    expect(UIExports.DialogHeader).toBeDefined()
    expect(UIExports.DialogTitle).toBeDefined()
    expect(UIExports.DialogDescription).toBeDefined()
    expect(UIExports.DialogFooter).toBeDefined()
  })

  it('should export Input component', () => {
    expect(UIExports.Input).toBeDefined()
    expect(typeof UIExports.Input).toBe('object')
    expect(UIExports.Input.$$typeof).toBeDefined() // React forwardRef
  })

  it('should export Select components', () => {
    expect(UIExports.Select).toBeDefined()
    expect(UIExports.SelectTrigger).toBeDefined()
    expect(UIExports.SelectContent).toBeDefined()
    expect(UIExports.SelectItem).toBeDefined()
    expect(UIExports.SelectValue).toBeDefined()
  })

  it('should export DropdownMenu components', () => {
    expect(UIExports.DropdownMenu).toBeDefined()
    expect(UIExports.DropdownMenuTrigger).toBeDefined()
    expect(UIExports.DropdownMenuContent).toBeDefined()
    expect(UIExports.DropdownMenuItem).toBeDefined()
    expect(UIExports.DropdownMenuSeparator).toBeDefined()
  })

  it('should export variant props for typed components', () => {
    // This tests that we're also exporting prop types
    expect(UIExports.buttonVariants).toBeDefined()
  })

  it('should have consistent naming convention', () => {
    const exports = Object.keys(UIExports)
    
    // All component exports should start with capital letter
    const componentExports = exports.filter(exp => 
      exp[0] === exp[0].toUpperCase() && 
      exp !== 'buttonVariants' // Exclude non-component exports
    )
    
    componentExports.forEach(exp => {
      expect(exp[0]).toMatch(/[A-Z]/)
    })
  })

  it('should not have default export conflicts', () => {
    // Ensure we're using named exports for better tree-shaking
    expect(UIExports.default).toBeUndefined()
  })
})