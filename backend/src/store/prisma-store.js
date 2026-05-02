import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const prismaStore = {
  // Users
  async findUserByEmail(email) {
    return prisma.user.findFirst({
      where: { email, is_active: true }
    });
  },

  async findUserById(id) {
    return prisma.user.findFirst({
      where: { id, is_active: true }
    });
  },

  async listUsers() {
    return prisma.user.findMany();
  },

  async createUser(payload) {
    return prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: payload.role,
        avatar_url: payload.avatar_url ?? null,
        is_active: true
      }
    });
  },

  async updateUser(id, payload) {
    return prisma.user.update({
      where: { id },
      data: payload
    });
  },

  async deactivateUser(id) {
    return prisma.user.update({
      where: { id },
      data: {
        is_active: false,
        deactivated_at: new Date()
      }
    });
  },

  // Companies
  async listCompanies() {
    return prisma.company.findMany();
  },

  async findCompanyById(id) {
    return prisma.company.findFirst({
      where: { id, is_active: true }
    });
  },

  async findCompanyBySlug(slug) {
    return prisma.company.findFirst({
      where: { slug, is_active: true }
    });
  },

  async createCompany(payload) {
    return prisma.company.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        is_active: true
      }
    });
  },

  async updateCompany(id, payload) {
    return prisma.company.update({
      where: { id },
      data: payload
    });
  },

  async deactivateCompany(id) {
    return prisma.company.update({
      where: { id },
      data: { is_active: false }
    });
  },

  // Agents
  async listAgents() {
    return prisma.agent.findMany();
  },

  async findAgentById(id) {
    return prisma.agent.findUnique({
      where: { id }
    });
  },

  async listAgentsByCompany({ companyId, companySlug } = {}) {
    return prisma.agent.findMany({
      where: {
        is_active: true,
        ...(companyId ? { company_id: companyId } : {}),
        ...(companySlug ? { company: { slug: companySlug } } : {})
      },
      include: { company: true }
    });
  },

  async createAgent(payload) {
    return prisma.agent.create({
      data: {
        id: payload.id,
        name: payload.name,
        slug: payload.slug,
        provider: payload.provider,
        provider_agent_id: payload.provider_agent_id,
        arva_agent_id: payload.arva_agent_id,
        company_id: payload.company_id,
        role: payload.role,
        owner_company_id: payload.owner_company_id,
        owner_company_name: payload.owner_company_name,
        avatar_url: payload.avatar_url,
        description: payload.description,
        openclaw_config: payload.openclaw_config,
        tts_enabled: payload.tts_enabled ?? false,
        tts_voice_id: payload.tts_voice_id,
        is_active: payload.is_active ?? true,
        sync_source: payload.sync_source,
        last_synced_at: payload.last_synced_at ? new Date(payload.last_synced_at) : null,
        persona_profile: payload.persona_profile,
        runtime_profile: payload.runtime_profile,
        performance_profile: payload.performance_profile
      }
    });
  },

  async upsertAgentFromArva(payload) {
    const data = {
      name: payload.name,
      slug: payload.slug,
      provider: payload.provider,
      provider_agent_id: payload.provider_agent_id,
      arva_agent_id: payload.arva_agent_id,
      company_id: payload.company_id,
      role: payload.role,
      owner_company_id: payload.owner_company_id,
      owner_company_name: payload.owner_company_name,
      avatar_url: payload.avatar_url,
      description: payload.description,
      openclaw_config: payload.openclaw_config,
      tts_enabled: payload.tts_enabled ?? false,
      tts_voice_id: payload.tts_voice_id,
      is_active: payload.is_active ?? true,
      sync_source: payload.sync_source ?? "arva",
      last_synced_at: new Date(),
      persona_profile: payload.persona_profile,
      runtime_profile: payload.runtime_profile,
      performance_profile: payload.performance_profile
    };

    const agent = await prisma.agent.upsert({
      where: { id: payload.id },
      update: data,
      create: { id: payload.id, ...data }
    });

    const status = await prisma.agent.findUnique({ where: { id: payload.id } }) ? "updated" : "created";
    // Nota: O upsert do prisma não diz se criou ou atualizou facilmente sem uma query extra ou middleware.
    // Para simplificar o contrato atual:
    return { agent, status: "processed" };
  },

  // Refresh Tokens
  async createRefreshToken(payload) {
    return prisma.refreshToken.create({
      data: {
        token: payload.token,
        user_id: payload.user_id,
        expires_at: new Date(payload.expires_at)
      }
    });
  },

  async findRefreshToken(token) {
    return prisma.refreshToken.findUnique({
      where: { token }
    });
  },

  async deleteRefreshToken(token) {
    return prisma.refreshToken.delete({
      where: { token }
    });
  },

  async deleteUserRefreshTokens(userId, currentToken) {
    return prisma.refreshToken.deleteMany({
      where: {
        user_id: userId,
        token: currentToken
      }
    });
  },

  // Groups
  async listVisibleGroupsForUser(userId) {
    const memberRecords = await prisma.groupMember.findMany({
      where: { member_type: "user", member_id: userId }
    });
    const groupIds = memberRecords.map(m => m.group_id);

    return prisma.group.findMany({
      where: { id: { in: groupIds }, is_active: true }
    });
  },

  async listGroupMembers(groupId) {
    return prisma.groupMember.findMany({
      where: { group_id: groupId }
    });
  },

  async userCanAccessGroup(userId, groupId) {
    return prisma.groupMember.findFirst({
      where: {
        group_id: groupId,
        member_type: "user",
        member_id: userId
      }
    });
  },

  async addGroupMember(groupId, memberType, memberId) {
    return prisma.groupMember.create({
      data: {
        group_id: groupId,
        member_type: memberType,
        member_id: memberId
      }
    });
  },

  async removeGroupMember(groupId, memberType, memberId) {
    return prisma.groupMember.delete({
      where: {
        group_id_member_type_member_id: {
          group_id: groupId,
          member_type: memberType,
          member_id: memberId
        }
      }
    });
  },

  async updateGroup(id, payload) {
    return prisma.group.update({
      where: { id },
      data: payload
    });
  },

  async archiveGroup(id) {
    return prisma.group.update({
      where: { id },
      data: { is_active: false }
    });
  },

  async userCanAccessPvt(userId, pvtId) {
    const pvt = await prisma.pvt.findUnique({ where: { id: pvtId } });
    if (!pvt) return false;
    return (
      (pvt.participant_a_type === "user" && pvt.participant_a_id === userId) ||
      (pvt.participant_b_type === "user" && pvt.participant_b_id === userId)
    );
  },

  async getGroupById(id) {
    return prisma.group.findFirst({
      where: { id, is_active: true }
    });
  },

  async createGroup(payload, userId) {
    const group = await prisma.group.create({
      data: {
        name: payload.name,
        description: payload.description,
        topic: payload.topic,
        created_by: userId,
        is_active: true
      }
    });

    await prisma.groupMember.create({
      data: {
        group_id: group.id,
        member_type: "user",
        member_id: userId
      }
    });

    return group;
  },

  // Messages
  async listMessages({ conversationType, conversationId, before, limit = 50 }) {
    let where = {
      conversation_type: conversationType,
      conversation_id: conversationId
    };

    if (before) {
      const beforeMsg = await prisma.message.findUnique({ where: { id: before } });
      if (beforeMsg) {
        where.created_at = { lt: beforeMsg.created_at };
      }
    }

    return prisma.message.findMany({
      where,
      take: limit,
      orderBy: { created_at: "desc" }
    });
  },

  async createMessage(payload) {
    const message = await prisma.message.create({
      data: {
        conversation_id: payload.conversationId,
        conversation_type: payload.conversationType,
        sender_type: payload.senderType,
        sender_id: payload.senderId,
        content: payload.content,
        media_url: payload.mediaUrl,
        media_type: payload.mediaType,
        tts_audio_url: payload.ttsAudioUrl,
        read_by: [],
        status: payload.status ?? "sent",
        transcription: payload.transcription
      }
    });

    if (payload.conversationType === "pvt") {
      await prisma.pvt.update({
        where: { id: payload.conversationId },
        data: { last_message_at: message.created_at }
      });
    }

    return message;
  },

  // PVTs
  async createOrGetPvt(userId, participantType, participantId) {
    // Implementação da lógica de participantes canônicos para evitar duplicatas
    const participants = [
      { type: "user", id: userId },
      { type: participantType, id: participantId }
    ].sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`));

    const where = {
      participant_a_type: participants[0].type,
      participant_a_id: participants[0].id,
      participant_b_type: participants[1].type,
      participant_b_id: participants[1].id
    };

    const existing = await prisma.pvt.findUnique({
      where: {
        participant_a_type_participant_a_id_participant_b_type_participant_b_id: where
      }
    });

    if (existing) {
      return { pvt: existing, isNew: false };
    }

    const pvt = await prisma.pvt.create({
      data: {
        ...where,
        created_at: new Date()
      }
    });

    return { pvt, isNew: true };
  },

  async getPvtById(id) {
    return prisma.pvt.findUnique({ where: { id } });
  },

  async listPvtsForUser(userId) {
    return prisma.pvt.findMany({
      where: {
        OR: [
          { participant_a_type: "user", participant_a_id: userId },
          { participant_b_type: "user", participant_b_id: userId }
        ]
      },
      orderBy: { last_message_at: "desc" }
    });
  },

  // Settings
  async getSystemSettings() {
    let settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: 1, stt_enabled: true, tts_enabled: true, inference_rate_limit: 500 }
      });
    }
    return settings;
  },

  async updateSystemSettings(payload) {
    return prisma.systemSettings.update({
      where: { id: 1 },
      data: payload
    });
  },

  // Logs
  async createOpenclawLog(payload) {
    return prisma.openclawLog.create({
      data: {
        agent_id: payload.agent_id,
        status: payload.status,
        payload: payload.payload,
        response: payload.response
      }
    });
  },

  async listOpenclawLogs({ agentId, status } = {}) {
    return prisma.openclawLog.findMany({
      where: {
        ...(agentId ? { agent_id: agentId } : {}),
        ...(status ? { status: status } : {})
      },
      orderBy: { created_at: "desc" }
    });
  },

  async getConversationSnapshotForUser(userId) {
    const groups = await this.listVisibleGroupsForUser(userId);
    const pvts = await this.listPvtsForUser(userId);

    const groupsWithLatest = await Promise.all(groups.map(async (group) => {
      const latest = (await this.listMessages({
        conversationType: "group",
        conversationId: group.id,
        limit: 1
      }))[0];

      return {
        id: group.id,
        type: "group",
        name: group.name,
        topic: group.topic,
        latest_message: latest?.content ?? "",
        latest_message_at: latest?.created_at ?? group.created_at,
        unread_count: 0
      };
    }));

    const pvtsWithLatest = await Promise.all(pvts.map(async (pvt) => {
      const latest = (await this.listMessages({
        conversationType: "pvt",
        conversationId: pvt.id,
        limit: 1
      }))[0];

      const counterpartType = pvt.participant_a_type === "user" && pvt.participant_a_id === userId 
        ? pvt.participant_b_type 
        : pvt.participant_a_type;
      const counterpartId = pvt.participant_a_type === "user" && pvt.participant_a_id === userId 
        ? pvt.participant_b_id 
        : pvt.participant_a_id;

      let name = "Conversa";
      if (counterpartType === "agent") {
        const agent = await this.findAgentById(counterpartId);
        name = agent?.name ?? "Agente";
      } else {
        const user = await this.findUserById(counterpartId);
        name = user?.name ?? "Usuario";
      }

      return {
        id: pvt.id,
        type: "pvt",
        participant_type: counterpartType,
        name,
        latest_message: latest?.content ?? "",
        latest_message_at: latest?.created_at ?? pvt.created_at,
        unread_count: 0
      };
    }));

    return {
      groups: groupsWithLatest.sort((a, b) => new Date(b.latest_message_at) - new Date(a.latest_message_at)),
      pvts: pvtsWithLatest.sort((a, b) => new Date(b.latest_message_at) - new Date(a.latest_message_at))
    };
  }
};
