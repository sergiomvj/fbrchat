import { useAdminRuntime } from "../AdminRuntime";
import { AdminPageLayout } from "../components/AdminPageLayout";

export function AdminUsersPage() {
  const { users } = useAdminRuntime();

  return (
    <AdminPageLayout
      title="Users"
      subtitle="Gestao de acesso, papeis e ultimo ingresso operacional."
      actions={<button className="button button--primary" onClick={() => alert("Abrindo painel de cadastro de usuário...")}>Novo Usuario</button>}
    >
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
