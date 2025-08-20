# BAIGEL - Protocol-Agnostic Agent UI

**B**asic **A**gent **I**nterface for **G**eneral **E**xecution and **L**anguage models

A universal front-end for AI agents that works with any protocol - MCP, A2A, AG-UI, and more. Named after the "everything bagel" from "Everything Everywhere All at Once" because it brings everything together.

## Problem We're Solving

The AI agent ecosystem is fragmenting into incompatible protocols. Every UI needs custom code for each protocol, creating an N×M integration nightmare. BAIGEL provides a single, extensible front-end that works with any agent protocol through a plugin architecture.

## Key Features

- 🔌 **Protocol Agnostic**: Works with MCP, A2A, AG-UI, OpenAI Functions, and more
- 🧩 **Plugin Architecture**: Add new protocols without modifying core code
- 🎯 **Unified Experience**: Consistent UI regardless of underlying protocol
- ⚡ **Minimal Overhead**: < 10ms abstraction layer latency
- 🛠️ **Developer Friendly**: Clear APIs and patterns for extending

## Project Status

Currently in architecture and planning phase. See the [context network](./context-network/discovery.md) for detailed planning documents and design decisions.

## Getting Started
Context networks are intended to be used with an LLM agent that has file access to all of the files in the project folder. For people in software development professions, that can be agents they write. But, for most people, the easiest access to such agents is via IDE coding tools.

Set up the prompts (see below) and start a planning conversation and describe your project, your goals, your constraints, etc. When the plan looks good, let it enhance the context network. Then start with real tasks for the project.

## Cost
Because context networks are a relatively cutting-edge approach to collaboration with LLM AI agents, these tools do cost money and some of the best of them can cost more money than you may be expecting. The costs on such things are dropping and much of what we're doing with context networks is figuring out the ways to work that will be more widespread next year and beyond, when these costs drop. If these tools are too expensive for your budget, that probably means you need to wait a bit.

## Tools
Cursor (https://www.cursor.com/) is an all-in-one that comes with LLM chat and an agent that can act on the files.

Cursor is built on VSCode (https://code.visualstudio.com/), which is a more generic code/text editor that can have plugins added. One we use a lot with context networks is Cline (https://cline.bot/). Cline's agent can be pointed at a wide range of LLM APIs that you use your own keys/billing for or their own management of that. A popular solution is to use OpenRouter (https://openrouter.ai/) which lets you use most of the LLM models available today.

## Patterns
### Prompts
For whatever agent you use, you need to include instructions in the system prompt or custom instructions that tell it about context networks and how to navigate them. The prompt in /inbox/custom-instructions-prompt.md is the one a lot of people are using for Cline with Claude Sonnet as the model.

Add it in either your agent's configuration screen or via it's file-based prompt management system.

### Plan/Act and Specific Scope
Cline and many other agents have multiple modes, usually offering one that lets you have a conversation with it separate from it taking action on files. In Cline, that's "Plan". In that mode, it won't make any changes to your files.

Use that mode aggressively to get to a specific plan for what will happen when you toggle to act. That plan should have a clear definition of what "done" will look like, should be as close to a single action as possible.

That often means that the action is to detail out a list of tasks that you'll actually have the agent do separately, one at a time. The "do one thing" can mean break the existing scope down another level to get to a more detailed plan. 

Basically, the more specific the action that Act mode or its equivalent is given, the better job it will do at managing token budget, at not volunteering to do a bunch of extra things,  and the more likely it does something you've already had a chance to approve.

### Monitor and Interrupt
The more you actually read and monitor what your agent is doing for anything that you disagree with or sounds incorrect and step in to interrupt, the better your context network will mature. Like hiring a new assistant, where for the first few weeks, you have to tell them your preferences and ways you want things done, it pays off over the long haul.

Interrupt, flip to Plan mode, and ask things like:

* How can we document into the context network a way of working so we don't repeat (the problem/misunderstanding above)?
* I'd really prefer we always write out a plan with tasks before doing things ad hoc. How can we clarify what's in the context network to make that our process going forward?


### Retrospective
At the end of tasks and periodically AS a new task, ask how things could be improved. For task end, "What from this conversation and task should be documented in the context network?" For periodic retrospectives, "What have we learned in this project that could be used to improve the context network for our efforts going forward?"