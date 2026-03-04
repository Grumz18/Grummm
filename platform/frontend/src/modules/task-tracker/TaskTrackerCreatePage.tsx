export function TaskTrackerCreatePage() {
  return (
    <section className="admin-card">
      <h2>Создание задачи</h2>
      <p className="admin-muted">Маршрут: /app/tasks/create</p>
      <form className="admin-form">
        <label>
          Заголовок
          <input name="title" placeholder="Название задачи" />
        </label>
        <label>
          Описание
          <textarea name="description" placeholder="Описание задачи" rows={4} />
        </label>
        <button type="button">Создать (заглушка)</button>
      </form>
    </section>
  );
}
