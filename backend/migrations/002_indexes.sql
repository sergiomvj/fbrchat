CREATE INDEX idx_messages_conversation
  ON messages (conversation_type, conversation_id, created_at DESC);

CREATE INDEX idx_messages_sender
  ON messages (sender_type, sender_id, created_at DESC);

CREATE INDEX idx_refresh_tokens_user
  ON refresh_tokens (user_id, expires_at DESC);

CREATE INDEX idx_group_members_member
  ON group_members (member_type, member_id);

CREATE INDEX idx_groups_created_by
  ON groups (created_by, created_at DESC);

CREATE INDEX idx_companies_slug
  ON companies (slug);

CREATE INDEX idx_agents_company
  ON agents (company_id, is_active, created_at DESC);

CREATE INDEX idx_pvt_last_message_at
  ON pvt_conversations (last_message_at DESC NULLS LAST);

CREATE INDEX idx_openclaw_logs_agent_created
  ON openclaw_call_logs (agent_id, created_at DESC);

CREATE INDEX idx_openclaw_logs_status_created
  ON openclaw_call_logs (status, created_at DESC);
