import { io, type Socket } from "socket.io-client";
import { apiRequest, getApiBaseUrl } from "../../lib/api";
import type { ChatBootstrapPayload, ChatMessage, RoomRef } from "./chat-types";

type AuthResponse = {
  access_token: string;
};

type LoginProfile = "admin" | "user";

const credentialsByProfile = {
  admin: {
    email: "admin@fbr.local",
    password: "admin123"
  },
  user: {
    email: "joao@fbr.local",
    password: "user123"
  }
} satisfies Record<LoginProfile, { email: string; password: string }>;

export async function loginAs(profile: LoginProfile) {
  const credentials = credentialsByProfile[profile];
  const response = await apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });

  return response.access_token;
}

export function fetchBootstrap(token: string) {
  return apiRequest<ChatBootstrapPayload>("/api/bootstrap", { token });
}

export function fetchRoomMessages(token: string, room: RoomRef) {
  const path =
    room.type === "group"
      ? `/api/groups/${room.id}/messages?limit=50`
      : `/api/pvt/${room.id}/messages?limit=50`;

  return apiRequest<ChatMessage[]>(path, { token });
}

export function sendRoomMessage(
  token: string,
  payload: {
    room_type: "group" | "pvt";
    room_id: string;
    content?: string | null;
    media_type?: string | null;
    media_url?: string | null;
  }
) {
  return apiRequest<ChatMessage>("/api/messages", {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export function connectChatSocket(token: string): Socket {
  return io(getApiBaseUrl(), {
    transports: ["websocket"],
    auth: { token }
  });
}
