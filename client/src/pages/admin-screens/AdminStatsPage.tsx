import { GameButton } from '../../components/Buttons';
import { AdminSubpage } from './admin-components/AdminSubpage';

export function AdminStatsPage() {
  return (
    <AdminSubpage title="Statistics">
      <div className="user-tats">
        <p>Users</p>
        <GameButton>Fetch</GameButton>
      </div>
    </AdminSubpage>
  );
}
