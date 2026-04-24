export type BootstrapUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
};

export type ConversationSummary = {
  id: string;
  type: "group" | "pvt";
  name: string;
  latest_message: string;
  latest_message_at: string;
  unread_count: number;
  topic?: string;
  participant_type?: "user" | "agent";
};

export type ChatMessage = {
  id: string;
  room_id: string;
  room_type: "group" | "pvt";
  sender_type: "user" | "agent" | "system";
  sender_id: string | null;
  sender_name: string;
  sender_avatar: string | null;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  tts_audio_url: string | null;
  transcription: string | null;
  created_at: string;
  status: string;
};

export type ChatBootstrapPayload = {
  me: BootstrapUser;
  groups: ConversationSummary[];
  pvts: ConversationSummary[];
};

export type RoomRef = {
  id: string;
  type: "group" | "pvt";
  name: string;
  topic?: string;
  participantType?: "user" | "agent";
};

export type TypingIndicator = {
  user_id?: string;
  user_name?: string;
  agent_id?: string;
  agent_name?: string;
};
