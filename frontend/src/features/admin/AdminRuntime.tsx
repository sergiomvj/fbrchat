import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren
} from "react";
import { apiRequest } from "../../lib/api";
import { loginAs } from "../chat/chat-api";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  is_active: boolean;
  last_seen: string | null;
};

type AdminCompany = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

type AdminAgent = {
  id: string;
  name: string;
  slug: string;
  company_id: string;
  company_slug: string | null;
  company_name: string | null;
  openclaw_config: {
    model: string;
    api_key_ref: string;
  };
  tts_enabled: boolean;
  is_active: boolean;
};

type AdminGroup = {
  id: string;
  name: string;
  topic: string;
  members: Array<{ member_type: string; member_id: string }>;
};

type AdminLog = {
  id: string;
  created_at: string;
  agent_id: string;
  model: string;
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  estimated_cost_usd: number;
  status: "success" | "timeout" | "error";
};

type AdminSettings = {
  stt_enabled: boolean;
  tts_enabled: boolean;
  inference_rate_limit: number;
};

type AdminRuntimeValue = {
  token: string | null;
  users: AdminUser[];
  companies: AdminCompany[];
  agents: AdminAgent[];
  groups: AdminGroup[];
  logs: AdminLog[];
  settings: AdminSettings | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveSettings: (payload: Partial<AdminSettings>) => Promise<void>;
};

const AdminRuntimeContext = createContext<AdminRuntimeValue | null>(null);

async function fetchAdminBundle(token: string) {
  const [users, companies, agents, groups, logs, settings] = await Promise.all([
    apiRequest<AdminUser[]>("/api/admin/users", { token }),
    apiRequest<AdminCompany[]>("/api/admin/companies", { token }),
    apiRequest<AdminAgent[]>("/api/admin/agents", { token }),
    apiRequest<AdminGroup[]>("/api/groups", { token }),
    apiRequest<AdminLog[]>("/api/admin/logs/openclaw?limit=20", { token }),
    apiRequest<AdminSettings>("/api/admin/settings", { token })
  ]);

  return { users, companies, agents, groups, logs, settings };
}

export function AdminRuntimeProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh(withToken = token) {
    if (!withToken) return;

    setIsLoading(true);
    try {
      const bundle = await fetchAdminBundle(withToken);
      setUsers(bundle.users);
      setCompanies(bundle.companies);
      setAgents(bundle.agents);
      setGroups(bundle.groups);
      setLogs(bundle.logs);
      setSettings(bundle.settings);
      setError(null);
    } catch (runtimeError) {
      setError(runtimeError instanceof Error ? runtimeError.message : "Falha no admin");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrapAdmin() {
      try {
        const accessToken = await loginAs("admin");
        if (cancelled) return;
        setToken(accessToken);
        await refresh(accessToken);
      } catch (runtimeError) {
        if (!cancelled) {
          setError(runtimeError instanceof Error ? runtimeError.message : "Falha no admin");
          setIsLoading(false);
        }
      }
    }

    bootstrapAdmin();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveSettings(payload: Partial<AdminSettings>) {
    if (!token) return;

    const updated = await apiRequest<AdminSettings>("/api/admin/settings", {
      method: "PUT",
      token,
      body: JSON.stringify(payload)
    });

    setSettings(updated);
  }

  return (
    <AdminRuntimeContext.Provider
      value={{
        token,
        users,
        companies,
        agents,
        groups,
        logs,
        settings,
        isLoading,
        error,
        refresh: () => refresh(),
        saveSettings
      }}
    >
      {children}
    </AdminRuntimeContext.Provider>
  );
}

export function useAdminRuntime() {
  const context = useContext(AdminRuntimeContext);

  if (!context) {
    throw new Error("useAdminRuntime must be used within AdminRuntimeProvider");
  }

  return context;
}
