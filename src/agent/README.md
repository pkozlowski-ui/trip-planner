# Trip Planner AI Agent (Tambo)

This folder contains the Tambo-based AI agent used in the Plan Editor chat panel.

## What Tambo does in this app

**Tambo AI** is the conversational layer (backend + `@tambo-ai/react` SDK): it runs the chat, streams responses, and invokes tools on the client. The app registers **tools** (`get_plan_summary`, `search_places`, `add_location_to_plan`, `add_day`, `add_transport`) and a **context helper** (`current_plan_summary`). Tambo decides when to call which tool (e.g. `search_places` then `add_location_to_plan`) and receives plan context (title, days, location names, optional map bounds) on every message. When no plan is open, the agent gets `hasPlan: false` and is told to ask the user to open or create a plan. Tambo can also return **generative components** (`PlaceTiles`) registered in the provider and rendered in the chat UI; clicking a place tile shows that location on the main map.

## Configuration

- **API key**: Set `VITE_TAMBO_API_KEY` in `.env.local` (see project root `env.example`). Get a key at [Tambo Console](https://console.tambo.co/).
- **Custom instructions**: Configure the agent’s system prompt in your Tambo Cloud project settings. See [TAMBO_CUSTOM_INSTRUCTIONS.md](TAMBO_CUSTOM_INSTRUCTIONS.md) for instructions on using **PlaceTiles** (location tiles in chat; locations are shown on the main map when the user clicks a tile). Also configure general trip-planning behaviour (e.g. use `search_places` before `add_location_to_plan`, confirm before adding, use map bounds when relevant).

## Behaviour

- **Context**: The agent receives `current_plan_summary` on every message (plan title, days, location names, optional map bounds). When no plan is open, it gets `hasPlan: false` and a message to open or create a plan first.
- **Tools**: `get_plan_summary`, `search_places`, `add_location_to_plan`, `add_day`, `add_transport`. All tools that modify the plan check for an open plan and return clear errors when none is open or the requested day/location is missing.
- **Errors**: Tool errors are returned as `{ success: false, error: "..." }`. The chat UI shows an inline notification when sending a message fails.
