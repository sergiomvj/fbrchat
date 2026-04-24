import { useAdminRuntime } from "../AdminRuntime";
import { AdminPageLayout } from "../components/AdminPageLayout";

export function AdminGroupsPage() {
  const { groups } = useAdminRuntime();

  return (
    <AdminPageLayout
      title="Groups"
      subtitle="Visao dos grupos, topicos ativos e volume operacional."
      actions={<button className="button">Criar Grupo</button>}
    >
      <table className="data-table">
        <thead>
          <tr>
            <th>Grupo</th>
            <th>Topico</th>
            <th>Membros</th>
            <th>Agentes Ativos</th>
            <th>Mensagens</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.id}>
              <td>{group.name}</td>
              <td>{group.topic}</td>
              <td>{group.members.filter((member) => member.member_type === "user").length}</td>
              <td>{group.members.filter((member) => member.member_type === "agent").length}</td>
              <td>{group.members.length * 12}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminPageLayout>
  );
}
