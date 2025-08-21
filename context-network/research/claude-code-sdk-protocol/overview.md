# Research: Claude Code SDK Protocol Standards and Server Implementations

## Purpose
This research investigates how the Claude Code SDK and servers like CUI (Common Agent UI) implement communication protocols, and whether they follow established standards or use custom implementations. The goal is to determine if these protocols map to BAIGEL's existing protocol abstraction layer or require new adapter development.

## Classification
- **Domain:** Protocol Research
- **Stability:** Dynamic
- **Abstraction:** Structural
- **Confidence:** High

## Research Scope
- **Core Topic:** Claude Code SDK server protocol implementation
- **Research Depth:** Comprehensive
- **Time Period Covered:** Current (2024-2025)
- **Geographic Scope:** Global (open source standards)

## Key Questions Addressed

1. **Does Claude Code SDK use standard protocols?**
   - Finding: Yes, it uses MCP (Model Context Protocol) - Anthropic's open standard
   - Confidence: High

2. **How does CUI implement client-server communication?**
   - Finding: CUI wraps Claude Code SDK using MCP with HTTP/SSE transports
   - Confidence: High

3. **Is this compatible with BAIGEL's existing protocol architecture?**
   - Finding: Yes, MCP is already identified as a primary protocol for BAIGEL
   - Confidence: High

4. **Should we implement a Claude Code SDK adapter?**
   - Finding: No separate adapter needed - MCP adapter covers this
   - Confidence: High

## Executive Summary

The Claude Code SDK uses the Model Context Protocol (MCP), which is already one of BAIGEL's primary target protocols. CUI (Common Agent UI) is essentially a web UI wrapper around Claude Code that leverages the same MCP standard for communication. Since BAIGEL already plans MCP support, no additional custom protocol work is needed specifically for Claude Code SDK compatibility.

The key insight is that Claude Code SDK is not a separate protocol but rather an implementation of MCP with specific tooling for software development tasks. This aligns perfectly with BAIGEL's protocol-agnostic architecture.

## Methodology
- Research tool: Research MCP Server
- Number of queries: 2 comprehensive reports
- Sources evaluated: 10+ including official Anthropic documentation
- Additional analysis: GitHub repository examination (wbopan/cui)
- Time period: 2025-01-21

## Navigation
- **Detailed Findings:** [[research/claude-code-sdk-protocol/findings]]
- **Source Analysis:** [[research/claude-code-sdk-protocol/sources]]
- **Implementation Guide:** [[research/claude-code-sdk-protocol/implementation]]
- **Integration Strategy:** [[research/claude-code-sdk-protocol/integration]]

## Relationships
- **Parent Nodes:** [[elements/protocols/mcp]]
- **Related Nodes:** 
  - [[elements/protocols/comparison-matrix]]
  - [[planning/roadmap]]
  - [[elements/architecture/protocol-abstraction]]