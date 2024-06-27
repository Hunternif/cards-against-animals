/**
 * Simple header that only lists available columns
 */
export function AdminDeckHeaderRow() {
  return (
    <table className="admin-deck-table admin-deck-header-row">
      <tbody>
        <tr>
          <td className="col-card-id">ID</td>
          <td className="col-card-content">Content</td>
          <td className="col-card-tags">Tags</td>
          <td className="col-card-counter">Views</td>
          <td className="col-card-counter">Plays</td>
          <td className="col-card-counter">Likes/Votes</td>
          <td className="col-card-counter">Wins</td>
          <td className="col-card-counter">Discards</td>
          <td className="col-card-counter">Rating</td>
        </tr>
      </tbody>
    </table>
  );
}
