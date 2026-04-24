INSERT INTO users (name, email, password_hash, role)
VALUES (
  'FBR Admin',
  'admin@fbr.local',
  '$2b$12$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvabcdefghijkl',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO companies (id, name, slug)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'FBR Holding', 'fbr-holding'),
  ('22222222-2222-2222-2222-222222222222', 'Global Tech', 'global-tech')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO agents (name, slug, company_id, openclaw_config, tts_enabled, tts_voice_id)
VALUES
  (
    'Agente de Vendas',
    'vendas',
    '11111111-1111-1111-1111-111111111111',
    jsonb_build_object(
      'model', 'claude-3-5-sonnet',
      'system_prompt', 'Você é um agente de vendas objetivo e operacional.',
      'temperature', 0.3,
      'max_tokens', 1000,
      'api_key_ref', 'OPENCLAW_VENDAS_KEY'
    ),
    TRUE,
    'voice-vendas-01'
  ),
  (
    'Agente RH',
    'rh',
    '11111111-1111-1111-1111-111111111111',
    jsonb_build_object(
      'model', 'claude-3-5-sonnet',
      'system_prompt', 'Você é um agente de RH claro e responsável.',
      'temperature', 0.2,
      'max_tokens', 900,
      'api_key_ref', 'OPENCLAW_RH_KEY'
    ),
    FALSE,
    NULL
  ),
  (
    'Agente Produto',
    'produto',
    '22222222-2222-2222-2222-222222222222',
    jsonb_build_object(
      'model', 'claude-3-5-sonnet',
      'system_prompt', 'Você é um agente de produto pragmático.',
      'temperature', 0.4,
      'max_tokens', 1200,
      'api_key_ref', 'OPENCLAW_PRODUTO_KEY'
    ),
    FALSE,
    NULL
  )
ON CONFLICT (slug) DO NOTHING;
