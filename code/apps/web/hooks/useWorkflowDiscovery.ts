'use client';

import { useState, useEffect, useCallback } from 'react';
import { probeForAgents } from '@/lib/discovery/prober';
import type { DiscoveredAgent, ProbeConfig } from '@/types/discovery';
import type { StandardWorkflowDefinition } from '@/types/workflows';

interface UseWorkflowDiscoveryOptions {
  autoDiscover?: boolean;
  persistToStorage?: boolean;
  includeMockData?: boolean;
}

interface WorkflowDiscoveryState {
  services: DiscoveredAgent[];
  isDiscovering: boolean;
  error: string | null;
  lastDiscoveryTime: string | null;
}

const STORAGE_KEY = 'baigel_workflow_services';
const MOCK_MASTRA_SERVICE: DiscoveredAgent = {
  id: 'mastra-local',
  name: 'Mastra Workflow Engine',
  description: 'Mastra workflow service with MCP servers',
  protocol: 'Workflow',
  baseUrl: 'http://100.80.122.46:4111',
  endpoints: [{
    url: 'http://100.80.122.46:4111/openapi.json',
    protocol: 'Workflow',
    success: true,
    data: {}
  }],
  capabilities: ['api_integrations', 'custom_code', 'monitoring', 'audit_logging'].map(c => `workflow:${c}`),
  metadata: {
    subProtocol: 'Mastra',
    workflowCount: 0, // Will be updated on actual discovery
    frameworks: ['Mastra', 'MCP'],
    schemaSupport: {
      input: true,
      output: true,
      validation: true,
      uiHints: false
    }
  }
};

export function useWorkflowDiscovery(options: UseWorkflowDiscoveryOptions = {}) {
  const { 
    autoDiscover = false, 
    persistToStorage = true,
    includeMockData = false 
  } = options;

  const [state, setState] = useState<WorkflowDiscoveryState>(() => {
    // Load from storage on init
    if (persistToStorage && typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return {
            services: parsed.services || [],
            isDiscovering: false,
            error: null,
            lastDiscoveryTime: parsed.lastDiscoveryTime || null
          };
        } catch (e) {
          console.error('Failed to parse stored workflow services:', e);
        }
      }
    }

    // Default state with optional mock data
    return {
      services: includeMockData ? [MOCK_MASTRA_SERVICE] : [],
      isDiscovering: false,
      error: null,
      lastDiscoveryTime: null
    };
  });

  // Save to storage when services change
  useEffect(() => {
    if (persistToStorage && typeof window !== 'undefined' && state.services.length > 0) {
      const toStore = {
        services: state.services,
        lastDiscoveryTime: state.lastDiscoveryTime
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    }
  }, [state.services, state.lastDiscoveryTime, persistToStorage]);

  const discoverServices = useCallback(async (urls?: string[]) => {
    setState(prev => ({ ...prev, isDiscovering: true, error: null }));

    try {
      const discoveryUrls = urls || [
        'http://100.80.122.46:4111', // Your Mastra instance
        'http://localhost:4111',      // Local Mastra
        'http://localhost:8080',      // Common workflow port
      ];

      const allServices: DiscoveredAgent[] = [];

      // Probe each URL
      for (const url of discoveryUrls) {
        try {
          const config: ProbeConfig = {
            baseUrl: url,
            protocols: ['Workflow'],
            timeout: 5000,
            parallel: true
          };

          const result = await probeForAgents(config);
          
          // Filter for workflow services
          const workflowServices = result.agents.filter(
            agent => agent.protocol === 'Workflow'
          );
          
          allServices.push(...workflowServices);
        } catch (err) {
          console.warn(`Failed to probe ${url}:`, err);
          // Continue with other URLs
        }
      }

      // Remove duplicates based on baseUrl
      const uniqueServices = Array.from(
        new Map(allServices.map(s => [s.baseUrl, s])).values()
      );

      setState(prev => ({
        ...prev,
        services: uniqueServices,
        isDiscovering: false,
        lastDiscoveryTime: new Date().toISOString(),
        error: uniqueServices.length === 0 ? 
          `Explored ${discoveryUrls.length} endpoints but found no workflow services` : null
      }));

      return uniqueServices;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Discovery failed';
      setState(prev => ({
        ...prev,
        isDiscovering: false,
        error: errorMessage
      }));
      return [];
    }
  }, []);

  const addService = useCallback((service: DiscoveredAgent) => {
    setState(prev => {
      // Check if service already exists
      const exists = prev.services.some(s => s.baseUrl === service.baseUrl);
      if (exists) {
        return prev;
      }
      
      return {
        ...prev,
        services: [...prev.services, service]
      };
    });
  }, []);

  const removeService = useCallback((serviceId: string) => {
    setState(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== serviceId)
    }));
  }, []);

  const addManualService = useCallback(async (url: string, name?: string) => {
    setState(prev => ({ ...prev, isDiscovering: true, error: null }));

    try {
      const config: ProbeConfig = {
        baseUrl: url,
        protocols: ['Workflow'],
        timeout: 5000
      };

      const result = await probeForAgents(config);
      
      if (result.agents.length > 0) {
        const service = result.agents[0];
        if (service && name) {
          service.name = name;
        }
        if (service) {
          addService(service);
          return service;
        }
      }
      
      // If no service was found or the service was null, create a generic entry
      {
        // If discovery doesn't find it as workflow, create a generic entry
        const genericService: DiscoveredAgent = {
          id: `workflow-${url.replace(/[^a-zA-Z0-9]/g, '-')}`,
          name: name || 'Unknown Workflow Service',
          description: 'Manually added workflow service',
          protocol: 'Workflow',
          baseUrl: url,
          endpoints: [{
            url: url,
            protocol: 'Workflow',
            success: false,
            error: 'Not yet probed'
          }],
          capabilities: [],
          metadata: {
            subProtocol: 'Generic',
            workflowCount: 0,
            frameworks: ['Unknown'],
            schemaSupport: {
              input: false,
              output: false,
              validation: false,
              uiHints: false
            }
          }
        };
        addService(genericService);
        return genericService;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add service';
      setState(prev => ({
        ...prev,
        isDiscovering: false,
        error: errorMessage
      }));
      return null;
    } finally {
      setState(prev => ({ ...prev, isDiscovering: false }));
    }
  }, [addService]);

  const clearServices = useCallback(() => {
    setState({
      services: [],
      isDiscovering: false,
      error: null,
      lastDiscoveryTime: null
    });
    if (persistToStorage && typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [persistToStorage]);

  // Auto-discover on mount if requested
  useEffect(() => {
    if (autoDiscover && state.services.length === 0) {
      discoverServices();
    }
  }, [autoDiscover]); // Only run once on mount

  return {
    services: state.services,
    isDiscovering: state.isDiscovering,
    error: state.error,
    lastDiscoveryTime: state.lastDiscoveryTime,
    discoverServices,
    addService,
    removeService,
    addManualService,
    clearServices
  };
}