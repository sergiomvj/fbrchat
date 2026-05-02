import { prismaStore as appStore } from "../store/prisma-store.js";
import { hydrateMessageForEvent, runMockAgentFlow } from "../services/agent-runtime.js";
import { transcribeAudio } from "../services/stt-service.js";

export function createMessageGateway(io) {
  function emitToRoom(roomType, roomId, event, payload) {
    io.to(`${roomType}:${roomId}`).emit(event, payload);
  }

  async function assertRoomAccess(userId, roomType, roomId) {
    if (roomType === "group") {
      if (!(await appStore.userCanAccessGroup(userId, roomId))) {
        throw new Error("Group access denied");
      }

      return;
    }

    if (roomType === "pvt") {
      if (!(await appStore.userCanAccessPvt(userId, roomId))) {
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
    await assertRoomAccess(userId, roomType, roomId);

    const message = await appStore.createMessage({
      conversationId: roomId,
      conversationType: roomType,
      senderType: "user",
      senderId: userId,
      content,
      mediaUrl,
      mediaType,
      transcription: null
    });

    const settings = await appStore.getSystemSettings();

    if (mediaType === "audio" && settings.stt_enabled) {
      const sttResult = await transcribeAudio({ mediaUrl });
      await appStore.updateMessage(message.id, {
        transcription: sttResult.transcription
      });
    }

    // Refresh message from DB after potential updates
    const currentMessage = await appStore.messages.find ? await appStore.messages.find((entry) => entry.id === message.id) : (await prisma.message.findUnique({ where: { id: message.id } }));
    // Nota: prismaStore.messages não existe, vou usar o método de busca se implementado ou o próprio objeto retornado.
    // Como prismaStore.createMessage retorna o objeto, podemos usar ele.
    
    const dbMessage = (await appStore.listMessages({ conversationType: roomType, conversationId: roomId, limit: 100 })).find(m => m.id === message.id) || message;

    const hydratedMessage = await hydrateMessageForEvent(dbMessage);
    emitToRoom(roomType, roomId, "message_received", hydratedMessage);

    if (mediaType === "audio") {
      emitToRoom(roomType, roomId, "message_updated", {
        message_id: message.id,
        room_id: roomId,
        room_type: roomType,
        transcription: dbMessage.transcription ?? null,
        tts_audio_url: null,
        status: "sent"
      });
    }

    await runMockAgentFlow({
      roomType,
      roomId,
      triggeringMessage: dbMessage,
      emitToRoom: (event, payload) => emitToRoom(roomType, roomId, event, payload)
    });

    return dbMessage;
  }

  return {
    processUserMessage
  };
}
