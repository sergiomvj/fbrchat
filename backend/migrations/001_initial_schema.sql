CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deactivated_at TIMESTAMPTZ
);

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(80) UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  avatar_url TEXT,
  openclaw_config JSONB NOT NULL,
  tts_enabled BOOLEAN DEFAULT FALSE,
  tts_voice_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  topic VARCHAR(200),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  member_type VARCHAR(10) NOT NULL CHECK (member_type IN ('user', 'agent')),
  member_id UUID NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, member_type, member_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  conversation_type VARCHAR(5) NOT NULL CHECK (conversation_type IN ('group', 'pvt')),
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'agent', 'system')),
  sender_id UUID,
  content TEXT,
  media_url TEXT,
  media_type VARCHAR(20) CHECK (media_type IN ('audio', 'video', 'image')),
  tts_audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_by JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE pvt_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a_type VARCHAR(10) NOT NULL CHECK (participant_a_type IN ('user', 'agent')),
  participant_a_id UUID NOT NULL,
  participant_b_type VARCHAR(10) NOT NULL CHECK (participant_b_type IN ('user', 'agent')),
  participant_b_id UUID NOT NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (participant_a_type, participant_a_id::text) <> (participant_b_type, participant_b_id::text)
  ),
  CHECK (
    (participant_a_type, participant_a_id::text) < (participant_b_type, participant_b_id::text)
  ),
  UNIQUE (participant_a_type, participant_a_id, participant_b_type, participant_b_id)
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

CREATE TABLE openclaw_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  conversation_type VARCHAR(5) CHECK (conversation_type IN ('group', 'pvt')),
  conversation_id UUID,
  request_id UUID NOT NULL,
  model VARCHAR(100) NOT NULL,
  latency_ms INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  estimated_cost_usd NUMERIC(12, 6),
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'timeout', 'error')),
  error_code VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
