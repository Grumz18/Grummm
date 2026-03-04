export function TaskTrackerBoardPage() {
  return (
    <section className="admin-card">
      <h2>Доска задач</h2>
      <p className="admin-muted">Маршрут: /app/tasks/board</p>
      <div className="admin-panel">
        <strong>План</strong>
        <ul>
          <li>Подключить реальный API-клиент для `/api/app/tasks/*`</li>
          <li>Загружать задачи владельца с backend</li>
        </ul>
      </div>
    </section>
  );
}
