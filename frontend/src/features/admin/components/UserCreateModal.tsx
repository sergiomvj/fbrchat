import { useState } from "react";
import { apiRequest } from "../../../lib/api";

type UserCreateModalProps = {
  token: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function UserCreateModal({ token, onClose, onSuccess }: UserCreateModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiRequest("/api/admin/users", {
        method: "POST",
        token,
        body: JSON.stringify({ name, email, password, role })
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar usuario");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "400px" }}>
        <header className="modal-header">
          <h3>Provision New User</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </header>
        
        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-message" style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
          
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="input"
              placeholder="Ex: João Duarte"
            />
          </div>

          <div className="form-group">
            <label>Email Anchor</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="input"
              placeholder="email@fbr.local"
            />
          </div>

          <div className="form-group">
            <label>Security Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label>Authority Level</label>
            <select 
              value={role} 
              onChange={e => setRole(e.target.value as any)}
              className="input"
            >
              <option value="user">User (Standard Access)</option>
              <option value="admin">Administrator (Full Node Control)</option>
            </select>
          </div>

          <footer className="modal-footer" style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
            <button type="button" className="button" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="button button--primary" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm Provisioning"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
