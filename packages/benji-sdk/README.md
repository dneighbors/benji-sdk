# Benji SDK

Official TypeScript SDK for the [Benji](https://benji.so) API - Your personal life operating system.

## Installation

```bash
npm install benji-sdk
# or
pnpm add benji-sdk
# or
yarn add benji-sdk
```

## Quick Start

```typescript
import { configure, Todos, Habits } from "benji-sdk";

// Configure with your API key
configure({ apiKey: "your-api-key" });

// List today's todos
const { data } = await Todos.todosList({
  body: { screen: "today" }
});

console.log(data.todos);
```

## Getting Your API Key

1. Log in to [Benji](https://app.benji.so)
2. Go to Settings > API
3. Generate a new API key

## Available Modules

| Module | Description |
|--------|-------------|
| `Todos` | Create, list, update, and manage todos |
| `Habits` | Track daily habits |
| `Mood` | Log and retrieve mood entries |
| `Journal` | Create and manage journal entries |
| `Hydration` | Track water intake |
| `Fasting` | Manage fasting windows |
| `Workouts` | Log workouts and exercises |
| `Projects` | Organize todos into projects |
| `Tags` | Categorize items with tags |
| `Trips` | Plan and track travel |
| `PainEvents` | Log pain events for health tracking |

## Examples

### Todos

```typescript
import { configure, Todos } from "benji-sdk";

configure({ apiKey: "your-api-key" });

// Create a todo
await Todos.todosCreate({
  body: {
    title: "Buy groceries",
    priority: "high",
    dueDate: "2024-12-25"
  }
});

// List todos for today
const { data } = await Todos.todosList({
  body: { screen: "today" }
});

// Mark as complete
await Todos.todosToggle({
  body: { id: "todo-id" }
});

// Delete a todo
await Todos.todosDelete({
  body: { id: "todo-id" }
});
```

### Habits

```typescript
import { configure, Habits } from "benji-sdk";

configure({ apiKey: "your-api-key" });

// Create a habit
await Habits.habitsCreate({
  body: {
    name: "Drink 8 glasses of water",
    emoji: "💧"
  }
});

// List all habits
const { data } = await Habits.habitsList();

// Toggle habit completion for today
await Habits.habitsToggle({
  body: { id: "habit-id" }
});
```

### Mood Tracking

```typescript
import { configure, Mood } from "benji-sdk";

configure({ apiKey: "your-api-key" });

// Log your mood
await Mood.moodCreate({
  body: {
    level: 4,  // 1-5 scale
    notes: "Feeling great today!"
  }
});

// Get mood logs
const { data } = await Mood.moodList();
```

### Journal

```typescript
import { configure, Journal } from "benji-sdk";

configure({ apiKey: "your-api-key" });

// Create a journal entry
await Journal.journalCreate({
  body: {
    content: "Today was a productive day...",
    title: "Daily Reflection"
  }
});
```

## Custom Base URL

For self-hosted instances or development:

```typescript
configure({
  apiKey: "your-api-key",
  baseUrl: "https://your-instance.com/api/rest"
});
```

## TypeScript Support

This SDK is written in TypeScript and provides full type definitions for all API endpoints, request bodies, and responses.

```typescript
import type { TodosListResponse, HabitsCreateData } from "benji-sdk";
```

## Error Handling

```typescript
import { Todos } from "benji-sdk";

try {
  const { data, error, response } = await Todos.todosGet({
    body: { id: "invalid-id" }
  });

  if (error) {
    console.error("API Error:", error.message);
  }
} catch (err) {
  console.error("Network error:", err);
}
```

## License

MIT
