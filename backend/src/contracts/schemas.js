export const authSchemas = {
  login: {
    required: ["email", "password"],
    properties: {
      email: "string",
      password: "string"
    }
  },
  refresh: {
    required: ["refresh_token"],
    properties: {
      refresh_token: "string"
    }
  },
  logout: {
    required: ["refresh_token"],
    properties: {
      refresh_token: "string"
    }
  }
};

export const adminSchemas = {
  createCompany: {
    required: ["name", "slug"],
    properties: {
      name: "string",
      slug: "string"
    }
  },
  createUser: {
    required: ["name", "email", "password", "role"],
    properties: {
      name: "string",
      email: "string",
      password: "string",
      role: ["admin", "user"]
    }
  },
  createAgent: {
    required: ["name", "slug", "company_id", "openclaw_config"],
    properties: {
      name: "string",
      slug: "string",
      company_id: "uuid",
      avatar_url: "string|null",
      openclaw_config: {
        required: ["model", "system_prompt", "api_key_ref"],
        properties: {
          model: "string",
          system_prompt: "string",
          temperature: "number",
          max_tokens: "number",
          api_key_ref: "string"
        }
      },
      tts_enabled: "boolean",
      tts_voice_id: "string|null"
    }
  }
};

export const conversationSchemas = {
  createGroup: {
    required: ["name", "description", "topic"],
    properties: {
      name: "string",
      description: "string",
      topic: "string"
    }
  },
  createPvt: {
    required: ["participant_type", "participant_id"],
    properties: {
      participant_type: ["user", "agent"],
      participant_id: "uuid"
    }
  },
  postMessage: {
    required: ["room_type", "room_id"],
    properties: {
      room_type: ["group", "pvt"],
      room_id: "uuid",
      content: "string|null",
      media_url: "string|null",
      media_type: ["audio", "video", "image", null]
    }
  },
  uploadDescriptor: {
    required: ["filename", "mime_type", "size_bytes"],
    properties: {
      filename: "string",
      mime_type: "string",
      size_bytes: "number"
    }
  }
};

export const adminRuntimeSchemas = {
  settings: {
    stt_enabled: "boolean",
    tts_enabled: "boolean",
    inference_rate_limit: "number"
  }
};
