<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Discovery Protocols for A2A, AG-UI, and MCP

Yes, there are discovery protocols for each of the three systems you mentioned, though they differ significantly in their approaches and maturity levels. Here's a comprehensive overview of the discovery capabilities for A2A, AG-UI, and MCP protocols:

### A2A (Agent-to-Agent) Protocol Discovery

A2A has the most mature discovery system with three standardized approaches:[^1][^2]

**Well-Known URI Discovery**

- **Standard Path**: `https://{agent-server-domain}/.well-known/agent-card.json`[^3][^4]
- **Based on**: RFC 8615 well-known URI specification[^5][^6]
- **Process**: Client agents discover potential A2A servers by making HTTP GET requests to the standardized well-known path
- **Use Case**: Ideal for public agents or agents intended for broad discoverability within specific domains

**Agent Registry/Catalog Discovery**

- **Central Registry**: Agents can be discovered through curated catalogs or registries[^7][^2]
- **Enterprise Context**: Particularly useful for enterprise environments, marketplaces, or specialized ecosystems
- **API Endpoints**: Registries provide endpoints like:
    - `GET https://<registry-url>/agents/public` (public agents)
    - `GET https://<registry-url>/agents/entitled` (authenticated access)
    - `POST https://<registry-url>/agents/search` (search functionality)
- **Authentication**: Supports OAuth 2.0 client credential flow for access control

**Direct Configuration Discovery**

- **Private Discovery**: For tightly coupled systems, private agents, or development environments
- **Configuration-based**: Agents can be pre-configured with Agent Card URLs or content directly

The **Agent Card** is central to A2A discovery - it's a JSON document that describes an agent's identity, capabilities, service endpoint URL, supported A2A features, authentication schemes, and available skills.[^4][^1]

### MCP (Model Context Protocol) Discovery

MCP has a developing discovery ecosystem with both server-side and registry approaches:

**Server Discovery**

- **Tool Discovery**: Uses `tools/list` method for runtime capability discovery[^8][^9]
- **Resource Discovery**: Uses `resources/list` method to explore available data sources[^9][^8]
- **Automatic Discovery**: Some clients like VS Code can automatically detect MCP servers configured in other tools[^10]

**MCP Registry**

- **Community Registry**: An active MCP Registry project provides centralized server discovery[^11]
- **Planned Features**: Anthropic plans to develop an official MCP Registry for centralized server discovery and metadata[^12]
- **API-based**: The registry functions as an API layer that third-party marketplaces and discovery services can build upon

**Configuration-based Discovery**

- **Client Configuration**: MCP servers are typically configured directly in MCP clients
- **JSON Configuration**: Clients maintain configuration files specifying available MCP servers and their capabilities


### AG-UI (Agent-User Interaction) Protocol Discovery

AG-UI has the least developed discovery mechanism, focusing more on connection patterns than discovery:

**Direct Integration Discovery**

- **Framework Integration**: AG-UI provides integrations with popular agent frameworks rather than standalone discovery[^13][^14]
- **Event-driven Connection**: The protocol focuses on establishing event streams between frontends and agents
- **Endpoint Configuration**: Applications typically configure AG-UI endpoints directly rather than discovering them dynamically

**Connection Patterns**

- **Direct Connection**: Frontend connects directly to AG-UI-enabled agents
- **Proxy-mediated**: Secure proxy routes requests from frontend to multiple agents[^14]
- **No Standardized Discovery**: Currently lacks a standardized discovery protocol like A2A's well-known URI approach


### Comparative Analysis

| Protocol | Discovery Maturity | Standard Paths | Registry Support | Authentication |
| :-- | :-- | :-- | :-- | :-- |
| **A2A** | Most mature | `/.well-known/agent-card.json`[^3] | Yes, with OAuth 2.0[^7] | Comprehensive |
| **MCP** | Developing | No standard path | In development[^12] | Basic |
| **AG-UI** | Minimal | No standard path | No | Limited |

### Implementation Recommendations

For implementing discovery in your client application:

1. **A2A**: Start with well-known URI discovery for public agents, implement registry discovery for enterprise scenarios
2. **MCP**: Use existing registry services and prepare for official registry API when available
3. **AG-UI**: Implement direct configuration with framework-specific integrations until standardized discovery emerges

The discovery landscape is rapidly evolving, with A2A leading in standardization, MCP developing comprehensive registry solutions, and AG-UI focusing more on integration patterns than discovery protocols.
<span style="display:none">[^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49]</span>

<div style="text-align: center">⁂</div>

[^1]: https://a2a-protocol.org/latest/topics/agent-discovery/

[^2]: https://google-a2a.github.io/A2A/topics/agent-discovery/

[^3]: https://a2aproject.github.io/A2A/specification/

[^4]: https://javascript.plainenglish.io/agent2agent-protocol-in-super-detail-full-example-server-client-with-openai-agent-as-7734584e4e7b

[^5]: https://www.rfc-editor.org/info/rfc8615

[^6]: https://datatracker.ietf.org/doc/html/rfc8615

[^7]: https://github.com/google-a2a/A2A/discussions/741

[^8]: https://modelcontextprotocol.io/docs/concepts/architecture

[^9]: https://mcpcat.io/guides/understanding-json-rpc-protocol-mcp/

[^10]: https://code.visualstudio.com/docs/copilot/chat/mcp-servers

[^11]: https://github.com/modelcontextprotocol/registry

[^12]: https://modelcontextprotocol.io/development/roadmap

[^13]: https://docs.ag-ui.com

[^14]: https://docs.agentwire.io

[^15]: https://www.solo.io/blog/agent-discovery-naming-and-resolution---the-missing-pieces-to-a2a

[^16]: https://dev.to/czmilo/2025-complete-guide-agent2agent-a2a-protocol-the-new-standard-for-ai-agent-collaboration-1pph

[^17]: https://www.anthropic.com/news/model-context-protocol

[^18]: https://www.copilotkit.ai/blog/how-to-add-a-frontend-to-any-ag2-agent-using-ag-ui-protocol

[^19]: https://www.51d.co/mcp-ai-agent-infrastructure/

[^20]: https://live.paloaltonetworks.com/t5/community-blogs/safeguarding-ai-agents-an-in-depth-look-at-a2a-protocol-risks/ba-p/1235996

[^21]: https://blog.himeshparashar.com/the-ag-ui-protocol-rewriting-the-rules-of-agent-human-collaboration

[^22]: https://neo4j.com/blog/developer/model-context-protocol/

[^23]: https://huggingface.co/blog/1bo/a2a-protocol-explained

[^24]: https://www.descope.com/learn/post/mcp

[^25]: https://discuss.google.dev/t/understanding-a2a-the-protocol-for-agent-collaboration/189103

[^26]: https://aws.amazon.com/blogs/machine-learning/unlocking-the-power-of-model-context-protocol-mcp-on-aws/

[^27]: https://mindflow.io/blog/what-is-ag-ui

[^28]: https://stytch.com/blog/model-context-protocol-introduction/

[^29]: https://agentnetworkprotocol.com/en/specs/08-anp-agent-discovery-protocol-specification/

[^30]: https://github.com/modelcontextprotocol/servers

[^31]: https://www.ietf.org/id/draft-narvaneni-agent-uri-01.html

[^32]: https://topmostads.com/open-webui-vs-ag-ui/

[^33]: https://developers.maritimeconnectivity.net/serviceregistry/index.html

[^34]: https://tech.forums.softwareag.com/t/service-registry-support-in-api-gateway/237147

[^35]: https://community.rti.com/static/documentation/connext-dds/current/doc/manuals/connext_dds_professional/users_manual/users_manual/Simple_Endpoint_Discovery.htm

[^36]: https://mcp.so/server/mcp-registry-server

[^37]: https://docs.agentwire.io/quickstart/build

[^38]: https://blog.christianposta.com/understanding-mcp-authorization-step-by-step/

[^39]: https://maritimeconnectivity.net/mcp-documents/

[^40]: https://emas.in.tu-clausthal.de/2023/papers/EMAS_2023_paper_2075.pdf

[^41]: https://github.com/OAI/OpenAPI-Specification

[^42]: https://www.dhiwise.com/post/Discover what JSON-RPC is and how it works with practical examples. Compare it to other RPC protocols—a must-read for developers and tech enthusiasts.

[^43]: https://blog.devgenius.io/well-known-locations-a-reserved-uri-path-prefix-5277b2f37db7

[^44]: https://stackoverflow.com/questions/41660658/openapi-or-swagger-json-auto-discovery

[^45]: https://developer.electroneum.com/etn-sc-client/interacting-with-etn-sc/json-rpc-server

[^46]: https://en.wikipedia.org/wiki/Well-known_URI

[^47]: https://swagger.io/docs/specification/v3_0/about/

[^48]: https://docs.opendaylight.org/projects/jsonrpc/en/latest/dev-guide.html

[^49]: https://www.jsonrpc.org/specification

