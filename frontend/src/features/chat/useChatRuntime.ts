import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Socket } from "socket.io-client";
import {
  connectChatSocket,
  fetchBootstrap,
  fetchRoomMessages,
  loginAs,
  sendRoomMessage
} from "./chat-api";
import type {
  ChatBootstrapPayload,
  ChatMessage,
  ConversationSummary,
  RoomRef,
  TypingIndicator
} from "./chat-types";

function roomFromSummary(summary: ConversationSummary): RoomRef {
  return {
    id: summary.id,
    type: summary.type,
    name: summary.name,
    topic: summary.topic,
    participantType: summary.participant_type
  };
}

function upsertMessage(messages: ChatMessage[], incoming: ChatMessage) {
  const withoutDuplicate = messages.filter(
    (message) =>
      message.id !== incoming.id &&
      !(
        message.id.startsWith("temp-") &&
        message.sender_id === incoming.sender_id &&
        message.room_id === incoming.room_id &&
        message.content === incoming.content
      )
  );

  return [...withoutDuplicate, incoming].sort((left, right) =>
    left.created_at.localeCompare(right.created_at)
  );
}

function toPreview(message: ChatMessage) {
  if (message.media_type === "audio") {
    return message.transcription || "Audio recebido";
  }

  if (message.media_type === "image") {
    return "Imagem anexada";
  }

  return message.content || "Mensagem enviada";
}

export function useChatRuntime() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [bootstrap, setBootstrap] = useState<ChatBootstrapPayload | null>(null);
  const [activeRoom, setActiveRoom] = useState<RoomRef | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState<TypingIndicator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [connectionState, setConnectionState] = useState<"connecting" | "online" | "offline">(
    "connecting"
  );
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeRoomRef = useRef<RoomRef | null>(null);
  const requestedPvtId = searchParams.get("pvt_id");
  const requestedGroupId = searchParams.get("group_id");

  const requestedRoom = useMemo(() => {
    if (!bootstrap) return null;

    if (requestedPvtId) {
      const pvt = bootstrap.pvts.find((entry) => entry.id === requestedPvtId);
      if (pvt) {
        return roomFromSummary(pvt);
      }
    }

    if (requestedGroupId) {
      const group = bootstrap.groups.find((entry) => entry.id === requestedGroupId);
      if (group) {
        return roomFromSummary(group);
      }
    }

    return null;
  }, [bootstrap, requestedGroupId, requestedPvtId]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapRuntime() {
      try {
        const accessToken = await loginAs("user");
        if (cancelled) return;

        setToken(accessToken);
        const payload = await fetchBootstrap(accessToken);
        if (cancelled) return;

        setBootstrap(payload);
        const requestedPvt = requestedPvtId
          ? payload.pvts.find((entry) => entry.id === requestedPvtId)
          : null;
        const requestedGroup = requestedGroupId
          ? payload.groups.find((entry) => entry.id === requestedGroupId)
          : null;

        const initialRoom = requestedPvt
          ? roomFromSummary(requestedPvt)
          : requestedGroup
            ? roomFromSummary(requestedGroup)
            : payload.groups[0]
              ? roomFromSummary(payload.groups[0])
              : payload.pvts[0]
                ? roomFromSummary(payload.pvts[0])
                : null;
        setActiveRoom(initialRoom);
      } catch (runtimeError) {
        if (!cancelled) {
          setError(
            runtimeError instanceof Error ? runtimeError.message : "Falha ao iniciar chat"
          );
          setConnectionState("offline");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    bootstrapRuntime();

    return () => {
      cancelled = true;
    };
  }, [requestedGroupId, requestedPvtId]);

  useEffect(() => {
    if (!requestedRoom) return;
    if (
      activeRoomRef.current?.id === requestedRoom.id &&
      activeRoomRef.current?.type === requestedRoom.type
    ) {
      return;
    }

    setActiveRoom(requestedRoom);
  }, [requestedRoom]);

  useEffect(() => {
    if (!token) return;

    const socket = connectChatSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionState("online");
    });

    socket.on("disconnect", () => {
      setConnectionState("offline");
    });

    socket.on("connect_error", () => {
      setConnectionState("offline");
    });

    socket.on("message_received", (incoming: ChatMessage) => {
      if (
        !activeRoomRef.current ||
        incoming.room_id !== activeRoomRef.current.id ||
        incoming.room_type !== activeRoomRef.current.type
      ) {
        return;
      }

      startTransition(() => {
        setMessages((current) => upsertMessage(current, incoming));
        setBootstrap((current) => {
          if (!current) return current;

          const updateList = (list: ConversationSummary[]) =>
            list.map((item) =>
              item.id === incoming.room_id && item.type === incoming.room_type
                ? {
                    ...item,
                    latest_message: toPreview(incoming),
                    latest_message_at: incoming.created_at
                  }
                : item
            );

          return {
            ...current,
            groups: updateList(current.groups).sort((a, b) =>
              b.latest_message_at.localeCompare(a.latest_message_at)
            ),
            pvts: updateList(current.pvts).sort((a, b) =>
              b.latest_message_at.localeCompare(a.latest_message_at)
            )
          };
        });
      });
    });

    socket.on(
      "message_updated",
      (payload: {
        message_id: string;
        transcription?: string | null;
        tts_audio_url?: string | null;
        status?: string;
      }) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === payload.message_id
              ? {
                  ...message,
                  transcription: payload.transcription ?? message.transcription,
                  tts_audio_url: payload.tts_audio_url ?? message.tts_audio_url,
                  status: payload.status ?? message.status
                }
              : message
          )
        );
      }
    );

    socket.on("agent_typing", (payload: TypingIndicator) => {
      setTyping(payload);
    });

    socket.on("agent_done_typing", () => {
      setTyping(null);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  useEffect(() => {
    if (!activeRoom) return;

    const nextParams = new URLSearchParams(searchParams);

    if (activeRoom.type === "pvt") {
      nextParams.set("pvt_id", activeRoom.id);
      nextParams.delete("group_id");
    } else {
      nextParams.set("group_id", activeRoom.id);
      nextParams.delete("pvt_id");
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [activeRoom, searchParams, setSearchParams]);

  useEffect(() => {
    if (!token || !activeRoom) return;

    let cancelled = false;
    const accessToken = token;
    const room = activeRoom;
    const socket = socketRef.current;
    const roomPayload = {
      room_type: room.type,
      room_id: room.id
    };

    async function hydrateRoom() {
      try {
        setTyping(null);
        const history = await fetchRoomMessages(accessToken, room);
        if (cancelled) return;

        setMessages(history.sort((left, right) => left.created_at.localeCompare(right.created_at)));
        socket?.emit("join_room", roomPayload);
      } catch (roomError) {
        if (!cancelled) {
          setError(roomError instanceof Error ? roomError.message : "Falha ao carregar thread");
        }
      }
    }

    hydrateRoom();

    return () => {
      cancelled = true;
      socket?.emit("leave_room", roomPayload);
    };
  }, [activeRoom, token]);

  async function submitMessage(
    input: string,
    media?: { media_type: string; media_url: string; content?: string | null }
  ) {
    if (!token || !activeRoom) return;
    if (!input.trim() && !media) return;

    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      room_id: activeRoom.id,
      room_type: activeRoom.type,
      sender_type: "user",
      sender_id: bootstrap?.me.id ?? null,
      sender_name: bootstrap?.me.name ?? "Voce",
      sender_avatar: null,
      content: media ? ((media.content ?? input.trim()) || null) : input.trim(),
      media_url: media?.media_url ?? null,
      media_type: media?.media_type ?? null,
      tts_audio_url: null,
      transcription: media?.media_type === "audio" ? "Processando transcricao..." : null,
      created_at: new Date().toISOString(),
      status: "sending"
    };

    setIsSending(true);
    setMessages((current) => upsertMessage(current, optimisticMessage));

    try {
      const persisted = await sendRoomMessage(token, {
        room_type: activeRoom.type,
        room_id: activeRoom.id,
        content: optimisticMessage.content,
        media_type: optimisticMessage.media_type,
        media_url: optimisticMessage.media_url
      });

      setMessages((current) => upsertMessage(current, persisted));
      setError(null);
    } catch (sendError) {
      setMessages((current) =>
        current.map((message) =>
          message.id === optimisticMessage.id ? { ...message, status: "failed" } : message
        )
      );
      setError(sendError instanceof Error ? sendError.message : "Falha ao enviar");
    } finally {
      setIsSending(false);
    }
  }

  return {
    bootstrap,
    activeRoom,
    messages,
    typing,
    isLoading,
    isSending,
    connectionState,
    error,
    selectRoom: setActiveRoom,
    submitMessage
  };
}
