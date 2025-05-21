# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GAIA (General Purpose AI Assistant) is an advanced personal AI assistant built with Next.js and React. It provides a comprehensive solution for managing users' digital lives, including chat, calendar, email, goals, notes, and internet browsing capabilities.

## Development Commands

- **Start development server:**

  ```bash
  # Using Turbopack (faster)
  pnpm dev

  # Using Webpack
  pnpm dev:webpack
  ```

- **Type checking:**

  ```bash
  pnpm type
  ```

- **Linting:**

  ```bash
  # Run linting
  pnpm lint

  # Fix linting issues
  pnpm lint:fix
  ```

- **Code formatting:**

  ```bash
  pnpm format
  ```

- **Building for production:**

  ```bash
  pnpm build
  ```

- **Start production server:**
  ```bash
  pnpm start
  ```

## Architecture and Key Components

### Technology Stack

- **Next.js 15.3.1** - App Router for routing and layout
- **React 19.1.0** - UI component library
- **TypeScript** - Static typing
- **Tailwind CSS 4.1.5** - Utility-first CSS framework
- **Redux Toolkit** - State management
- **Framer Motion** - Animation library

### Core Features

1. **AI Chat Interface** - Real-time streaming responses using EventSource API
2. **Calendar Integration** - Personal calendar management
3. **Mail Integration** - Email client functionality
4. **Goal Tracking** - Personal goal management system
5. **Deep Search** - Web search integration for AI responses
6. **Document Processing** - File uploads and PDF viewing
7. **Image Generation** - AI image generation capabilities

### Project Structure

- `src/app/` - Next.js App Router pages
  - `(landing)/` - Landing page routes
  - `(main)/` - Main application routes
- `src/components/` - Reusable UI components
- `src/hooks/` - Custom React hooks
- `src/redux/` - Redux state management
- `src/services/` - API services
- `src/types/` - TypeScript type definitions

### Key Architectural Patterns

1. **Client-Server Architecture** - Frontend communicates with AI backend via API
2. **Streaming Responses** - Uses Server-Sent Events (SSE) for real-time AI responses
3. **Component Composition** - Modular components with clear separation of concerns
4. **State Management** - Redux for global state, React hooks for component-level state
5. **Responsive Design** - Mobile-first approach with Tailwind CSS

### Important API Concepts

- **useChatStream** - Custom hook for streaming AI responses
- **ApiService** - Service for handling API requests
- **Redux Slices** - Define global state and reducers

### Streaming and Tool Data Persistence

#### Email Compose Data Issue (Fixed)
- **Problem**: Email compose components were visible during streaming but disappeared after stream completion
- **Root Cause**: Frontend wasn't preserving email data when stream ended
- **Fix Applied**: Updated `useChatStream.ts:handleStreamClose()` to explicitly preserve all tool data
- **Files Modified**: `/src/hooks/useChatStream.ts` - Added preservation of email_compose_data and other tool outputs

#### Tool Data Flow in Frontend
1. Stream data received → `useChatStream.ts:handleStreamEvent()` processes chunks
2. Tool data parsed → `useStreamDataParser.ts:parseStreamData()` extracts structured data
3. Stream ends → `useChatStream.ts:handleStreamClose()` preserves all tool data in final message
4. Components render → `TextBubble.tsx` conditionally renders tool-specific components

#### Adding New Tool Components
To add a new tool component (similar to EmailComposeSection):
1. Create component in `/components/Chat/ChatBubbles/Bot/`
2. Add parsing logic in `useStreamDataParser.ts:parseStreamData()`  
3. Add preservation logic in `useChatStream.ts:handleStreamClose()`
4. Add conditional rendering in `TextBubble.tsx`

#### Stream Data Preservation Pattern
```typescript
// In handleStreamClose(), always preserve existing tool data:
updateBotMessage({
  loading: false,
  ...(refs.current.botMessage.tool_data && {
    tool_data: refs.current.botMessage.tool_data
  })
});
```

## Working with the Codebase

When making changes:

1. Follow existing component patterns and naming conventions
2. Use Tailwind for styling to maintain consistency
3. Keep components small and focused on a single responsibility
4. Ensure responsive design works on all screen sizes
5. Use TypeScript types for all props and state

After making changes, always run the type checker and linter before submitting:

```bash
pnpm type && pnpm lint
```
