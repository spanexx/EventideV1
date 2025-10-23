# EventideV1 AI Assistant Page Recommendation Feature - Issue Documentation

## Project Overview
Implementation of clickable page recommendation links in the EventideV1 AI assistant chat to help users navigate to relevant pages based on AI suggestions.

## Features Implemented

### 1. Knowledge Base Enhancement
- Updated all 21+ knowledge documents with proper internal route information
- Added "Internal Routes" sections to each document with correct application paths
- Examples:
  - Login page: `/auth/login`, `/auth/signup`, `/auth/forgot-password`
  - Dashboard: `/dashboard/overview`, `/dashboard/bookings`, etc.

### 2. Backend Route Processing
- Enhanced AssistantAgentService with strict system prompts to only suggest internal routes
- Created RouteRecommendationService to:
  - Extract route suggestions from AI responses in formats like `[Link Text](route)`
  - Map common route names to proper application paths
  - Validate routes as internal application routes
  - Filter out external URLs
  - Convert valid routes to `<route-link>` elements

### 3. Frontend Implementation
- Updated AgentChatComponent with click handlers for route-link elements
- Enhanced MarkdownRenderService to process route-link elements
- Added CSS styling for clickable route links
- Implemented defensive navigation validation

## Technical Implementation

### Route Mapping
Common route names are automatically mapped to proper application paths:
- `login` → `/auth/login`
- `signup` → `/auth/signup`
- `forgot-password` → `/auth/forgot-password`
- `dashboard` → `/dashboard/overview`
- `providers` → `/providers`

### Validation Pipeline
1. AI generates response with route suggestions
2. Backend RouteRecommendationService processes and validates routes
3. External URLs are filtered out
4. Route names are mapped to proper paths
5. Routes are validated against known application routes
6. Valid routes are converted to `<route-link>` elements
7. Frontend renders clickable elements
8. Click handler validates and navigates to routes

## Current Issue

### Problem Description
Despite all implementation work, the route links are still not clickable in the chat interface. The backend logs show proper processing:

```
[RouteRecommendationService] Processing response: [ /auth/login ]
[RouteRecommendationService] Found matches: [{ full: '[ /auth/login ]', text: '/auth/login', route: '/auth/login' }]
[RouteRecommendationService] Valid internal route: /auth/login
[RouteRecommendationService] Final processed text: <route-link text="/auth/login" route="/auth/login">/auth/login</route-link>
```

But when tested, clicking the links does nothing.

### Additional Issue Discovered
The AI is providing completely incorrect information about what Eventide offers. Instead of describing our scheduling/booking application, it's providing generic information about some other "Eventide" product with features like:
- Data Collection & Integration
- Data Analysis & Visualization
- Collaboration & Sharing

This suggests the RAG system is not properly retrieving our knowledge base documents, or the AI is ignoring the context altogether.

## Debugging Steps Taken

### Backend Verification
✓ RouteRecommendationService correctly processes route suggestions
✓ Routes are properly validated and converted to `<route-link>` elements
✓ RouteRecommendations array is correctly populated and sent to frontend

### Frontend Verification
✓ AgentChatComponent receives processed responses with `<route-link>` elements
✓ MarkdownRenderService should convert `<route-link>` to clickable spans
✓ Click handler should intercept clicks and navigate to routes
✓ CSS styling should make links visually identifiable

## Possible Causes

### 1. Frontend Rendering Issue
- MarkdownRenderService might not be properly processing `<route-link>` elements
- Rendered HTML might not contain the expected `data-route` attributes
- CSS classes might not be applied correctly to make elements clickable

### 2. Click Handler Issue
- Event listener might not be properly attached to route-link elements
- Selector might not be finding elements with correct classes/attributes
- Navigation might be failing silently due to validation

### 3. RAG System Issue
- AI might not be accessing our knowledge base documents
- Context injection might be failing
- System prompts might not be restrictive enough about external information

## Next Steps

### 1. Frontend Debugging
- Add console logging to verify rendered HTML contains proper route-link elements
- Check that click handlers are properly attached and firing
- Verify that route-link elements have correct attributes and classes

### 2. Backend Debugging
- Add more detailed logging to trace the entire processing pipeline
- Verify that route recommendations are properly included in API responses
- Check that frontend is correctly parsing and using route recommendations

### 3. RAG System Investigation
- Verify that knowledge base documents are properly indexed and searchable
- Check that RAG is correctly retrieving relevant documents
- Ensure system prompts are restrictive enough to prevent external information

## Files Modified

### Backend
- `/backend/src/agents/assistant-agent/assistant-agent.service.ts`
- `/backend/src/modules/knowledge-base/services/route-recommendation.service.ts`
- `/backend/src/modules/knowledge-base/services/knowledge-document-import.service.ts`
- `/backend/src/modules/knowledge-base/knowledge-base.module.ts`

### Frontend
- `/frontend/src/app/components/agent-chat/agent-chat.component.ts`
- `/frontend/src/app/components/agent-chat/agent-chat.component.scss`
- `/frontend/src/app/components/agent-chat/assistant-agent.service.ts`
- `/frontend/src/app/shared/services/markdown-render.service.ts`
- `/frontend/src/app/shared/services/page-context.service.ts`

## Expected Behavior
When a user asks about navigation or specific pages, the AI assistant should:
1. Suggest relevant internal pages using proper route links
2. Format links as clickable elements in the chat interface
3. Navigate to the suggested pages when clicked
4. Provide accurate information about EventideV1 features and functionality

## Current Behavior
1. AI generates route suggestions that are correctly processed by backend
2. Links appear in chat but are not clickable
3. AI provides incorrect information about Eventide features
4. Navigation attempts fail or do nothing

## Priority
High - This is a core feature that enables contextual navigation assistance in the application.

---

# 2025-10-10 Status Update

## What we changed (since last note)
- **[Frontend rendering]** `frontend/src/app/shared/services/markdown-render.service.ts`
  - Normalizes malformed `<route-link>` (duplicates, missing slash, `[/route-link]` typo).
  - Converts to `<span class="clickable-route route-link" data-route="...">` before Markdown parsing.
  - Sanitizes with DOMPurify then returns `SafeHtml` via Angular `DomSanitizer` to preserve `data-*`.
- **[Click handling]** `frontend/src/app/components/agent-chat/agent-chat.component.ts`
  - Added `(click)` delegation and navigation via `Router` for `.clickable-route`.
  - Restored `clearChat()` to fully wipe local state + localStorage.
- **[Styling]** `frontend/src/app/components/agent-chat/agent-chat.component.scss`
  - Styled `.route-link` for good contrast; hover state, underline, pointer.
- **[Backend route safety]** `backend/src/modules/knowledge-base/services/route-recommendation.service.ts`
  - Enforce leading slash, map `/auth/dashboard/*` → `/dashboard/*`, map `/bookings` → `/dashboard/bookings`, whitelist prefixes.
- **[Model fallback]** `backend/src/agents/assistant-agent/assistant-agent.service.ts`
  - Provider order: Gemini → OpenRouter → Ollama (reduced `num_predict` to avoid OOM).
  - Verified via curl: health OK; responses include `<route-link>`.

## Current behavior
- Links now render as clickable spans and navigate correctly.
- Some responses can still be generic when RAG finds no context.
- Model confirmed working with fallback; OpenRouter tested; Gemini depends on network DNS.

## Known issues
- Occasional malformed model output (e.g., mixed bracket and tag syntax) — normalized on frontend, but we should continue tightening.
- RAG sometimes finds 0 docs for broad prompts → generic answers.
- Styling request: ensure chat links appear blue and show pointer in both bubbles (in progress; see Next Steps).

### New issues from 2025-10-10 logs/screens
- **[NG0913 image warnings]**
  - `logo-orange.png` and `logo-porter.png` intrinsic sizes are much larger than rendered.
  - Impact: slower loading; Angular warns during dev.
  - Proposed fix:
    - Add explicit `width`/`height` attributes matching rendered size, or
    - Use Angular `<img ngSrc>` with proper `width`/`height` and `priority` where needed, or
    - Serve optimized variants (e.g., 2x sizes) and update references in `app.component.html`/layout files.

- **[Route text renders as raw '/route(link)' or '/route(/route)']**
  - Examples seen:
    - `/auth/login(link)`
    - `/dashboard/overview( /dashboard/overview )`
  - Status: Renderer now converts `/route(link)` and spaced `(l ink)` variants to clickable spans; bracket `[Text](/route)` is handled.
  - Remaining gap: the duplicate form `/route(/route)` still appears as raw text.
  - Proposed fix: extend normalizer to also convert duplicates using regex: `(\/[^\s)]+)\(\1\)`.

- **[Links not blue]**
  - Desired: links blue with pointer across both bubbles.
  - Status: `.route-link` styled to `#1e6fff` with `cursor: pointer` and darker hover; verify stylesheet is loaded and no higher specificity overrides. Hard-reload if needed.
  - If still not blue, add `!important` or raise specificity under `.chat-widget .chat-window .message .message-content .message-text .route-link`.

- **[Providers page not known]**
  - Likely missing/insufficient KB content in RAG for `providers`.
  - Proposed fix: add a Providers KB doc (purpose, how to reach `/providers`, typical tasks). Re-ingest and set category mapping to `home` or `dashboard`.

## Next steps
- **[UX tone]** Keep friendly, concise replies: system prompt tuned; avoid plain "I don't know" by adding a brief clarification + 1–3 route suggestions.
- **[RAG quality]**
  - Raise default `minSimilarity` to 0.75–0.85 for generic queries.
  - Ensure KB coverage for providers/bookings/auth pages; re-ingest missing docs if needed.
- **[Route mapping]** Add/verify mappings for `providers` → `/providers` and enforce canonical dashboard routes.
- **[Styling polish]** Ensure `.route-link` is blue with `cursor: pointer` in both bubbles; increase specificity or `!important` if needed.
- **[Renderer]** Add converter for duplicate form `/route(/route)` and any surrounding spaces.
- **[Ops]** Resolve DNS for `generativelanguage.googleapis.com` and `openrouter.ai` on the server to stabilize provider fallbacks.

## How to verify
- curl tests (localhost):
  - Login link: POST `/api/agents/assistant/chat-rag` with "How do I sign in?" → expect `<route-link ... route="/auth/login">`.
  - Bookings route: ask "Where do I see my bookings?" → `/dashboard/bookings`.
  - Check browser console: rendered `.clickable-route` should have non-null `data-route`.