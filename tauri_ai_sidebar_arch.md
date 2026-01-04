# Architecture Document - AI Sidebar App

## 1. Project Overview

A macOS sidebar application that provides quick access to AI chat capabilities with integrated productivity features including window management, app shortcuts, clipboard history, and web scraping.

### Tech Stack
- **Frontend**: React 18+ with TypeScript (strict mode)
- **State Management**: Zustand for client state
- **Data Fetching**: SWR for server state and caching
- **Validation**: Zod for runtime type safety
- **Backend/Native**: Tauri v2
- **AI Integration**: Vercel AI SDK
- **Build Tool**: Vite

---

## 2. System Architecture

### 2.1 Application Layers

**Presentation Layer (React Components)**
- Responsible for UI rendering and user interactions
- Completely decoupled from business logic
- Receives data through props and custom hooks
- Emits events through callbacks

**Application Layer (Hooks & Services)**
- Contains business logic and orchestration
- Manages side effects through SWR and custom hooks
- Coordinates between Tauri backend and frontend state
- Handles AI SDK integration

**Domain Layer (Types & Schemas)**
- Defines core domain models with Zod schemas
- Provides type-safe data structures
- Ensures data integrity across layers
- Single source of truth for data shapes

**Infrastructure Layer (Tauri Commands)**
- Native system integrations (window management, file system)
- Persistent storage operations
- System tray and global shortcuts
- IPC communication between Rust and TypeScript

---

## 3. Core Domain Models

### 3.1 AI Chat Domain

**Message Model**
- Unique identifier (UUID v4)
- Role: user, assistant, or system
- Content: string or structured content array
- Timestamp (ISO 8601)
- Metadata: model used, token count, cost
- Parent message ID for threading
- Status: pending, streaming, completed, error

**Conversation Model**
- Unique identifier (UUID v4)
- Title: string (auto-generated or user-defined)
- Messages: array of Message models
- Created/updated timestamps
- Metadata: total tokens, total cost, model preferences
- Tags: array of strings for organization
- Pinned status

**AI Configuration Model**
- Provider: anthropic, openai, custom
- API key: encrypted string
- Model: string identifier
- Parameters: temperature, max tokens, top P
- System prompt: optional string
- Custom endpoint: optional URL for custom providers

### 3.2 Window Management Domain

**WindowState Model**
- Application identifier (bundle ID)
- Window title: string
- Position: x, y coordinates
- Size: width, height dimensions
- Display index: number
- Minimized/maximized state
- Focus order: number

**WindowLayout Model**
- Unique identifier (UUID v4)
- Name: user-defined string
- Description: optional string
- Window states: array of WindowState models
- Created/updated timestamps
- Thumbnail: optional base64 encoded screenshot
- Hotkey binding: optional key combination

**WindowAction Model**
- Action type: move, resize, minimize, maximize, close, focus
- Target window: application identifier or window title pattern
- Parameters: position, size, or display target
- Sequence order: for multi-step actions

### 3.3 App Shortcuts Domain

**AppShortcut Model**
- Unique identifier (UUID v4)
- Application name: string
- Application path: absolute file path
- Bundle identifier: macOS bundle ID
- Icon: base64 encoded or file path
- Position: number for ordering
- Hotkey binding: optional key combination
- Last launched: timestamp

### 3.4 Clipboard History Domain

**ClipboardEntry Model**
- Unique identifier (UUID v4)
- Content: plain text string
- Source application: bundle ID or name
- Timestamp: ISO 8601
- Character count: number
- Preview: truncated string for UI (first 100 chars)
- Pinned status
- Tags: array of strings

### 3.5 Web Scraping Domain

**ScrapingRequest Model**
- Unique identifier (UUID v4)
- URL: validated URL string
- Prompt: user instruction for AI processing
- Status: pending, fetching, processing, completed, error
- Created timestamp

**ScrapingResult Model**
- Request ID: references ScrapingRequest
- Raw content: scraped HTML/text
- AI response: processed result
- Metadata: fetch time, content length, status code
- Completed timestamp
- Error: optional error details

---

## 4. State Management Strategy

### 4.1 Zustand Stores

**UI Store**
- Sidebar visibility and animation state
- Active view/tab
- Theme preferences
- Window dimensions and position
- Hover state for edge detection
- Modal/dialog states

**Settings Store**
- AI provider configurations (per provider)
- Active provider selection
- Window management preferences
- Clipboard history settings (max entries, retention period)
- App shortcut configurations
- Keyboard shortcut bindings
- Privacy settings (analytics, error reporting)

**Chat Store**
- Active conversation ID
- Message input state
- Streaming state
- Current model selection
- Temporary conversation context

### 4.2 SWR Cache Keys

**Pattern**: `resource:action:identifier:params`

**Conversations List**
- Key: `conversations:list:${filter}:${sort}`
- Revalidation: on focus, manual refresh

**Single Conversation**
- Key: `conversation:detail:${conversationId}`
- Revalidation: on mutation

**Clipboard History**
- Key: `clipboard:list:${limit}:${filter}`
- Revalidation: on interval (5 seconds)

**Window Layouts**
- Key: `layouts:list`
- Revalidation: on mutation

**App Shortcuts**
- Key: `shortcuts:list`
- Revalidation: on mutation

**Scraping Results**
- Key: `scraping:result:${requestId}`
- Revalidation: disabled after completion

### 4.3 State Persistence

**Local Storage (Tauri)**
- User preferences
- AI API keys (encrypted)
- Window layouts
- App shortcuts
- Pinned clipboard entries
- Conversation metadata (not full messages)

**SQLite Database (Tauri)**
- Full conversation history with messages
- Clipboard history with full content
- Scraping request history
- Usage statistics and analytics

**In-Memory Only**
- Current streaming AI responses
- Temporary UI states
- WebSocket connections
- Real-time clipboard monitoring

---

## 5. AI SDK Integration

### 5.1 Provider Configuration

**Supported Providers**
- Anthropic (Claude)
- OpenAI (GPT models)
- Custom providers via OpenAI-compatible endpoints

**Provider Interface**
- API key management
- Model selection
- Parameter customization
- Error handling patterns
- Rate limit handling

### 5.2 Streaming Architecture

**Message Streaming**
- Server-sent events for token streaming
- Incremental UI updates per token/chunk
- Abort controller for cancellation
- Error boundary for stream failures

**State Updates During Streaming**
- Optimistic updates to message list
- Token-by-token content accumulation
- Final message persistence after completion
- Rollback on error

### 5.3 Context Management

**Conversation Context**
- Message history pruning for token limits
- System prompt injection
- Context window calculation
- Multi-turn conversation handling

**External Context**
- Clipboard content injection
- Web scraping result inclusion
- File content attachment
- Selected text from other apps

---

## 6. Tauri Backend Architecture

### 6.1 Command Structure

**Command Pattern**: Verb-noun naming convention

**AI Commands**
- `stream_chat_message`: Initiate AI chat with streaming
- `cancel_chat_stream`: Abort ongoing stream
- `validate_api_key`: Test provider credentials

**Window Management Commands**
- `get_window_list`: Retrieve all open windows
- `get_window_info`: Get details of specific window
- `set_window_position`: Move window to coordinates
- `set_window_size`: Resize window
- `apply_window_layout`: Apply saved layout
- `capture_current_layout`: Save current window arrangement

**Clipboard Commands**
- `start_clipboard_monitor`: Begin monitoring system clipboard
- `stop_clipboard_monitor`: End monitoring
- `get_clipboard_history`: Retrieve history with pagination
- `clear_clipboard_history`: Remove all or filtered entries

**Web Scraping Commands**
- `fetch_webpage_content`: Download and extract page content
- `scrape_with_prompt`: Fetch page and process with AI

**App Shortcuts Commands**
- `launch_application`: Open app by path or bundle ID
- `get_installed_apps`: List available applications
- `get_app_icon`: Retrieve application icon

**System Commands**
- `show_sidebar`: Display sidebar with animation
- `hide_sidebar`: Hide sidebar with animation
- `register_global_hotkey`: Set up system-wide shortcut
- `get_system_info`: Retrieve system details

### 6.2 Event System

**Frontend to Backend Events**
- User-initiated actions
- Settings changes
- State synchronization requests

**Backend to Frontend Events**
- Clipboard content changes
- Window state changes
- System hotkey triggers
- File system changes
- Network status changes

### 6.3 Storage Strategy

**File-based Storage**
- Location: Platform-specific app data directory
- Encryption: API keys and sensitive data using platform keychain
- Backup: Automatic backup of critical data
- Migration: Version-aware schema migrations

**Database Schema**

**Conversations Table**
- Primary key: UUID
- Columns: title, created_at, updated_at, metadata JSON
- Indexes: created_at, updated_at

**Messages Table**
- Primary key: UUID
- Foreign key: conversation_id
- Columns: role, content, timestamp, metadata JSON
- Indexes: conversation_id, timestamp

**Clipboard Table**
- Primary key: UUID
- Columns: content, source_app, timestamp, character_count, pinned
- Indexes: timestamp, pinned

**Window Layouts Table**
- Primary key: UUID
- Columns: name, description, layout_data JSON, created_at, updated_at
- Indexes: name, created_at

**Scraping History Table**
- Primary key: UUID
- Columns: url, prompt, result, status, created_at, completed_at
- Indexes: created_at, status

---

## 7. Feature Implementation Details

### 7.1 Sidebar Behavior

**Edge Detection**
- Monitor mouse position via Tauri event
- Trigger zone: leftmost 5 pixels of screen
- Debounce: 100ms before showing
- Hover duration: 200ms before animation

**Animation Strategy**
- CSS transitions for smooth slide-in/out
- Transform-based animation for performance
- Backdrop blur for modern appearance
- Preserve animation state in Zustand

**Focus Management**
- Auto-focus input field on show
- Trap focus within sidebar when visible
- Return focus to previous app on hide
- Escape key to close

### 7.2 AI Chat Implementation

**Message Flow**
- User submits message
- Optimistic update: add user message to UI
- Call Tauri command with conversation context
- Stream response tokens
- Update assistant message incrementally
- Persist complete message on stream end

**Error Handling**
- Network failures: retry with exponential backoff
- API errors: display user-friendly messages
- Token limit exceeded: suggest context pruning
- Invalid API key: prompt for reconfiguration

**Cost Tracking**
- Calculate tokens per message
- Estimate cost based on provider pricing
- Display running total per conversation
- Monthly usage statistics

### 7.3 Window Management Implementation

**Layout Capture**
- Query all visible windows via Tauri
- Filter system windows and hidden apps
- Capture position, size, and display info
- Generate thumbnail via screenshot API
- Store in database with timestamp

**Layout Application**
- Parse saved layout data
- Match windows by bundle ID or title
- Calculate target positions for current display setup
- Apply changes sequentially with delay
- Handle missing applications gracefully

**Common Actions (Rectangle-style)**
- Half left/right: position window to 50% width
- Maximize: full screen minus menu bar
- Center: center window on current display
- Quarters: position in screen quadrants
- Move to next/previous display

### 7.4 Clipboard History Implementation

**Monitoring**
- Poll system clipboard every 500ms
- Compare hash to detect changes
- Extract plain text only
- Ignore passwords and sensitive patterns
- Deduplicate consecutive identical entries

**Storage**
- Maximum entries: configurable (default 1000)
- Retention period: configurable (default 30 days)
- Auto-cleanup: daily task to remove old entries
- Pinned entries: exempt from auto-cleanup

**Search and Filter**
- Full-text search across all entries
- Filter by source application
- Filter by date range
- Sort by recency or frequency

### 7.5 Web Scraping Implementation

**Content Fetching**
- HTTP client with user agent spoofing
- JavaScript rendering: optional headless browser
- Content extraction: strip HTML to text
- Respect robots.txt
- Rate limiting: max 5 requests per minute

**AI Processing**
- Combine URL content with user prompt
- Send to AI provider via Vercel AI SDK
- Stream response to UI
- Store result with source URL
- Cache results for duplicate requests

**Error Scenarios**
- Invalid URL: immediate validation feedback
- Network failure: retry with timeout
- Blocked access: inform user of restriction
- Large content: truncate with warning
- Timeout: configurable limit (default 30s)

---

## 8. Type Safety Strategy

### 8.1 Zod Schema Definitions

**Schema Organization**
- One schema file per domain model
- Co-located with TypeScript type definitions
- Export both schema and inferred type
- Reusable sub-schemas for common patterns

**Validation Points**
- User input forms
- Tauri command parameters and returns
- API responses from AI providers
- Local storage reads
- Database query results

**Error Handling**
- Structured validation errors with field paths
- User-friendly error messages
- Fallback to default values where appropriate
- Logging of validation failures

### 8.2 TypeScript Configuration

**Strict Mode Settings**
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `exactOptionalPropertyTypes: true`

**Path Aliases**
- `@/components`: UI components
- `@/hooks`: Custom React hooks
- `@/stores`: Zustand stores
- `@/types`: Type definitions and schemas
- `@/utils`: Helper functions
- `@/commands`: Tauri command wrappers

### 8.3 Type-safe Tauri Commands

**Command Wrapper Pattern**
- Create TypeScript wrapper for each Tauri command
- Define input and output types with Zod
- Validate parameters before invoke
- Parse and validate return values
- Handle errors with typed error objects

**IPC Type Safety**
- Share type definitions between Rust and TypeScript
- Use `ts-rs` or similar for Rust type generation
- Validate at both ends of IPC boundary
- Version schema for breaking changes

---

## 9. Performance Considerations

### 9.1 Rendering Optimization

**Component Optimization**
- Memo expensive components
- Use callback refs for stable references
- Virtualize long lists (conversations, clipboard)
- Lazy load non-critical components
- Debounce rapid state updates

**State Update Batching**
- Batch Zustand updates where possible
- Use SWR's dedupe and cache
- Throttle clipboard polling
- Debounce window resize events

### 9.2 Memory Management

**Conversation History**
- Paginate message loading
- Unload off-screen conversations
- Limit in-memory message count
- Compress old conversation data

**Clipboard History**
- Maximum in-memory entries: 100 most recent
- Lazy load older entries on scroll
- Release memory for off-screen content
- Periodic garbage collection

**AI Streaming**
- Release stream resources after completion
- Cancel abandoned streams
- Clear streaming state after errors
- Limit concurrent streams to 1

### 9.3 Database Performance

**Query Optimization**
- Index frequently queried columns
- Use prepared statements
- Batch insert operations
- Limit query result sets

**Background Operations**
- Async database writes
- Non-blocking cleanup tasks
- Scheduled maintenance jobs
- Progressive data loading

---

## 10. Security Considerations

### 10.1 API Key Management

**Storage**
- Encrypt keys using platform keychain
- Never store in plain text
- Never log keys
- Secure memory handling

**Transmission**
- HTTPS only for API calls
- No key exposure in URLs
- Validate keys server-side
- Rotate keys on compromise

### 10.2 Data Privacy

**Clipboard History**
- Opt-in feature with clear consent
- Pattern-based filtering for passwords
- Exclude sensitive app sources
- User-controlled retention period
- Export and delete functionality

**Conversation Data**
- Local-only storage by default
- User-controlled data deletion
- No telemetry without consent
- Clear data on uninstall option

### 10.3 Web Scraping Safety

**Content Validation**
- Sanitize all fetched HTML
- Validate URLs before fetch
- Respect security headers
- Timeout long-running requests
- Sandbox rendering if needed

**User Protection**
- Warn about potentially unsafe sites
- Block known malicious domains
- Display source URL clearly
- User confirmation for unknown domains

---

## 11. Testing Strategy

### 11.1 Unit Testing

**Frontend Tests**
- Component rendering with various props
- Hook behavior and state transitions
- Utility function correctness
- Zod schema validation
- Store actions and selectors

**Backend Tests**
- Tauri command logic
- Database operations
- File system interactions
- Window management functions
- Clipboard monitoring

### 11.2 Integration Testing

**Cross-layer Tests**
- IPC communication flow
- State synchronization
- AI streaming end-to-end
- Layout application workflow
- Clipboard history capture

### 11.3 E2E Testing

**Critical User Flows**
- New conversation creation
- AI message streaming
- Layout save and restore
- Clipboard history search
- Web scraping with AI

---

## 12. Error Handling Strategy

### 12.1 Error Categories

**User Errors**
- Invalid input
- Missing required fields
- Configuration errors
- Display inline with guidance

**System Errors**
- Network failures
- Permission denied
- Disk full
- Display with recovery options

**Application Errors**
- Unexpected states
- Data corruption
- Version mismatches
- Log and display generic message

### 12.2 Error Recovery

**Automatic Recovery**
- Retry transient failures
- Fallback to cached data
- Degrade gracefully
- Auto-save before crash

**User-Initiated Recovery**
- Clear cache option
- Reset to defaults
- Export data before reset
- Guided troubleshooting

---

## 13. Accessibility

### 13.1 Keyboard Navigation

**Full keyboard support**
- Tab through all interactive elements
- Keyboard shortcuts for common actions
- Focus visible indicators
- Screen reader announcements

**Shortcut Categories**
- Global: show/hide sidebar
- Navigation: switch views
- Actions: new chat, clear clipboard
- Customizable bindings

### 13.2 Screen Reader Support

**ARIA Labels**
- Descriptive labels for all inputs
- Status announcements for loading states
- Live region for streaming messages
- Landmarks for major sections

---

## 14. Configuration and Settings

### 14.1 User Settings Structure

**AI Settings**
- Default provider and model
- Temperature and parameter defaults
- System prompt customization
- Auto-save conversation preference

**Appearance Settings**
- Theme selection (light, dark, system)
- Sidebar width and opacity
- Font size and family
- Animation speed

**Behavior Settings**
- Auto-show on hover toggle
- Hover delay customization
- Focus stealing prevention
- Start on login

**Privacy Settings**
- Clipboard monitoring toggle
- Data retention periods
- Telemetry preferences
- Data export formats

**Hotkey Settings**
- Customizable global shortcuts
- Conflict detection
- Reset to defaults option

### 14.2 Settings Persistence

**Storage Location**
- Platform-specific config directory
- JSON format for human readability
- Schema validation on load
- Migration for version changes

---

## 15. Development Workflow

### 15.1 Project Structure

```
src/
├── components/       # React components
│   ├── ai/          # AI chat components
│   ├── clipboard/   # Clipboard history components
│   ├── layouts/     # Window layout components
│   ├── shortcuts/   # App shortcut components
│   └── shared/      # Reusable UI components
├── hooks/           # Custom React hooks
├── stores/          # Zustand stores
├── types/           # TypeScript types and Zod schemas
├── commands/        # Tauri command wrappers
├── utils/           # Helper functions
├── constants/       # App constants
└── assets/          # Static assets

src-tauri/
├── src/
│   ├── commands/    # Tauri command implementations
│   ├── storage/     # Database and file operations
│   ├── window/      # Window management
│   └── clipboard/   # Clipboard monitoring
└── Cargo.toml
```

### 15.2 Code Standards

**TypeScript**
- ESLint with strict rules
- Prettier for formatting
- No any types allowed
- Explicit return types on functions
- Prefer const over let

**React**
- Functional components only
- Custom hooks for logic reuse
- Props interface for all components
- Proper dependency arrays
- Avoid inline function definitions

**Naming Conventions**
- PascalCase for components and types
- camelCase for functions and variables
- UPPER_SNAKE_CASE for constants
- Descriptive names over brevity

---

## 16. Deployment and Updates

### 16.1 Build Process

**Production Build**
- Minification and tree shaking
- Source map generation
- Asset optimization
- Code signing for macOS

**Release Channels**
- Stable: tested releases
- Beta: pre-release features
- Dev: nightly builds

### 16.2 Auto-update Strategy

**Update Detection**
- Check for updates on startup
- Background check every 6 hours
- Manual check option

**Update Installation**
- Download in background
- User prompt before install
- Automatic restart option
- Rollback on failure

---

## 17. Monitoring and Logging

### 17.1 Application Logging

**Log Levels**
- Error: critical failures
- Warn: potential issues
- Info: significant events
- Debug: detailed diagnostics

**Log Storage**
- Rotate logs daily
- Maximum 7 days retention
- Size limit: 100MB total
- Structured JSON format

### 17.2 Performance Metrics

**Tracked Metrics**
- App launch time
- Sidebar show/hide latency
- AI response time
- Database query duration
- Memory usage peaks

---

## 18. Future Extensibility

### 18.1 Plugin System

**Planned Architecture**
- Plugin manifest definition
- Sandboxed execution
- API surface for plugins
- User-installable extensions

### 18.2 API Endpoints

**Local API**
- HTTP server for external integrations
- REST endpoints for core features
- Authentication via API tokens
- Rate limiting

### 18.3 Scripting Support

**User Scripts**
- Custom automation scripts
- Event-driven triggers
- Safe execution environment
- Script marketplace