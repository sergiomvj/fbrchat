# Stitch -> Frontend Implementation Guide

## Objective

This guide turns the Stitch exports in `stitch_fbr/` into an implementation-ready frontend blueprint for the real FBR CHAT application.

It is meant to answer four practical questions before coding starts:

1. What should be reused from the Stitch output
2. What should not be copied directly
3. Which React components should exist in the real app
4. How the exported visuals map to the approved PRD

---

## Source Files

### Visual Reference

- `fbr_chat_app_main/screen.png`
- `fbr_chat_admin_panel/screen.png`

Use these as the canonical visual reference during implementation reviews.

### Structural Reference

- `fbr_chat_app_main/code.html`
- `fbr_chat_admin_panel/code.html`

Use these only for:

- layout proportions
- spacing rhythm
- typography scale
- section ordering
- visual hierarchy

Do not treat these files as production-ready frontend code.

### Design Tokens

- `fbr_chat/DESIGN.md`

Use this file as the starting point for:

- color tokens
- typography tokens
- spacing scale
- border radius
- interaction tone

---

## What To Reuse

### Keep

- Warm main surface + colder sidebar contrast
- Newsreader for product-defining headings
- Inter for UI, labels, messages, tables
- Narrow operational spacing
- Strong left navigation with fixed width
- Lightweight separators instead of heavy cards
- Petroleum/cyan accent strategy
- Editorial headings with technical body copy
- Right-side context panel for secondary information

### Adapt

- Labels like `Operational Node 01`, `Thread`, `Registry`, `Telemetry`
- Placeholder operational copy in English
- Mock metrics and sample names
- Generic admin terminology such as `Intelligence` if it does not fit final IA

### Do Not Reuse Literally

- Tailwind CDN setup from exported HTML
- Inline config block from Stitch
- Remote image URLs used as avatar placeholders
- Hardcoded content inside the HTML
- DOM structure copied 1:1 without componentization
- Any presentational detail that conflicts with real product behavior

---

## Recommended Frontend Architecture

Assumption: React app with route-based navigation.

### Shared App Shell

Create a common shell for both chat and admin:

- `AppShell`
- `Sidebar`
- `TopBar`
- `StatusPill`
- `SearchField`
- `SectionHeader`
- `EmptyState`

### Design System Layer

Create app-level tokens before feature screens:

- `colors.ts` or CSS variables
- `typography.ts` or typography utility classes
- `spacing.ts` or spacing scale
- `surface.css` or layout primitives

Recommended base tokens:

- `--color-bg-main`
- `--color-bg-sidebar`
- `--color-surface`
- `--color-border-subtle`
- `--color-text-primary`
- `--color-text-muted`
- `--color-accent`
- `--color-accent-soft`
- `--color-success`
- `--color-danger`

---

## Chat Screen Breakdown

Source:

- `fbr_chat_app_main/screen.png`
- `fbr_chat_app_main/code.html`

### Primary Layout

Use a 3-column desktop structure:

1. Left navigation: conversation list
2. Center workspace: active chat thread
3. Right context rail: members, topic, agent context

### React Component Map

- `ChatLayout`
- `ConversationSidebar`
- `ConversationSearch`
- `ConversationSection`
- `ConversationItem`
- `ChatHeader`
- `ChatMessageList`
- `DateDivider`
- `MessageRow`
- `AgentMessage`
- `UserMessage`
- `SystemMessage`
- `AudioMessagePlayer`
- `InlineImageMessage`
- `TypingIndicator`
- `MessageComposer`
- `AttachmentButton`
- `AudioRecorderButton`
- `SendButton`
- `ConversationContextPanel`
- `MemberList`
- `AgentKnowledgeCard`

### Product Behavior To Preserve

- clear difference between groups and PVTs
- active conversation highlight
- unread badge in sidebar
- typing state for agent
- audio playback in-thread
- image preview in-thread
- explicit agent identity in responses
- topic/context visible without crowding the thread

### Product Behavior To Add During Real Implementation

The Stitch export is visual only. The real app must add:

- socket connection state
- optimistic sending state
- failed message retry
- read receipts
- `message_updated` handling for STT/TTS
- infinite scroll
- responsive collapse behavior for side panels

---

## Admin Screen Breakdown

Source:

- `fbr_chat_admin_panel/screen.png`
- `fbr_chat_admin_panel/code.html`

### Primary Layout

Use a 3-zone operational layout:

1. Left admin navigation
2. Central dashboard/workspace
3. Right inspection rail for memory/settings/logs detail

### React Component Map

- `AdminLayout`
- `AdminSidebar`
- `AdminTopBar`
- `KpiStrip`
- `KpiCard` or `KpiCell`
- `ChartPanel`
- `SystemHealthList`
- `HealthStatusRow`
- `UserTable`
- `AgentTable`
- `GroupTable`
- `LogTable`
- `LogStatusBadge`
- `MemoryViewer`
- `HistoryViewer`
- `SettingsPanel`
- `ToggleField`
- `RangeField`
- `PrimaryActionBar`

### Real Routes Recommended

- `/admin`
- `/admin/users`
- `/admin/agents`
- `/admin/groups`
- `/admin/logs`
- `/admin/settings`

The Stitch screen can serve as the visual language for all admin routes, but should not remain one giant screen in production.

### Product Behavior To Preserve

- crisp KPI summary at top
- dense operational table layout
- strong system health visibility
- right-side detailed inspection panel
- serious, internal-tool tone
- settings treated as operational controls, not preferences UI

### Product Behavior To Add During Real Implementation

- filter state
- sortable tables
- pagination or virtualized tables
- detail drawers/modals
- settings persistence feedback
- logs filtering by agent and status
- view/edit modes for user and agent records

---

## Component Priority Order

Build in this order to avoid rework:

1. Design tokens and shell primitives
2. Shared sidebar/topbar/search/status components
3. Chat layout and conversation sidebar
4. Message list and composer
5. Context rail for chat
6. Admin shell and KPI strip
7. Admin tables and system health
8. Memory/history/settings/log views

---

## Styling Guidance

### Prefer

- CSS variables or theme file derived from `DESIGN.md`
- semantic class names or component-scoped styling
- small reusable layout primitives
- subtle borders over shadows
- plain surfaces over card stacks

### Avoid

- copying giant Tailwind utility strings from Stitch into production
- using remote fonts/images without formal asset strategy
- mixing too many accent colors
- over-rounding UI elements
- marketing-style gradients in app surfaces

---

## Data Contract Mapping

The visuals should align with the approved PRD:

- conversation sidebar maps to groups and PVT listing
- thread center maps to WebSocket/HTTP message flow
- right context rail maps to topic, members, and agent context
- admin logs map to `openclaw_call_logs`
- admin settings map to `system_settings`
- message updates map to `message_updated`

This means the UI should be implemented against these backend concepts directly, not against the Stitch mock content.

---

## Implementation Decision

Best practical use of the Stitch export:

- `screen.png` = visual approval artifact
- `DESIGN.md` = seed for design system
- `code.html` = layout reference only

Recommended approach:

Rebuild the interface in React from scratch using the exports as reference, instead of trying to convert the exported HTML into production code.

---

## Ready-to-Start Checklist

- [ ] Convert `DESIGN.md` tokens into app theme variables
- [ ] Define shared shell and navigation primitives
- [ ] Split chat screen into feature components
- [ ] Split admin screen into route-level pages
- [ ] Replace Stitch placeholder copy with PRD-aligned product language
- [ ] Replace placeholder assets with controlled local assets
- [ ] Connect UI states to approved backend contracts
- [ ] Treat exported HTML as reference, not source of truth
