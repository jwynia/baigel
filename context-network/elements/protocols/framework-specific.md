# Framework-Specific Protocols

## Overview
This document covers communication protocols and patterns used by popular agent frameworks including AutoGPT, CrewAI, and BabyAGI. While these aren't standardized protocols like MCP or A2A, they represent important patterns in multi-agent systems that BAIGEL must support for comprehensive interoperability.

## Classification
- **Domain:** Framework Protocols
- **Stability:** Variable
- **Abstraction:** Implementation-Specific
- **Confidence:** Medium

## CrewAI Protocol

### Architecture
CrewAI uses a role-based multi-agent system with sophisticated task delegation and autonomous communication patterns.

### Agent Definition
```python
class CrewAIAgent:
    role: str           # Agent's expertise/specialty
    goal: str           # What the agent aims to achieve
    backstory: str      # Context that shapes behavior
    tools: List[Tool]   # Available capabilities
    llm: Any           # Underlying language model
    max_iter: int      # Iteration limit
    memory: bool       # Enable memory persistence
```

### Communication Patterns

#### Autonomous Inter-Agent Messaging
```python
# Agents communicate without human intervention
{
    "type": "agent_message",
    "from": "researcher_agent",
    "to": "analyzer_agent",
    "message": {
        "intent": "request_analysis",
        "data": { /* research findings */ },
        "priority": "high",
        "deadline": "2025-01-01T12:00:00Z"
    }
}
```

#### Task Delegation Protocol
```python
{
    "type": "task_delegation",
    "delegator": "manager_agent",
    "delegate": "specialist_agent",
    "task": {
        "id": "task_123",
        "description": "Analyze market data",
        "input": { /* task data */ },
        "expected_output": "Market analysis report",
        "tools": ["data_analyzer", "chart_generator"]
    }
}
```

#### Knowledge Sharing
```python
{
    "type": "knowledge_share",
    "agent": "expert_agent",
    "knowledge": {
        "topic": "market_trends",
        "insights": [ /* findings */ ],
        "confidence": 0.85,
        "sources": [ /* references */ ]
    },
    "recipients": ["all"] # or specific agent IDs
}
```

### Process Management

#### Sequential Workflow
```python
crew = Crew(
    agents=[agent1, agent2, agent3],
    tasks=[task1, task2, task3],
    process=Process.sequential  # Execute in order
)
```

#### Parallel Workflow
```python
crew = Crew(
    agents=[agent1, agent2, agent3],
    tasks=[task1, task2, task3],
    process=Process.parallel  # Execute simultaneously
)
```

### Advanced Features
- **Caching**: Results cached for efficiency
- **Callbacks**: Hooks for monitoring and intervention
- **Rate Limiting**: Control API usage
- **Memory**: Long-term context retention
- **Tools**: Extensible tool integration

## AutoGPT Protocol

### Architecture
AutoGPT uses an orchestrated multi-agent system with specialized roles communicating through shared memory and recursive feedback loops.

### Agent Roles

#### Planner Agent
```python
{
    "role": "planner",
    "responsibilities": [
        "task_decomposition",
        "dependency_analysis",
        "resource_allocation",
        "timeline_creation"
    ],
    "communication": {
        "publishes": ["task_queue", "execution_plan"],
        "subscribes": ["goal_updates", "progress_reports"]
    }
}
```

#### Retriever Agent
```python
{
    "role": "retriever",
    "responsibilities": [
        "information_gathering",
        "web_search",
        "database_queries",
        "api_calls"
    ],
    "communication": {
        "publishes": ["retrieved_data", "source_metadata"],
        "subscribes": ["information_requests"]
    }
}
```

#### Synthesizer Agent
```python
{
    "role": "synthesizer",
    "responsibilities": [
        "data_compilation",
        "report_generation",
        "insight_extraction",
        "conclusion_formulation"
    ],
    "communication": {
        "publishes": ["final_output", "synthesis_report"],
        "subscribes": ["analysis_results", "retrieved_data"]
    }
}
```

### Communication Mechanisms

#### Shared Memory Buffer
```python
class SharedMemory:
    def __init__(self):
        self.buffer = {
            "goals": [],
            "tasks": [],
            "results": {},
            "context": {},
            "errors": []
        }
    
    def publish(self, channel: str, data: Any):
        self.buffer[channel].append({
            "timestamp": datetime.now(),
            "data": data
        })
    
    def subscribe(self, channel: str) -> List[Any]:
        return self.buffer.get(channel, [])
```

#### Recursive Feedback Loop
```python
{
    "type": "feedback",
    "iteration": 3,
    "from_agent": "synthesizer",
    "to_agent": "planner",
    "feedback": {
        "status": "incomplete",
        "missing": ["market_analysis", "competitor_data"],
        "suggestions": ["retrieve additional sources", "refine search query"]
    }
}
```

#### Orchestrator Coordination
```python
{
    "type": "orchestrator_command",
    "command": "execute_phase",
    "phase": "information_gathering",
    "agents": ["retriever_1", "retriever_2"],
    "timeout": 300,
    "success_criteria": {
        "min_sources": 5,
        "quality_threshold": 0.7
    }
}
```

## BabyAGI Protocol

### Architecture
BabyAGI implements a minimalist autonomous task management system with iterative task generation and prioritization.

### Core Components

#### Task Manager
```python
class TaskManager:
    def __init__(self):
        self.task_queue = PriorityQueue()
        self.completed_tasks = []
        self.task_id_counter = 0
    
    def create_task(self, description: str, priority: int):
        task = {
            "id": self.task_id_counter,
            "description": description,
            "priority": priority,
            "status": "pending",
            "created_at": datetime.now()
        }
        self.task_queue.put((priority, task))
        self.task_id_counter += 1
```

### Communication Pattern

#### Task Queue Messages
```python
{
    "type": "task_update",
    "task_id": 42,
    "status": "in_progress",
    "executor": "execution_agent",
    "progress": 0.6,
    "estimated_completion": "2025-01-01T10:30:00Z"
}
```

#### Task Generation
```python
{
    "type": "generate_tasks",
    "context": {
        "completed_task": {
            "id": 41,
            "description": "Research market trends",
            "result": { /* task results */ }
        },
        "objective": "Create market analysis report"
    },
    "generated_tasks": [
        {
            "description": "Analyze competitor strategies",
            "priority": 8
        },
        {
            "description": "Forecast market growth",
            "priority": 7
        }
    ]
}
```

#### Task Prioritization
```python
{
    "type": "reprioritize",
    "reason": "new_information",
    "changes": [
        {"task_id": 43, "old_priority": 5, "new_priority": 9},
        {"task_id": 44, "old_priority": 7, "new_priority": 3}
    ]
}
```

### Execution Loop
```python
while not objective_complete:
    # 1. Pull highest priority task
    task = task_queue.get_next()
    
    # 2. Execute task
    result = execution_agent.execute(task)
    
    # 3. Store result
    completed_tasks.append({
        "task": task,
        "result": result
    })
    
    # 4. Generate new tasks based on result
    new_tasks = task_creation_agent.create_tasks(
        objective=objective,
        result=result,
        task_description=task["description"],
        task_list=task_queue.get_all()
    )
    
    # 5. Reprioritize all tasks
    task_queue = prioritization_agent.prioritize(
        objective=objective,
        task_queue=task_queue,
        new_tasks=new_tasks
    )
```

## Comparative Analysis

### Communication Complexity
| Framework | Communication Style | State Management | Coordination |
|-----------|-------------------|------------------|--------------|
| **CrewAI** | Decentralized P2P | Distributed | Autonomous |
| **AutoGPT** | Shared Memory | Centralized Buffer | Orchestrated |
| **BabyAGI** | Task Queue | Centralized Queue | Sequential |

### Message Patterns
| Framework | Primary Pattern | Secondary Pattern | Feedback Mechanism |
|-----------|----------------|-------------------|-------------------|
| **CrewAI** | Direct Messaging | Task Delegation | Knowledge Sharing |
| **AutoGPT** | Memory Publishing | Recursive Loops | Orchestrator Commands |
| **BabyAGI** | Queue Updates | Task Generation | Priority Adjustment |

## Integration with BAIGEL

### Adapter Architecture
```python
class FrameworkAdapter(ABC):
    @abstractmethod
    def translate_to_baigel(self, message: Dict) -> BAIGELMessage:
        pass
    
    @abstractmethod
    def translate_from_baigel(self, message: BAIGELMessage) -> Dict:
        pass
    
    @abstractmethod
    def handle_state_sync(self, state: Dict) -> None:
        pass
```

### CrewAI Adapter
```python
class CrewAIAdapter(FrameworkAdapter):
    def translate_to_baigel(self, message: Dict) -> BAIGELMessage:
        return BAIGELMessage(
            type="agent_communication",
            source="crewai",
            content={
                "from_agent": message.get("from"),
                "to_agent": message.get("to"),
                "payload": message.get("message"),
                "metadata": {
                    "role": message.get("sender_role"),
                    "goal": message.get("sender_goal")
                }
            }
        )
```

### AutoGPT Adapter
```python
class AutoGPTAdapter(FrameworkAdapter):
    def __init__(self):
        self.shared_memory = SharedMemory()
    
    def translate_to_baigel(self, message: Dict) -> BAIGELMessage:
        if message["type"] == "memory_publish":
            return BAIGELMessage(
                type="state_update",
                source="autogpt",
                content={
                    "channel": message["channel"],
                    "data": message["data"],
                    "agent_role": message["publisher"]
                }
            )
```

### BabyAGI Adapter
```python
class BabyAGIAdapter(FrameworkAdapter):
    def translate_to_baigel(self, message: Dict) -> BAIGELMessage:
        if message["type"] == "task_update":
            return BAIGELMessage(
                type="task_status",
                source="babyagi",
                content={
                    "task_id": message["task_id"],
                    "status": message["status"],
                    "progress": message.get("progress"),
                    "executor": message.get("executor")
                }
            )
```

## Best Practices for Integration

### State Synchronization
- Map framework-specific state to BAIGEL's unified state model
- Handle state conflicts with clear precedence rules
- Implement state versioning for consistency

### Message Translation
- Preserve semantic meaning during translation
- Map framework-specific concepts to universal concepts
- Handle missing fields with sensible defaults

### Performance Optimization
- Cache translated messages when possible
- Batch message processing for efficiency
- Implement async message handling

### Error Handling
- Gracefully handle framework-specific errors
- Provide fallback mechanisms
- Log translation failures for debugging

## Future Considerations

### Emerging Patterns
- Graph-based orchestration (influenced by LangGraph)
- Hybrid memory models
- Cross-framework agent migration

### Standardization Opportunities
- Common task format
- Unified agent capability description
- Shared memory protocols

## Resources

### Framework Documentation
- [CrewAI Documentation](https://docs.crewai.com)
- [AutoGPT Repository](https://github.com/Significant-Gravitas/AutoGPT)
- [BabyAGI Repository](https://github.com/yoheinakajima/babyagi)

### Integration Examples
- Framework bridges
- Protocol converters
- State synchronizers

## Metadata
- **Created:** 2025-08-20
- **Last Updated:** 2025-08-20
- **Status:** Reference Implementation