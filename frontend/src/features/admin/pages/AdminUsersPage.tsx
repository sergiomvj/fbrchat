import { useState } from "react";
import { useAdminRuntime } from "../AdminRuntime";
import { AdminPageLayout } from "../components/AdminPageLayout";
import { UserCreateModal } from "../components/UserCreateModal";

export function AdminUsersPage() {
  const { users, token, refresh } = useAdminRuntime();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <AdminPageLayout
      title="Users"
      subtitle="Gestao de acesso, papeis e ultimo ingresso operacional."
      actions={
        <button 
          className="button button--primary" 
          onClick={() => setIsModalOpen(true)}
        >
          Novo Usuario
        </button>
      }
    >
      {isModalOpen && token && (
        <UserCreateModal 
          token={token} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            refresh();
          }} 
        />
      )}
      <table className="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Ultimo Ingresso</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.is_active ? "Active" : "Inactive"}</td>
              <td>{user.last_seen || "Nunca"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminPageLayout>
  );
}
