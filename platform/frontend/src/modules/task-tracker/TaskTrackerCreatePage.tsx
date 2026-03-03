export function TaskTrackerCreatePage() {
  return (
    <section className="admin-card">
      <h2>Create Task</h2>
      <p className="admin-muted">Route: /app/tasks/create</p>
      <form className="admin-form">
        <label>
          Title
          <input name="title" placeholder="Task title" />
        </label>
        <label>
          Description
          <textarea name="description" placeholder="Task description" rows={4} />
        </label>
        <button type="button">Create (placeholder)</button>
      </form>
    </section>
  );
}
