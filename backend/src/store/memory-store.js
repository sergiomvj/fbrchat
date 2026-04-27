import fixtureData from "../fixtures/seed-data.json" with { type: "json" };

function createInitialUsers() {
  return fixtureData.users.map((user) => ({
    ...user,
    password: user.email === "admin@fbr.local" ? "admin123" : "user123",
    is_active: true,
    created_at: new Date().toISOString(),
    last_seen: null
  }));
}

function createInitialAgents() {
  return fixtureData.agents.map((agent) => ({
    ...agent,
    avatar_url: null,
    description: null,
    role: null,
    owner_company_id: null,
    owner_company_name: null,
    is_active: true,
    sync_source: null,
    last_synced_at: null,
    persona_profile: null,
    runtime_profile: null,
    performance_profile: null,
    openclaw_config: {
      model: "claude-3-5-sonnet",
      system_prompt: `Você é ${agent.name}.`,
      temperature: 0.3,
      max_tokens: 1000,
      api_key_ref: `OPENCLAW_${agent.slug.toUpperCase()}_KEY`
    }
  }));
}

function createInitialCompanies() {
  return fixtureData.companies.map((company) => ({
    ...company,
    is_active: true,
    created_at: new Date().toISOString()
  }));
}

function createInitialGroups() {
  return [
    {
      id: fixtureData.groups[0].id,
      name: fixtureData.groups[0].name,
      description: "Canal operacional de vendas",
      topic: fixtureData.groups[0].topic,
      created_by: fixtureData.users[0].id,
      created_at: new Date().toISOString(),
      is_active: true
    }
  ];
}

function createInitialGroupMembers() {
  return [
    {
      group_id: fixtureData.groups[0].id,
      member_type: "user",
      member_id: fixtureData.users[0].id,
      joined_at: new Date().toISOString()
    },
    {
      group_id: fixtureData.groups[0].id,
      member_type: "user",
      member_id: fixtureData.users[1].id,
      joined_at: new Date().toISOString()
    },
    {
      group_id: fixtureData.groups[0].id,
      member_type: "agent",
      member_id: fixtureData.agents[0].id,
      joined_at: new Date().toISOString()
    }
  ];
}

function canonicalParticipants(left, right) {
  const a = `${left.type}:${left.id}`;
  const b = `${right.type}:${right.id}`;
  return a < b
    ? {
        participant_a_type: left.type,
        participant_a_id: left.id,
        participant_b_type: right.type,
        participant_b_id: right.id
      }
    : {
        participant_a_type: right.type,
        participant_a_id: right.id,
        participant_b_type: left.type,
        participant_b_id: left.id
      };
}

function createInitialPvts() {
  return [
    {
      id: crypto.randomUUID(),
      ...canonicalParticipants(
        { type: "user", id: fixtureData.users[0].id },
        { type: "user", id: fixtureData.users[1].id }
      ),
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      ...canonicalParticipants(
        { type: "user", id: fixtureData.users[1].id },
        { type: "agent", id: fixtureData.agents[0].id }
      ),
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  ];
}

function createInitialMessages(groups, pvts) {
  const groupId = groups[0].id;
  const userPvtId = pvts[0].id;
  const agentPvtId = pvts[1].id;

  return [
    {
      id: crypto.randomUUID(),
      conversation_id: groupId,
      conversation_type: "group",
      sender_type: "user",
      sender_id: fixtureData.users[1].id,
      content: "Precisamos revisar o forecast da Global Tech hoje.",
      media_url: null,
      media_type: null,
      tts_audio_url: null,
      created_at: new Date(Date.now() - 300000).toISOString(),
      read_by: []
    },
    {
      id: crypto.randomUUID(),
      conversation_id: groupId,
      conversation_type: "group",
      sender_type: "agent",
      sender_id: fixtureData.agents[0].id,
      content: "Ja analisei o pipeline. Posso resumir o status por conta.",
      media_url: null,
      media_type: null,
      tts_audio_url: null,
      created_at: new Date(Date.now() - 240000).toISOString(),
      read_by: []
    },
    {
      id: crypto.randomUUID(),
      conversation_id: userPvtId,
      conversation_type: "pvt",
      sender_type: "user",
      sender_id: fixtureData.users[0].id,
      content: "Pode me ajudar com o onboarding do novo usuario?",
      media_url: null,
      media_type: null,
      tts_audio_url: null,
      created_at: new Date(Date.now() - 180000).toISOString(),
      read_by: []
    },
    {
      id: crypto.randomUUID(),
      conversation_id: agentPvtId,
      conversation_type: "pvt",
      sender_type: "user",
      sender_id: fixtureData.users[1].id,
      content: "Qual o status do lead da Global Tech?",
      media_url: null,
      media_type: null,
      tts_audio_url: null,
      created_at: new Date(Date.now() - 120000).toISOString(),
      read_by: []
    },
    {
      id: crypto.randomUUID(),
      conversation_id: agentPvtId,
      conversation_type: "pvt",
      sender_type: "agent",
      sender_id: fixtureData.agents[0].id,
      content: "Lead em proposta enviada, probabilidade atual de 85%.",
      media_url: null,
      media_type: null,
      tts_audio_url: null,
      created_at: new Date(Date.now() - 60000).toISOString(),
      read_by: []
    }
  ];
}

function createInitialSettings() {
  return {
    stt_enabled: true,
    tts_enabled: true,
    inference_rate_limit: 500
  };
}

const users = createInitialUsers();
const companies = createInitialCompanies();
const agents = createInitialAgents();
const groups = createInitialGroups();
const groupMembers = createInitialGroupMembers();
const pvts = createInitialPvts();
const messages = createInitialMessages(groups, pvts);
const systemSettings = createInitialSettings();
const openclawLogs = [];
const refreshTokens = [];

function createId() {
  return crypto.randomUUID();
}

export const memoryStore = {
  users,
  companies,
  agents,
  groups,
  groupMembers,
  pvts,
  messages,
  systemSettings,
  openclawLogs,
  refreshTokens,
  reset() {
    users.length = 0;
    users.push(...createInitialUsers());

    companies.length = 0;
    companies.push(...createInitialCompanies());

    agents.length = 0;
    agents.push(...createInitialAgents());

    groups.length = 0;
    groups.push(...createInitialGroups());

    groupMembers.length = 0;
    groupMembers.push(...createInitialGroupMembers());

    pvts.length = 0;
    pvts.push(...createInitialPvts());

    messages.length = 0;
    messages.push(...createInitialMessages(groups, pvts));

    openclawLogs.length = 0;

    Object.assign(systemSettings, createInitialSettings());

    refreshTokens.length = 0;
  },
  findUserByEmail(email) {
    return users.find((user) => user.email === email && user.is_active);
  },
  findUserById(id) {
    return users.find((user) => user.id === id && user.is_active);
  },
  listUsers() {
    return users;
  },
  listCompanies() {
    return companies;
  },
  findCompanyById(id) {
    return companies.find((company) => company.id === id && company.is_active);
  },
  findCompanyBySlug(slug) {
    return companies.find((company) => company.slug === slug && company.is_active);
  },
  createCompany(payload) {
    const company = {
      id: createId(),
      name: payload.name,
      slug: payload.slug,
      is_active: true,
      created_at: new Date().toISOString()
    };

    companies.push(company);
    return company;
  },
  updateCompany(id, payload) {
    const company = companies.find((entry) => entry.id === id);
    if (!company) return null;
    Object.assign(company, payload);
    return company;
  },
  deactivateCompany(id) {
    const company = companies.find((entry) => entry.id === id);
    if (!company) return null;
    company.is_active = false;
    return company;
  },
  createUser(payload) {
    const user = {
      id: createId(),
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      avatar_url: payload.avatar_url ?? null,
      is_active: true,
      created_at: new Date().toISOString(),
      last_seen: null
    };

    users.push(user);
    return user;
  },
  updateUser(id, payload) {
    const user = users.find((entry) => entry.id === id);
    if (!user) return null;
    Object.assign(user, payload);
    return user;
  },
  deactivateUser(id) {
    const user = users.find((entry) => entry.id === id);
    if (!user) return null;
    user.is_active = false;
    user.deactivated_at = new Date().toISOString();
    return user;
  },
  listAgents() {
    return agents;
  },
  findAgentById(id) {
    return agents.find((agent) => agent.id === id) ?? null;
  },
  listAgentsByCompany({ companyId, companySlug } = {}) {
    return agents.filter((agent) => {
      if (!agent.is_active) return false;
      if (!companyId && !companySlug) return true;

      const company = companies.find((entry) => entry.id === agent.company_id);
      if (!company) return false;

      if (companyId && agent.company_id !== companyId) return false;
      if (companySlug && company.slug !== companySlug) return false;

      return true;
    });
  },
  createAgent(payload) {
    const agent = {
      id: payload.id ?? createId(),
      name: payload.name,
      slug: payload.slug,
      provider: payload.provider ?? null,
      provider_agent_id: payload.provider_agent_id ?? null,
      arva_agent_id: payload.arva_agent_id ?? null,
      company_id: payload.company_id,
      role: payload.role ?? null,
      owner_company_id: payload.owner_company_id ?? null,
      owner_company_name: payload.owner_company_name ?? null,
      avatar_url: payload.avatar_url ?? null,
      description: payload.description ?? null,
      openclaw_config: payload.openclaw_config,
      tts_enabled: payload.tts_enabled ?? false,
      tts_voice_id: payload.tts_voice_id ?? null,
      is_active: payload.is_active ?? true,
      sync_source: payload.sync_source ?? null,
      last_synced_at: payload.last_synced_at ?? null,
      persona_profile: payload.persona_profile ?? null,
      runtime_profile: payload.runtime_profile ?? null,
      performance_profile: payload.performance_profile ?? null,
      created_at: new Date().toISOString()
    };

    agents.push(agent);
    return agent;
  },
  upsertAgentFromArva(payload) {
    const existing = agents.find((entry) => entry.id === payload.id);

    if (existing) {
      Object.assign(existing, {
        name: payload.name,
        slug: payload.slug,
          provider: payload.provider,
          provider_agent_id: payload.provider_agent_id,
          arva_agent_id: payload.arva_agent_id,
          company_id: payload.company_id,
          role: payload.role ?? null,
          owner_company_id: payload.owner_company_id ?? null,
          owner_company_name: payload.owner_company_name ?? null,
          avatar_url: payload.avatar_url ?? null,
          description: payload.description ?? null,
          openclaw_config: payload.openclaw_config,
          tts_enabled: payload.tts_enabled ?? false,
          tts_voice_id: payload.tts_voice_id ?? null,
          is_active: payload.is_active ?? true,
          sync_source: payload.sync_source ?? "arva",
          last_synced_at: payload.last_synced_at ?? new Date().toISOString(),
          persona_profile: payload.persona_profile ?? null,
          runtime_profile: payload.runtime_profile ?? null,
          performance_profile: payload.performance_profile ?? null
        });

      return { agent: existing, status: "updated" };
    }

    return {
      agent: this.createAgent(payload),
      status: "created"
    };
  },
  updateAgent(id, payload) {
    const agent = agents.find((entry) => entry.id === id);
    if (!agent) return null;
    Object.assign(agent, payload);
    return agent;
  },
  deactivateAgent(id) {
    const agent = agents.find((entry) => entry.id === id);
    if (!agent) return null;
    agent.is_active = false;
    return agent;
  },
  listVisibleGroupsForUser(userId) {
    const visibleIds = new Set(
      groupMembers
        .filter((member) => member.member_type === "user" && member.member_id === userId)
        .map((member) => member.group_id)
    );

    return groups.filter((group) => group.is_active && visibleIds.has(group.id));
  },
  getGroupById(groupId) {
    return groups.find((group) => group.id === groupId && group.is_active);
  },
  listGroupMembers(groupId) {
    return groupMembers.filter((member) => member.group_id === groupId);
  },
  userCanAccessGroup(userId, groupId) {
    return groupMembers.some(
      (member) =>
        member.group_id === groupId &&
        member.member_type === "user" &&
        member.member_id === userId
    );
  },
  createGroup(payload, userId) {
    const group = {
      id: createId(),
      name: payload.name,
      description: payload.description,
      topic: payload.topic,
      created_by: userId,
      created_at: new Date().toISOString(),
      is_active: true
    };

    groups.push(group);
    groupMembers.push({
      group_id: group.id,
      member_type: "user",
      member_id: userId,
      joined_at: new Date().toISOString()
    });
    return group;
  },
  updateGroup(id, payload) {
    const group = groups.find((entry) => entry.id === id && entry.is_active);
    if (!group) return null;
    Object.assign(group, payload);
    return group;
  },
  archiveGroup(id) {
    const group = groups.find((entry) => entry.id === id && entry.is_active);
    if (!group) return null;
    group.is_active = false;
    return group;
  },
  addGroupMember(groupId, memberType, memberId) {
    const exists = groupMembers.some(
      (member) =>
        member.group_id === groupId &&
        member.member_type === memberType &&
        member.member_id === memberId
    );

    if (exists) return null;

    const member = {
      group_id: groupId,
      member_type: memberType,
      member_id: memberId,
      joined_at: new Date().toISOString()
    };
    groupMembers.push(member);
    return member;
  },
  removeGroupMember(groupId, memberType, memberId) {
    const index = groupMembers.findIndex(
      (member) =>
        member.group_id === groupId &&
        member.member_type === memberType &&
        member.member_id === memberId
    );
    if (index === -1) return false;
    groupMembers.splice(index, 1);
    return true;
  },
  listMessages({ conversationType, conversationId, before, limit = 50 }) {
    let filtered = messages
      .filter(
        (message) =>
          message.conversation_type === conversationType &&
          message.conversation_id === conversationId
      )
      .sort((left, right) => right.created_at.localeCompare(left.created_at));

    if (before) {
      const beforeMessage = messages.find((message) => message.id === before);
      if (beforeMessage) {
        filtered = filtered.filter(
          (message) => message.created_at < beforeMessage.created_at
        );
      }
    }

    return filtered.slice(0, limit);
  },
  createMessage(payload) {
    const message = {
      id: createId(),
      conversation_id: payload.conversationId,
      conversation_type: payload.conversationType,
      sender_type: payload.senderType,
      sender_id: payload.senderId ?? null,
      content: payload.content ?? null,
      media_url: payload.mediaUrl ?? null,
      media_type: payload.mediaType ?? null,
      tts_audio_url: payload.ttsAudioUrl ?? null,
      created_at: new Date().toISOString(),
      read_by: [],
      status: payload.status ?? "sent",
      transcription: payload.transcription ?? null
    };

    messages.push(message);

    if (payload.conversationType === "pvt") {
      const pvt = pvts.find((entry) => entry.id === payload.conversationId);
      if (pvt) {
        pvt.last_message_at = message.created_at;
      }
    }

    return message;
  },
  updateMessage(id, payload) {
    const message = messages.find((entry) => entry.id === id);
    if (!message) return null;
    Object.assign(message, payload);
    return message;
  },
  getConversationParticipants(roomType, roomId) {
    if (roomType === "group") {
      return groupMembers
        .filter((member) => member.group_id === roomId)
        .map((member) => ({ type: member.member_type, id: member.member_id }));
    }

    const pvt = pvts.find((entry) => entry.id === roomId);
    if (!pvt) return [];
    return [
      { type: pvt.participant_a_type, id: pvt.participant_a_id },
      { type: pvt.participant_b_type, id: pvt.participant_b_id }
    ];
  },
  getConversationAgents(roomType, roomId) {
    return this.getConversationParticipants(roomType, roomId).filter(
      (participant) => participant.type === "agent"
    );
  },
  getConversationSnapshotForUser(userId) {
    const groupsForUser = this.listVisibleGroupsForUser(userId).map((group) => {
      const latest = this.listMessages({
        conversationType: "group",
        conversationId: group.id,
        limit: 1
      })[0];

      return {
        id: group.id,
        type: "group",
        name: group.name,
        topic: group.topic,
        latest_message: latest?.content ?? "",
        latest_message_at: latest?.created_at ?? group.created_at,
        unread_count: 0
      };
    });

    const pvtsForUser = this.listPvtsForUser(userId).map((pvt) => {
      const latest = this.listMessages({
        conversationType: "pvt",
        conversationId: pvt.id,
        limit: 1
      })[0];

      const counterpart =
        pvt.participant_a_type === "user" && pvt.participant_a_id === userId
          ? { type: pvt.participant_b_type, id: pvt.participant_b_id }
          : { type: pvt.participant_a_type, id: pvt.participant_a_id };

      const name =
        counterpart.type === "agent"
          ? agents.find((agent) => agent.id === counterpart.id)?.name ?? "Agent"
          : users.find((user) => user.id === counterpart.id)?.name ?? "User";

      return {
        id: pvt.id,
        type: "pvt",
        participant_type: counterpart.type,
        name,
        latest_message: latest?.content ?? "",
        latest_message_at: latest?.created_at ?? pvt.created_at,
        unread_count: 0
      };
    });

    return {
      groups: groupsForUser.sort((a, b) =>
        b.latest_message_at.localeCompare(a.latest_message_at)
      ),
      pvts: pvtsForUser.sort((a, b) =>
        b.latest_message_at.localeCompare(a.latest_message_at)
      )
    };
  },
  listOpenclawLogs({ agentId, status } = {}) {
    return openclawLogs.filter((log) => {
      if (agentId && log.agent_id !== agentId) return false;
      if (status && log.status !== status) return false;
      return true;
    });
  },
  createOpenclawLog(payload) {
    const entry = {
      id: createId(),
      ...payload,
      created_at: new Date().toISOString()
    };
    openclawLogs.unshift(entry);
    return entry;
  },
  getSystemSettings() {
    return systemSettings;
  },
  updateSystemSettings(payload) {
    Object.assign(systemSettings, payload);
    return systemSettings;
  },
  userCanAccessPvt(userId, pvtId) {
    const pvt = pvts.find((entry) => entry.id === pvtId);
    if (!pvt) return false;
    return (
      (pvt.participant_a_type === "user" && pvt.participant_a_id === userId) ||
      (pvt.participant_b_type === "user" && pvt.participant_b_id === userId)
    );
  },
  listPvtsForUser(userId) {
    return pvts.filter(
      (pvt) =>
        (pvt.participant_a_type === "user" && pvt.participant_a_id === userId) ||
        (pvt.participant_b_type === "user" && pvt.participant_b_id === userId)
    );
  },
  findPvtByCanonicalParticipants(left, right) {
    const canonical = canonicalParticipants(left, right);
    return pvts.find(
      (pvt) =>
        pvt.participant_a_type === canonical.participant_a_type &&
        pvt.participant_a_id === canonical.participant_a_id &&
        pvt.participant_b_type === canonical.participant_b_type &&
        pvt.participant_b_id === canonical.participant_b_id
    );
  },
  createOrGetPvt(userId, participantType, participantId) {
    const existing = this.findPvtByCanonicalParticipants(
      { type: "user", id: userId },
      { type: participantType, id: participantId }
    );

    if (existing) {
      return { pvt: existing, isNew: false };
    }

    const pvt = {
      id: createId(),
      ...canonicalParticipants(
        { type: "user", id: userId },
        { type: participantType, id: participantId }
      ),
      last_message_at: null,
      created_at: new Date().toISOString()
    };

    pvts.push(pvt);
    return { pvt, isNew: true };
  },
  getPvtById(id) {
    return pvts.find((pvt) => pvt.id === id) ?? null;
  }
};
