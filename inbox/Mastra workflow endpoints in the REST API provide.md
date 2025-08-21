<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Mastra workflow endpoints in the REST API provide enough information in JSON schemas to build the UI they have in their playground. Is there a vendor-agnostic  API protocol for that like A2A/MCP? If not, is there a range of other frameworks doing similar that I could support all of them somehow in a UI where adding those endpoints produces a new screen based on the JSON form schema?

Based on my research, I can provide you with a comprehensive answer about vendor-agnostic protocols for building UI from JSON schemas, particularly in the context of Mastra workflows and similar frameworks.

# Vendor-Agnostic JSON Schema to UI Protocols

## Current Protocol Landscape

**There is no single dominant vendor-agnostic API protocol like A2A/MCP specifically for JSON schema to UI generation**. However, there are several related protocols and frameworks that address different aspects of this problem:[^1][^2]

### Model Context Protocol (MCP) vs Agent-to-Agent (A2A)

**MCP** is Anthropic's protocol for connecting AI models to external tools and data sources, focusing on structured tool invocation rather than UI generation. **A2A** is Google's protocol for agent-to-agent communication, designed for multi-agent coordination rather than form generation.[^2][^3][^4][^1]

Neither directly addresses your use case of generating UI forms from JSON schemas, though MCP servers do expose OpenAPI specifications that could theoretically be used for form generation.[^5]

## JSON Schema to Form UI Frameworks

### Established Libraries

Several mature libraries provide JSON Schema to form UI generation:

**React JSON Schema Form (RJSF)** - The most widely adopted solution with extensive customization options and theme support for Material-UI, Bootstrap, and other frameworks.[^6][^7]

**JSON Forms** - Supports React, Angular, and Vue with separate data and UI schemas for fine-grained control over form layout and styling.[^8][^9]

**Form.io** - Commercial platform with open-source core that provides drag-and-drop form building and JSON schema generation.[^10]

### Emerging Solutions

**Autoform** - Modern, headless form generator with TypeScript support and modular architecture supporting multiple schema providers (Zod, JSON Schema) and UI frameworks.[^11]

**@react-formgen/json-schema** - Lightweight, type-safe solution with built-in validation using AJV and Zustand for state management.[^12]

## Mastra's Approach

Mastra workflows expose their structure through:

- **OpenAPI specification** at `http://localhost:4111/openapi.json`[^5]
- **Swagger UI** for API exploration at `http://localhost:4111/swagger-ui`[^5]
- **JSON Schema** definitions for workflow inputs via `triggerSchema` and step schemas[^13]

The playground UI is built by consuming these schemas, demonstrating that the information is sufficient for UI generation.[^5]

## Building a Universal UI Framework

To support multiple workflow frameworks with a single UI, you could:

### 1. Standardize on OpenAPI 3.1+

OpenAPI 3.1 supports JSON Schema directly, allowing you to consume schemas from any framework that exposes OpenAPI specifications.[^14]

### 2. Use JSON Forms Architecture

Implement a system similar to JSON Forms with:

- **Data Schema**: The workflow's input/output schema
- **UI Schema**: Layout and presentation rules
- **Custom Renderers**: Framework-specific components


### 3. Framework Adapter Pattern

Create adapters for different workflow frameworks:

```typescript
interface WorkflowAdapter {
  getSchema(endpoint: string): Promise<JSONSchema>
  getUISchema?(endpoint: string): Promise<UISchema>
  executeWorkflow(endpoint: string, data: any): Promise<any>
}

class MastraAdapter implements WorkflowAdapter {
  async getSchema(endpoint: string): Promise<JSONSchema> {
    const openapi = await fetch(`${endpoint}/openapi.json`)
    return extractSchemaFromOpenAPI(openapi)
  }
}
```


### 4. Universal Form Component

Build a component that can adapt to any schema-exposing workflow framework:

```typescript
<UniversalWorkflowForm
  adapter={new MastraAdapter()}
  endpoint="http://localhost:4111"
  workflowName="myWorkflow"
  onSubmit={(data) => executeWorkflow(data)}
/>
```


## Recommendations

1. **Start with JSON Forms or RJSF** as your base form rendering engine due to their maturity and flexibility[^9][^6]
2. **Use OpenAPI 3.1 as your common interface** since most modern workflow frameworks expose this[^14]
3. **Build framework adapters** rather than waiting for a universal protocol to emerge
4. **Consider SpiffWorkflow** as another reference implementation that uses JSON Schema extensively for form generation[^15]

The ecosystem is moving toward standardization but hasn't converged on a single protocol yet. Building adapters for existing frameworks while using established JSON Schema form libraries gives you the best of both worlds - immediate functionality with future flexibility.[^16]
<span style="display:none">[^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49][^50][^51][^52][^53][^54][^55][^56][^57][^58][^59][^60]</span>

<div style="text-align: center">⁂</div>

[^1]: https://www.anthropic.com/news/model-context-protocol

[^2]: https://docs.anthropic.com/en/docs/mcp

[^3]: https://akka.io/blog/mcp-a2a-acp-what-does-it-all-mean

[^4]: https://www.stride.build/blog/agent-to-agent-a2a-vs-model-context-protocol-mcp-when-to-use-which

[^5]: https://mastra.ai/docs/server-db/local-dev-playground

[^6]: https://github.com/rjsf-team/react-jsonschema-form

[^7]: https://stackoverflow.com/questions/49037130/how-to-use-react-jsonschema-form-with-material-ui

[^8]: https://jsonforms.io/docs/integrations/react/

[^9]: https://jsonforms.io

[^10]: https://stackoverflow.com/questions/20241059/how-to-create-a-form-from-a-json-schema

[^11]: https://autoform.vantezzen.io/docs/technical/structure

[^12]: https://www.npmjs.com/package/@react-formgen/json-schema

[^13]: https://mastra.ai/docs/workflows-legacy/overview

[^14]: https://stackoverflow.com/questions/71121399/how-do-i-incorporate-json-schema-into-my-openapi-file

[^15]: https://spiff-arena.readthedocs.io/en/latest/how_to_guides/building_diagrams/use_user_tasks_and_forms.html

[^16]: https://getstream.io/blog/agent2agent-vs-mcp/

[^17]: https://learn.microsoft.com/en-us/rest/api/appservice/workflow-triggers/get-schema-json?view=rest-appservice-2024-11-01

[^18]: https://json-schema.org/understanding-json-schema/basics

[^19]: https://mastra.ai/docs/workflows/inngest-workflow

[^20]: https://mastra.ai/reference/agents/generate

[^21]: https://mastra.ai/docs/workflows/using-with-agents-and-tools

[^22]: https://www.youtube.com/watch?v=nBLXpS6YoUk

[^23]: https://mastra.ai/docs/getting-started/installation

[^24]: https://mastra.ai/docs/workflows/overview

[^25]: https://github.com/vercel/ai/issues/7325

[^26]: https://a2aprotocol.ai/docs/guide/a2a-mcp-integration

[^27]: https://www.claudemcp.com/en

[^28]: https://a2acn.com/en/specification/

[^29]: https://devblogs.microsoft.com/blog/can-you-build-agent2agent-communication-on-mcp-yes

[^30]: https://www.descope.com/learn/post/mcp

[^31]: https://auth0.com/blog/mcp-vs-a2a/

[^32]: https://www.youtube.com/watch?v=CQywdSdi5iA

[^33]: https://www.solo.io/blog/deep-dive-mcp-and-a2a-attack-vectors-for-ai-agents

[^34]: https://www.koyeb.com/blog/a2a-and-mcp-start-of-the-ai-agent-protocol-wars

[^35]: https://inten.to/blog/how-to-understand-the-difference-between-api-mcp-and-a2a-in-enterprise-localization/

[^36]: https://www.reddit.com/r/reactjs/comments/ncvtmt/create_forms_from_openapi_json_schemas/

[^37]: https://www.reddit.com/r/reactjs/comments/1cm7gjk/defining_a_form_ui_in_json_schema/

[^38]: https://codup.co/blog/building-dynamic-forms-in-react-with-json-schema-and-material-ui/

[^39]: https://jsonforms.io/examples/gen-uischema

[^40]: https://talk.openmrs.org/t/dynamic-form-ui-generation-from-json-schema/6707

[^41]: https://www.reddit.com/r/reactjs/comments/1f6ahp1/looking_for_feedback_json_schemadriven_dynamic/

[^42]: https://kubevela.net/docs/v1.0/platform-engineers/openapi-v3-json-schema

[^43]: https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema

[^44]: https://www.jsonschemavalidator.net

[^45]: https://jsonform.github.io/jsonform/playground/index.html

[^46]: https://www.youtube.com/watch?v=ASuffHnKSSw

[^47]: https://jsonforms.io/examples/gen-uischema/

[^48]: https://prismatic.io/docs/jsonforms/playground/

[^49]: https://surveyjs.io/survey-creator/documentation/get-started-angular

[^50]: https://docs.oracle.com/en/middleware/idm/unified-directory/12.2.1.4/oudag/managing-directory-schema.html

[^51]: https://experienceleague.adobe.com/en/docs/experience-manager-65/content/forms/developer-reference/programming-aem-forms-jee/performing-service-operations-using-apis/rendering-forms

[^52]: https://start.docuware.com/docuware-forms

[^53]: https://www.npmjs.com/package/@uform/react-schema-renderer

[^54]: https://build.fhir.org/ig/HL7/sdc/rendering.html

[^55]: https://www.zebra.com/us/en/blog/posts/2024/easy-way-to-create-digital-forms-automate-workflows-go-paperless-with-sap.html

[^56]: https://docs.oracle.com/cd/E52734_01/oud/OUDAG/schema_model.htm

[^57]: https://experienceleague.adobe.com/en/docs/campaign-classic/using/designing-content/web-forms/form-rendering

[^58]: https://developer.harness.io/docs/internal-developer-portal/flows/dynamic-picker/

[^59]: https://react.formilyjs.org

[^60]: https://sf.freddiemac.com/docs/pdf/fact-sheet/scif-rendering-options.pdf

