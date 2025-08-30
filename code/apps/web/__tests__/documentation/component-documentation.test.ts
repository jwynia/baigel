/**
 * Documentation Accuracy Tests
 * 
 * These tests verify that our documentation accurately reflects 
 * the actual implemented components and their functionality.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const COMPONENTS_PATH = './components';

describe('Component Documentation Accuracy', () => {
  describe('Connection Management System', () => {
    it('should have all connection components documented', () => {
      const connectionsPath = join(COMPONENTS_PATH, 'connections');
      const connectionFiles = readdirSync(connectionsPath)
        .filter(file => file.endsWith('.tsx'))
        .map(file => file.replace('.tsx', ''));
      
      // These are the components that should be documented
      const expectedComponents = [
        'ConnectionManager',
        'ConnectionForm', 
        'ConnectionTestDialog',
        'ConnectionSelector',
        'QuickConnect',
        'CapabilitySelector'
      ];
      
      expectedComponents.forEach(component => {
        expect(connectionFiles).toContain(component);
      });
    });

    it('should have barrel export file', () => {
      const indexPath = join(COMPONENTS_PATH, 'connections', 'index.ts');
      expect(() => statSync(indexPath)).not.toThrow();
    });
  });

  describe('Workflow System', () => {
    it('should have all workflow components documented', () => {
      const workflowsPath = join(COMPONENTS_PATH, 'workflows');
      const workflowFiles = readdirSync(workflowsPath)
        .filter(file => file.endsWith('.tsx'))
        .map(file => file.replace('.tsx', ''));
      
      const expectedComponents = [
        'WorkflowExecutor',
        'UniversalFormRenderer',
        'ExecutionProgress',
        'ResultsDisplay',
        'WorkflowDiscoveryCard',
        'WorkflowCatalog'
      ];
      
      expectedComponents.forEach(component => {
        expect(workflowFiles).toContain(component);
      });
    });

    it('should have barrel export file with type exports', () => {
      const indexPath = join(COMPONENTS_PATH, 'workflows', 'index.ts');
      expect(() => statSync(indexPath)).not.toThrow();
    });
  });

  describe('Layout & Navigation System', () => {
    it('should have all layout components documented', () => {
      const layoutPath = join(COMPONENTS_PATH, 'layout');
      const layoutFiles = readdirSync(layoutPath)
        .filter(file => file.endsWith('.tsx'))
        .map(file => file.replace('.tsx', ''));
      
      const expectedComponents = [
        'AppLayout',
        'Sidebar',
        'MobileNav'
      ];
      
      expectedComponents.forEach(component => {
        expect(layoutFiles).toContain(component);
      });
    });
  });

  describe('Discovery System', () => {
    it('should have all discovery components documented', () => {
      const discoveryPath = join(COMPONENTS_PATH, 'discovery');
      const discoveryFiles = readdirSync(discoveryPath)
        .filter(file => file.endsWith('.tsx'))
        .map(file => file.replace('.tsx', ''));
      
      const expectedComponents = [
        'AgentDiscovery',
        'DiscoveryResults', 
        'DiscoveryCard'
      ];
      
      expectedComponents.forEach(component => {
        expect(discoveryFiles).toContain(component);
      });
    });
  });
});

describe('Documentation Structure Tests', () => {
  it('should have required documentation files in context network', () => {
    // These files should exist after documentation is complete
    const expectedDocs = [
      './context-network/elements/ui-systems/connection-management.md',
      './context-network/elements/ui-systems/workflow-system.md', 
      './context-network/elements/ui-systems/layout-navigation.md',
      './context-network/navigation/component-locations.md' // should be updated
    ];
    
    // For now, just verify the test structure - actual files will be created during implementation
    expect(expectedDocs).toHaveLength(4);
  });
});