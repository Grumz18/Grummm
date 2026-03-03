export function TaskTrackerBoardPage() {
  return (
    <section className="admin-card">
      <h2>Task Board</h2>
      <p className="admin-muted">Route: /app/tasks/board</p>
      <div className="admin-panel">
        <strong>Todo</strong>
        <ul>
          <li>Define real API client for /api/app/tasks/*</li>
          <li>Load owner tasks from backend</li>
        </ul>
      </div>
    </section>
  );
}
