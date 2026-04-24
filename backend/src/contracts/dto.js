export const authDto = {
  loginResponse: {
    access_token: "string",
    refresh_token: "string",
    user: {
      id: "uuid",
      name: "string",
      email: "string",
      avatar_url: "string|null",
      role: "admin|user"
    }
  }
};

export const conversationDto = {
  message: {
    id: "uuid",
    room_id: "uuid",
    room_type: "group|pvt",
    sender_type: "user|agent|system",
    sender_id: "uuid|null",
    content: "string|null",
    media_url: "string|null",
    media_type: "audio|video|image|null",
    tts_audio_url: "string|null",
    created_at: "iso8601",
    status: "sent|processing|failed"
  },
  messageUpdated: {
    message_id: "uuid",
    room_id: "uuid",
    transcription: "string|null",
    tts_audio_url: "string|null",
    status: "sent|processing|failed"
  }
};

export const adminDto = {
  company: {
    id: "uuid",
    name: "string",
    slug: "string",
    is_active: "boolean",
    created_at: "iso8601"
  },
  settings: {
    stt_enabled: "boolean",
    tts_enabled: "boolean",
    inference_rate_limit: "number"
  },
  openclawLog: {
    id: "uuid",
    agent_id: "uuid",
    request_id: "uuid",
    model: "string",
    latency_ms: "number|null",
    prompt_tokens: "number|null",
    completion_tokens: "number|null",
    estimated_cost_usd: "number|null",
    status: "success|timeout|error",
    error_code: "string|null",
    created_at: "iso8601"
  },
  agent: {
    id: "uuid",
    name: "string",
    slug: "string",
    company_id: "uuid",
    company_slug: "string",
    company_name: "string",
    tts_enabled: "boolean",
    is_active: "boolean"
  }
};
