import { describe, it, expect, beforeEach } from 'vitest'
import { testConnection, connectToService, disconnectFromService } from '@/lib/stores/connections'
import type { Connection } from '@/lib/types/connections'

describe('Real Service Implementations', () => {
  let mockConnection: Connection

  beforeEach(() => {
    mockConnection = {
      id: 'test-connection',
      name: 'Test Connection',
      protocol: 'openai',
      status: 'disconnected',
      createdAt: new Date(),
      config: {
        apiKey: 'invalid-key',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4'
      }
    } as any
  })

  describe('testConnection', () => {
    it('should reject with real error instead of mock success', async () => {
      // This should fail because we're using an invalid API key
      const result = await testConnection(mockConnection)
      
      // Should fail with real API error, not mock success
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(result.error).not.toContain('mock')
      expect(result.error).not.toContain('demo')
    })

    it('should measure real latency', async () => {
      const startTime = Date.now()
      const result = await testConnection(mockConnection)
      const endTime = Date.now()
      
      // Latency should be reasonable for a real network request
      expect(result.latency).toBeGreaterThan(0)
      expect(result.latency).toBeLessThan(endTime - startTime + 100) // Allow some margin
    })
  })

  describe('connectToService', () => {
    it('should throw real connection error instead of mock behavior', async () => {
      // This should throw a real error, not randomly succeed/fail like mock
      await expect(connectToService(mockConnection)).rejects.toThrow()
    })
  })

  describe('disconnectFromService', () => {
    it('should attempt real disconnection even for non-existent connection', async () => {
      // Should throw error for missing connection, not silently succeed
      await expect(disconnectFromService('non-existent-id')).rejects.toThrow('Connection non-existent-id not found')
    })
  })

  describe('MCP Connection', () => {
    it('should fail with real MCP connection error', async () => {
      const mcpConnection: Connection = {
        id: 'test-mcp',
        name: 'Test MCP',
        protocol: 'mcp',
        status: 'disconnected',
        createdAt: new Date(),
        config: {
          transport: 'http',
          url: 'http://localhost:9999' // Non-existent server
        }
      } as any

      const result = await testConnection(mcpConnection)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      // Should contain real network error, not mock text
      expect(result.error?.toLowerCase()).toMatch(/connect|refused|timeout|network|econnrefused|fetch failed/i)
    })
  })

  describe('A2A Connection', () => {
    it('should fail with real A2A connection error', async () => {
      const a2aConnection: Connection = {
        id: 'test-a2a',
        name: 'Test A2A',
        protocol: 'a2a',
        status: 'disconnected',
        createdAt: new Date(),
        config: {
          agentId: 'test-agent',
          endpoint: 'http://localhost:9999/agent' // Non-existent server
        }
      } as any

      const result = await testConnection(a2aConnection)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      // Should contain real network error, not mock text
      expect(result.error?.toLowerCase()).toMatch(/connect|refused|timeout|network|econnrefused|fetch failed/i)
    })
  })
})