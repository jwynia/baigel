import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentDiscovery } from '@/components/discovery/AgentDiscovery';
import * as prober from '@/lib/discovery/prober';
import type { ProbeResult, AgentConfiguration } from '@/types/discovery';

// Mock the prober module
vi.mock('@/lib/discovery/prober', () => ({
  probeForAgents: vi.fn(),
  isValidUrl: vi.fn(),
  getExampleUrls: vi.fn(() => [
    { url: 'http://localhost:3001', description: 'Local MCP Server' },
    { url: 'https://api.example.com', description: 'Example API' },
  ]),
}));

describe('AgentDiscovery', () => {
  const mockOnAgentAdded = vi.fn();
  const mockOnMultipleAgentsAdded = vi.fn();
  
  const mockProbeResult: ProbeResult = {
    status: 'success',
    agents: [
      {
        id: 'test-agent-1',
        name: 'Test MCP Server',
        description: 'A test MCP server',
        protocol: 'MCP',
        baseUrl: 'http://localhost:3001',
        endpoints: [],
        tools: [
          { name: 'readFile', description: 'Read a file' },
          { name: 'writeFile', description: 'Write a file' },
        ],
        capabilities: ['readFile', 'writeFile'],
        authentication: {
          type: 'api-key',
          required: true,
        },
        transport: ['http', 'sse'],
      },
      {
        id: 'test-agent-2',
        name: 'Test A2A Agent',
        description: 'A test A2A agent',
        protocol: 'A2A',
        baseUrl: 'http://localhost:3002',
        endpoints: [],
        capabilities: ['search', 'analyze'],
      },
    ],
    errors: [],
    duration: 1234,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prober.isValidUrl).mockImplementation((url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });
  });

  it('renders the discovery interface', () => {
    render(<AgentDiscovery onAgentAdded={mockOnAgentAdded} />);
    
    expect(screen.getByText('Discover Agents & Tools')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/https:\/\/example.com/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Discover/i })).toBeInTheDocument();
  });

  it('shows error for invalid URL', async () => {
    const user = userEvent.setup();
    vi.mocked(prober.isValidUrl).mockReturnValue(false);
    
    render(<AgentDiscovery onAgentAdded={mockOnAgentAdded} />);
    
    const input = screen.getByPlaceholderText(/https:\/\/example.com/);
    const button = screen.getByRole('button', { name: /Discover/i });
    
    await user.type(input, 'not-a-url');
    await user.click(button);
    
    expect(screen.getByText(/Please enter a valid URL/)).toBeInTheDocument();
  });

  it('shows error when URL is empty', async () => {
    const user = userEvent.setup();
    
    render(<AgentDiscovery onAgentAdded={mockOnAgentAdded} />);
    
    const button = screen.getByRole('button', { name: /Discover/i });
    await user.click(button);
    
    expect(screen.getByText('Please enter a URL')).toBeInTheDocument();
  });

  it('successfully discovers agents', async () => {
    const user = userEvent.setup();
    vi.mocked(prober.isValidUrl).mockReturnValue(true);
    vi.mocked(prober.probeForAgents).mockResolvedValue(mockProbeResult);
    
    render(<AgentDiscovery onAgentAdded={mockOnAgentAdded} />);
    
    const input = screen.getByPlaceholderText(/https:\/\/example.com/);
    const button = screen.getByRole('button', { name: /Discover/i });
    
    await user.type(input, 'http://localhost:3001');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Discovery complete')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Test MCP Server')).toBeInTheDocument();
    expect(screen.getByText('Test A2A Agent')).toBeInTheDocument();
    expect(screen.getByText('Found 2 agents in 1.2s')).toBeInTheDocument();
  });

  it('shows loading state while probing', async () => {
    const user = userEvent.setup();
    vi.mocked(prober.isValidUrl).mockReturnValue(true);
    
    // Create a promise that we can control
    let resolveProbe: (value: ProbeResult) => void;
    const probePromise = new Promise<ProbeResult>((resolve) => {
      resolveProbe = resolve;
    });
    vi.mocked(prober.probeForAgents).mockReturnValue(probePromise);
    
    render(<AgentDiscovery onAgentAdded={mockOnAgentAdded} />);
    
    const input = screen.getByPlaceholderText(/https:\/\/example.com/);
    const button = screen.getByRole('button', { name: /Discover/i });
    
    await user.type(input, 'http://localhost:3001');
    await user.click(button);
    
    expect(screen.getByText('Discovering...')).toBeInTheDocument();
    expect(screen.getByText('Discovering agents and tools...')).toBeInTheDocument();
    
    // Resolve the promise
    resolveProbe!(mockProbeResult);
    
    await waitFor(() => {
      expect(screen.queryByText('Discovering...')).not.toBeInTheDocument();
    });
  });

  it('handles discovery errors', async () => {
    const user = userEvent.setup();
    vi.mocked(prober.isValidUrl).mockReturnValue(true);
    vi.mocked(prober.probeForAgents).mockRejectedValue(new Error('Network error'));
    
    render(<AgentDiscovery onAgentAdded={mockOnAgentAdded} />);
    
    const input = screen.getByPlaceholderText(/https:\/\/example.com/);
    const button = screen.getByRole('button', { name: /Discover/i });
    
    await user.type(input, 'http://localhost:3001');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Discovery failed')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('adds individual agent when Add button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(prober.isValidUrl).mockReturnValue(true);
    vi.mocked(prober.probeForAgents).mockResolvedValue(mockProbeResult);
    
    render(<AgentDiscovery onAgentAdded={mockOnAgentAdded} />);
    
    const input = screen.getByPlaceholderText(/https:\/\/example.com/);
    const discoverButton = screen.getByRole('button', { name: /Discover/i });
    
    await user.type(input, 'http://localhost:3001');
    await user.click(discoverButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test MCP Server')).toBeInTheDocument();
    });
    
    const addButtons = screen.getAllByRole('button', { name: /Add/i });
    await user.click(addButtons[0]);
    
    expect(mockOnAgentAdded).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-agent-1',
        name: 'Test MCP Server',
        baseUrl: 'http://localhost:3001',
        protocol: 'MCP',
      })
    );
  });

  it('toggles agent selection for bulk add', async () => {
    const user = userEvent.setup();
    vi.mocked(prober.isValidUrl).mockReturnValue(true);
    vi.mocked(prober.probeForAgents).mockResolvedValue(mockProbeResult);
    
    render(
      <AgentDiscovery 
        onAgentAdded={mockOnAgentAdded}
        onMultipleAgentsAdded={mockOnMultipleAgentsAdded}
      />
    );
    
    const input = screen.getByPlaceholderText(/https:\/\/example.com/);
    const discoverButton = screen.getByRole('button', { name: /Discover/i });
    
    await user.type(input, 'http://localhost:3001');
    await user.click(discoverButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test MCP Server')).toBeInTheDocument();
    });
    
    // Select first agent
    const selectButtons = screen.getAllByRole('button', { name: /Select/i });
    await user.click(selectButtons[0]);
    
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    
    // Deselect
    await user.click(screen.getByRole('button', { name: /Deselect/i }));
    
    expect(screen.queryByText('1 selected')).not.toBeInTheDocument();
  });

  it('adds multiple selected agents', async () => {
    const user = userEvent.setup();
    vi.mocked(prober.isValidUrl).mockReturnValue(true);
    vi.mocked(prober.probeForAgents).mockResolvedValue(mockProbeResult);
    
    render(
      <AgentDiscovery 
        onAgentAdded={mockOnAgentAdded}
        onMultipleAgentsAdded={mockOnMultipleAgentsAdded}
      />
    );
    
    const input = screen.getByPlaceholderText(/https:\/\/example.com/);
    const discoverButton = screen.getByRole('button', { name: /Discover/i });
    
    await user.type(input, 'http://localhost:3001');
    await user.click(discoverButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test MCP Server')).toBeInTheDocument();
    });
    
    // Select both agents
    const selectButtons = screen.getAllByRole('button', { name: /Select/i });
    await user.click(selectButtons[0]);
    await user.click(selectButtons[1]);
    
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    
    // Add selected
    await user.click(screen.getByRole('button', { name: /Add 2 Selected/i }));
    
    expect(mockOnMultipleAgentsAdded).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'test-agent-1' }),
        expect.objectContaining({ id: 'test-agent-2' }),
      ])
    );
  });

  it('shows and uses example URLs', async () => {
    const user = userEvent.setup();
    
    render(<AgentDiscovery onAgentAdded={mockOnAgentAdded} />);
    
    // Open examples
    const helpButton = screen.getByRole('button', { name: /Show example URLs/i });
    await user.click(helpButton);
    
    expect(screen.getByText('Example URLs:')).toBeInTheDocument();
    expect(screen.getByText('http://localhost:3001')).toBeInTheDocument();
    
    // Click an example
    await user.click(screen.getByText('http://localhost:3001'));
    
    const input = screen.getByPlaceholderText(/https:\/\/example.com/) as HTMLInputElement;
    expect(input.value).toBe('http://localhost:3001');
  });

  it('clears results when Clear button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(prober.isValidUrl).mockReturnValue(true);
    vi.mocked(prober.probeForAgents).mockResolvedValue(mockProbeResult);
    
    render(<AgentDiscovery onAgentAdded={mockOnAgentAdded} />);
    
    const input = screen.getByPlaceholderText(/https:\/\/example.com/);
    const discoverButton = screen.getByRole('button', { name: /Discover/i });
    
    await user.type(input, 'http://localhost:3001');
    await user.click(discoverButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test MCP Server')).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: /Clear Results/i }));
    
    expect(screen.queryByText('Test MCP Server')).not.toBeInTheDocument();
    expect(screen.getByText('Ready to discover')).toBeInTheDocument();
  });

  it('handles Enter key in URL input', async () => {
    const user = userEvent.setup();
    vi.mocked(prober.isValidUrl).mockReturnValue(true);
    vi.mocked(prober.probeForAgents).mockResolvedValue(mockProbeResult);
    
    render(<AgentDiscovery onAgentAdded={mockOnAgentAdded} />);
    
    const input = screen.getByPlaceholderText(/https:\/\/example.com/);
    
    await user.type(input, 'http://localhost:3001');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(prober.probeForAgents).toHaveBeenCalled();
    });
  });
});