import { Link } from "react-router-dom";

export function TaskTrackerPrivatePage() {
  return (
    <section className="admin-card">
      <h1>Трекер задач</h1>
      <p>Приватное рабочее пространство для управления задачами.</p>
      <nav className="admin-chip-nav">
        <Link to="/app/tasks">Обзор</Link>
        <Link to="/app/tasks/board">Доска</Link>
        <Link to="/app/tasks/create">Создать задачу</Link>
      </nav>
      <ul>
        <li>Проверка прав владельца включена на backend в приватном API.</li>
        <li>Guard `AdminOnly` применяется на уровне маршрутизации приложения.</li>
      </ul>
    </section>
  );
}
