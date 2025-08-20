# OpenAI Functions

## Overview
OpenAI Functions (also known as Function Calling) is a feature of OpenAI's API that enables large language models to invoke external functions by generating structured JSON arguments. While not a standalone protocol like MCP or A2A, it represents a significant pattern in LLM-tool integration that has influenced the broader ecosystem.

## Classification
- **Domain:** Secondary Protocol
- **Stability:** Mature
- **Abstraction:** API Feature
- **Confidence:** High

## Technical Specification

### Core Components
- **`tools` Parameter**: Array of function definitions (replaced deprecated `functions`)
- **`tool_choice` Parameter**: Controls function selection behavior
- **JSON Schema**: Defines function parameters and types
- **Sequential Workflow**: Model generates call → Client executes → Returns result

### Function Definition Structure
```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "Get the current weather in a given location",
    "parameters": {
      "type": "object",
      "properties": {
        "location": {
          "type": "string",
          "description": "The city and state, e.g. San Francisco, CA"
        },
        "unit": {
          "type": "string",
          "enum": ["celsius", "fahrenheit"],
          "description": "The unit of temperature"
        }
      },
      "required": ["location"]
    }
  }
}
```

## Message Flow

### Request with Tools
```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "What's the weather in Boston?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get weather information",
        "parameters": { /* schema */ }
      }
    }
  ],
  "tool_choice": "auto"
}
```

### Model Response with Function Call
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "tool_calls": [{
        "id": "call_123",
        "type": "function",
        "function": {
          "name": "get_weather",
          "arguments": "{\"location\": \"Boston, MA\"}"
        }
      }]
    }
  }]
}
```

### Function Result Submission
```json
{
  "role": "tool",
  "tool_call_id": "call_123",
  "content": "{\"temperature\": 72, \"condition\": \"sunny\"}"
}
```

## Tool Choice Options

### Auto Mode
```json
"tool_choice": "auto"
```
- Model decides whether to call a function
- Most flexible option
- Default behavior

### Required Mode
```json
"tool_choice": "required"
```
- Forces the model to call at least one function
- Model chooses which function to call

### Specific Function
```json
"tool_choice": {
  "type": "function",
  "function": {"name": "specific_function"}
}
```
- Forces call to a specific function
- Useful for guided workflows

### None Mode
```json
"tool_choice": "none"
```
- Prevents any function calls
- Regular text response only

## Structured Outputs

### JSON Mode
```json
{
  "response_format": { "type": "json_object" }
}
```
- Ensures valid JSON output
- Available in GPT-4 and later

### Structured Output Schema
```json
{
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "response",
      "schema": { /* JSON Schema */ }
    }
  }
}
```
- Enforces specific JSON structure
- Stronger guarantees than JSON mode

## Limitations & Considerations

### Architectural Limitations
- **No Parallel Calls**: Single function per model turn
- **Sequential Workflow**: Must wait for execution before continuing
- **No Native Streaming**: Function calls block streaming responses
- **Vendor Lock-in**: Specific to OpenAI's API

### Implementation Challenges
- Client must handle function execution
- Error handling is client's responsibility
- No built-in retry mechanisms
- State management external to API

## Comparison with Protocol Standards

### vs MCP
| Aspect | OpenAI Functions | MCP |
|--------|-----------------|-----|
| **Scope** | API feature | Full protocol |
| **Portability** | OpenAI only | Vendor-neutral |
| **Discovery** | Static definition | Dynamic discovery |
| **Transport** | HTTP API | Multiple options |

### vs A2A
| Aspect | OpenAI Functions | A2A |
|--------|-----------------|-----|
| **Target** | Single model | Multi-agent |
| **Communication** | One-way | Bidirectional |
| **Security** | API key | Full auth stack |

## Adoption & Influence

### Direct Adoption
- **Azure OpenAI**: Full compatibility
- **OpenAI-compatible APIs**: Many providers support the format
- **LangChain**: Native support in tool chains

### Pattern Influence
- Inspired tool-calling patterns in other LLMs
- JSON Schema for parameter definition widely adopted
- Sequential execution model became standard

## Integration with BAIGEL

### Adapter Requirements
1. Parse OpenAI function format
2. Map to internal tool representation
3. Handle execution and result formatting
4. Manage sequential workflow

### Implementation Strategy
```python
class OpenAIFunctionAdapter:
    def convert_to_internal(self, openai_function):
        return {
            "type": "tool",
            "id": f"openai_{openai_function['name']}",
            "name": openai_function["name"],
            "description": openai_function["description"],
            "parameters": openai_function["parameters"],
            "protocol": "openai-functions"
        }
    
    def execute_function(self, function_call):
        # Map to internal tool execution
        tool = self.get_tool(function_call["name"])
        args = json.loads(function_call["arguments"])
        result = tool.execute(**args)
        return json.dumps(result)
```

## Best Practices

### Function Design
- Keep functions focused and atomic
- Use clear, descriptive names
- Provide detailed descriptions
- Define all parameters explicitly

### Error Handling
- Validate arguments before execution
- Return structured error messages
- Implement timeout mechanisms
- Log all function calls

### Performance Optimization
- Cache function results when appropriate
- Batch related operations
- Minimize function call overhead
- Consider async execution patterns

## Migration Path

### To MCP
1. Convert function definitions to MCP tools
2. Implement MCP server wrapper
3. Add capability discovery
4. Enable dynamic tool registration

### To A2A
1. Wrap functions as specialized agents
2. Implement Agent Cards
3. Add authentication layer
4. Enable agent-to-agent communication

## Resources

### Official Documentation
- [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [API Reference](https://platform.openai.com/docs/api-reference)
- [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)

### Community Resources
- Migration guides
- Best practices
- Integration examples

## Metadata
- **Created:** 2025-08-20
- **Last Updated:** 2025-08-20
- **API Version:** 2023-12-01-preview
- **Status:** Stable