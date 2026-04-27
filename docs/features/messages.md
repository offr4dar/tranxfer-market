# Messages

**Files:** `app/(tabs)/messages.tsx`, `app/(tabs)/conversation/[id].tsx`

The Messages feature consists of two screens: the conversation list and the individual conversation thread.

## Current State

Both screens are scaffolded with UI shells. **Real-time Supabase integration is the third priority in [Phase 1](../roadmap/phase-1.md).**

## Database Tables

| Table | Purpose |
|---|---|
| `conversations` | One row per conversation, storing participant IDs and `last_message_at` |
| `messages` | Individual messages, linked to a `conversation_id` |

## Planned Behaviour

### Conversation List (`messages.tsx`)

- Query `conversations` joined with `profiles` to show participant names and avatars
- Sort by `last_message_at DESC`
- Show unread indicator for conversations with unread messages
- Tap a conversation → navigate to `conversation/[id]`

### Conversation Thread (`conversation/[id].tsx`)

- Query `messages WHERE conversation_id = :id ORDER BY created_at ASC`
- Subscribe to real-time changes using Supabase Realtime:
  ```ts
  supabase
    .channel(`messages:${conversationId}`)
    .on('postgres_changes', { event: 'INSERT', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, handleNewMessage)
    .subscribe();
  ```
- Auto-scroll to the latest message on arrival
- Typing indicator using Supabase Realtime Presence

## Access Control

Only users who are **connected** (accepted connection in the `connections` table — Phase 1, Feature 3) will have a compose input rendered. Unconnected users see a message explaining they need to connect first.
