import { buildContextPacket } from "./context-router.js";
import { callOpenClaw } from "./openclaw-client.js";
import { synthesizeSpeech } from "./tts-service.js";
import { prismaStore as appStore } from "../store/prisma-store.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runMockAgentFlow({
  roomType,
  roomId,
  triggeringMessage,
  emitToRoom
}) {
  const participants = await appStore.getConversationAgents(roomType, roomId);
  const agents = (await Promise.all(
    participants.map((entry) => appStore.findAgentById(entry.id))
  )).filter(Boolean).filter((agent) => agent.is_active);

  for (const agent of agents) {
    emitToRoom("agent_typing", {
      room_id: roomId,
      room_type: roomType,
      agent_id: agent.id,
      agent_name: agent.name
    });

    await delay(150);

    const contextPacket = await buildContextPacket({
      userId: triggeringMessage.sender_id,
      roomType,
      roomId
    });
    const providerResponse = await callOpenClaw({
      agent,
      prompt: triggeringMessage.content || triggeringMessage.transcription || "",
      context: contextPacket.context
    });

    await appStore.createOpenclawLog({
      agent_id: agent.id,
      conversation_type: roomType,
      conversation_id: roomId,
      request_id: crypto.randomUUID(),
      model: agent.openclaw_config.model,
      latency_ms: providerResponse.latency_ms,
      prompt_tokens: providerResponse.prompt_tokens,
      completion_tokens: providerResponse.completion_tokens,
      estimated_cost_usd: providerResponse.estimated_cost_usd,
      status: providerResponse.status,
      error_code: providerResponse.error_code
    });

    const responseMessage = await appStore.createMessage({
      conversationId: roomId,
      conversationType: roomType,
      senderType: "agent",
      senderId: agent.id,
      content: providerResponse.content,
      status: providerResponse.status === "success" ? "sent" : providerResponse.status
    });

    emitToRoom("message_received", await hydrateMessageForEvent(responseMessage));

    const settings = await appStore.getSystemSettings();

    if (
      providerResponse.status === "success" &&
      settings.tts_enabled &&
      agent.tts_enabled
    ) {
      await delay(120);
      const synthesized = await synthesizeSpeech({ messageId: responseMessage.id });
      await appStore.updateMessage(responseMessage.id, {
        tts_audio_url: synthesized.audioUrl
      });
      emitToRoom("message_updated", {
        message_id: responseMessage.id,
        room_id: roomId,
        room_type: roomType,
        transcription: null,
        tts_audio_url: synthesized.audioUrl,
        status: "sent"
      });
    }

    emitToRoom("agent_done_typing", {
      room_id: roomId,
      room_type: roomType,
      agent_id: agent.id
    });
  }
}

export async function hydrateMessageForEvent(message) {
  let senderName = "Sistema";

  if (message.sender_type === "user") {
    const user = await appStore.findUserById(message.sender_id);
    senderName = user?.name ?? "Usuario removido";
  }

  if (message.sender_type === "agent") {
    const agent = await appStore.findAgentById(message.sender_id);
    senderName = agent?.name ?? "Agente";
  }

  return {
    id: message.id,
    room_id: message.conversation_id,
    room_type: message.conversation_type,
    sender_type: message.sender_type,
    sender_id: message.sender_id,
    sender_name: senderName,
    sender_avatar: null,
    content: message.content,
    media_url: message.media_url,
    media_type: message.media_type,
    tts_audio_url: message.tts_audio_url ?? null,
    transcription: message.transcription ?? null,
    created_at: message.created_at,
    status: message.status ?? "sent"
  };
}
