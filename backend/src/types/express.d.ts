declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      name: string;
      email: string;
      role: "admin" | "user";
      avatar_url: string | null;
      is_active: boolean;
      created_at: string;
      last_seen: string | null;
      password: string;
      deactivated_at?: string;
    };
  }
}
