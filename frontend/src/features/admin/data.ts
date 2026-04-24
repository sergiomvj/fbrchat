export const adminUsers = [
  {
    id: "u1",
    name: "Arthur Hevler",
    email: "a.hevler@fbr.node",
    role: "Superadmin",
    status: "Active",
    lastIngress: "2023-10-24 12:44"
  },
  {
    id: "u2",
    name: "Sarah K.",
    email: "sarah.k@fbr.node",
    role: "Operator",
    status: "Idle",
    lastIngress: "2023-10-24 10:12"
  },
  {
    id: "u3",
    name: "Marcus Low",
    email: "m.low@fbr.node",
    role: "Auditor",
    status: "Active",
    lastIngress: "2023-10-24 13:43"
  }
];

export const adminAgents = [
  {
    id: "a1",
    name: "Agente de Vendas",
    slug: "@vendas",
    company: "FBR Holding",
    companySlug: "fbr-holding",
    model: "claude-3-5-sonnet",
    status: "Active"
  },
  {
    id: "a2",
    name: "Agente RH",
    slug: "@rh",
    company: "FBR Holding",
    companySlug: "fbr-holding",
    model: "claude-3-5-sonnet",
    status: "Active"
  },
  {
    id: "a3",
    name: "Agente Produto",
    slug: "@produto",
    company: "Global Tech",
    companySlug: "global-tech",
    model: "claude-3-5-sonnet",
    status: "Draft"
  }
];

export const adminGroups = [
  {
    id: "g1",
    name: "Pipeline Vendas",
    topic: "CRM, pipeline e follow-up comercial",
    members: 4,
    activeAgents: 1,
    messages: 128
  },
  {
    id: "g2",
    name: "Produto",
    topic: "Roadmap, escopo e bugs",
    members: 7,
    activeAgents: 1,
    messages: 86
  }
];

export const adminLogs = [
  {
    id: "l1",
    timestamp: "2026-04-24 12:14:07",
    agent: "Agente de Vendas",
    latency: "412ms",
    tokens: "1240",
    cost: "$0.014",
    status: "success"
  },
  {
    id: "l2",
    timestamp: "2026-04-24 12:20:54",
    agent: "Agente Produto",
    latency: "10s",
    tokens: "0",
    cost: "$0.000",
    status: "timeout"
  },
  {
    id: "l3",
    timestamp: "2026-04-24 12:28:19",
    agent: "Agente RH",
    latency: "221ms",
    tokens: "840",
    cost: "$0.009",
    status: "error"
  }
];
