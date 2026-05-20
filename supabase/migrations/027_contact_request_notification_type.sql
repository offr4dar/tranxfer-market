-- =============================================================================
-- 027_contact_request_notification_type.sql
-- Adds 'contact_request' to the notifications type CHECK constraint
-- so scouts can send contact requests to U16 guardian accounts.
-- =============================================================================

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('profile_view', 'message', 'shortlist', 'system', 'contact_request'));
