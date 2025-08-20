# Decision Record Index

## Purpose
This document serves as an index of all key decisions made for the project, providing a centralized registry for easy reference and navigation.

## Classification
- **Domain:** Documentation
- **Stability:** Dynamic
- **Abstraction:** Structural
- **Confidence:** Established

## Content

### Decision Records

| ID | Title | Status | Date | Domain | Summary |
|----|-------|--------|------|--------|---------|
| 001 | [Technical Stack](./technical-stack.md) | Accepted | 2025-08-20 | Architecture | Next.js 14, React, Shadcn UI, Zustand for frontend stack |
| 002 | [Client-Only Architecture](./client-only-architecture.md) | Accepted | 2025-08-20 | Architecture | No backend storage, browser-based with export/import |
| 003 | [Pure Static Architecture](./pure-static-architecture.md) | Accepted | 2025-08-20 | Architecture | Static export only, no API routes needed |

### Decision Status Legend

- **Proposed**: A decision that is under consideration but not yet accepted
- **Accepted**: A decision that has been accepted and is currently in effect
- **Deprecated**: A decision that is no longer recommended but still in effect
- **Superseded**: A decision that has been replaced by a newer decision

### Decision Categories

#### By Domain

- **Architecture**: 001, 002, 003
- **Frontend**: 001
- **Backend**: N/A (client-only architecture)
- **DevOps**: 003 (static deployment)
- **Data**: 002 (browser storage)
- **Security**: 002, 003 (client-side security)

<!-- For Research Projects -->
- **Methodology**: [List of decision IDs related to research methodology]
- **Data Collection**: [List of decision IDs related to data collection]
- **Analysis**: [List of decision IDs related to analysis approaches]
- **Interpretation**: [List of decision IDs related to interpretation frameworks]

<!-- For Creative Projects -->
- **Narrative**: [List of decision IDs related to narrative structure]
- **Characters**: [List of decision IDs related to character development]
- **Setting**: [List of decision IDs related to setting design]
- **Style**: [List of decision IDs related to stylistic choices]

<!-- For Knowledge Base Projects -->
- **Structure**: [List of decision IDs related to knowledge organization]
- **Content**: [List of decision IDs related to content creation]
- **Access**: [List of decision IDs related to access patterns]
- **Integration**: [List of decision IDs related to external integrations]

#### By Status
- **Proposed**: None
- **Accepted**: 001, 002, 003
- **Deprecated**: None
- **Superseded**: None

### Decision Relationships

- **Technical Stack (001)** → enables → **Client-Only Architecture (002)**
  - Modern frontend stack supports browser-based storage
  
- **Client-Only Architecture (002)** → enables → **Pure Static Architecture (003)**
  - No backend storage means no need for API routes
  
- **Pure Static Architecture (003)** → simplifies → **Technical Stack (001)**
  - Removes need for backend framework considerations

## Relationships
- **Parent Nodes:** [foundation/structure.md]
- **Child Nodes:** [All individual decision records]
- **Related Nodes:** 
  - [processes/creation.md] - relates-to - Creation processes affected by decisions
  - [foundation/principles.md] - implements - Decisions implement project principles

## Navigation Guidance
- **Access Context:** Use this document when looking for specific key decisions or understanding decision history
- **Common Next Steps:** From here, navigate to specific decision records of interest
- **Related Tasks:** Project review, onboarding new team members, planning new work, understanding rationale
- **Update Patterns:** This index should be updated whenever a new decision is added or a decision status changes

## Metadata
- **Created:** 2025-08-20
- **Last Updated:** 2025-08-20
- **Updated By:** Claude/Assistant

## Change History
- 2025-08-20: Initial creation of decision index
- 2025-08-20: Added technical stack, client-only, and pure static architecture decisions
