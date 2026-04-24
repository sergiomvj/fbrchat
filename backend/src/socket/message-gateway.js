import { memoryStore } from "../store/memory-store.js";
import { hydrateMessageForEvent, runMockAgentFlow } from "../services/agent-runtime.js";
import { transcribeAudio } from "../services/stt-service.js";

export function createMessageGateway(io) {
  function emitToRoom(roomType, roomId, event, payload) {
    io.to(`${roomType}:${roomId}`).emit(event, payload);
  }

  function assertRoomAccess(userId, roomType, roomId) {
    if (roomType === "group") {
      if (!memoryStore.userCanAccessGroup(userId, roomId)) {
        throw new Error("Group access denied");
      }

      return;
    }

    if (roomType === "pvt") {
      if (!memoryStore.userCanAccessPvt(userId, roomId)) {
        throw new Error("PVT access denied");
      }

      return;
    }

    throw new Error("room_type invalido");
  }

  async function processUserMessage({
    userId,
    roomType,
    roomId,
    content,
    mediaUrl,
    mediaType
  }) {
    assertRoomAccess(userId, roomType, roomId);

    const message = memoryStore.createMessage({
      conversationId: roomId,
      conversationType: roomType,
      senderType: "user",
      senderId: userId,
      content,
      mediaUrl,
      mediaType,
      transcription: null
    });

    if (mediaType === "audio" && memoryStore.getSystemSettings().stt_enabled) {
      const sttResult = await transcribeAudio({ mediaUrl });
      memoryStore.updateMessage(message.id, {
        transcription: sttResult.transcription
      });
    }

    const hydratedMessage = hydrateMessageForEvent(
      memoryStore.messages.find((entry) => entry.id === message.id) ?? message
    );
    emitToRoom(roomType, roomId, "message_received", hydratedMessage);

    if (mediaType === "audio") {
      emitToRoom(roomType, roomId, "message_updated", {
        message_id: message.id,
        room_id: roomId,
        room_type: roomType,
        transcription:
          memoryStore.messages.find((entry) => entry.id === message.id)?.transcription ?? null,
        tts_audio_url: null,
        status: "sent"
      });
    }

    await runMockAgentFlow({
      roomType,
      roomId,
      triggeringMessage: message,
      emitToRoom: (event, payload) => emitToRoom(roomType, roomId, event, payload)
    });

    return memoryStore.messages.find((entry) => entry.id === message.id) ?? message;
  }

  return {
    processUserMessage
  };
}
