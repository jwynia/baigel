import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-object-url')
global.URL.revokeObjectURL = vi.fn()

// Mock HTMLAnchorElement for download functionality
const mockAnchorElement = {
  href: '',
  download: '',
  click: vi.fn(),
  style: {},
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
}

// Mock only the specific elements we need for downloads
global.HTMLAnchorElement = vi.fn(() => mockAnchorElement) as any

// Mock body methods for download functionality
const originalAppendChild = document.body.appendChild
const originalRemoveChild = document.body.removeChild

document.body.appendChild = vi.fn((element) => {
  if (element instanceof HTMLAnchorElement || element?.tagName === 'A') {
    return element
  }
  return originalAppendChild.call(document.body, element)
})

document.body.removeChild = vi.fn((element) => {
  if (element instanceof HTMLAnchorElement || element?.tagName === 'A') {
    return element
  }
  return originalRemoveChild.call(document.body, element)
})