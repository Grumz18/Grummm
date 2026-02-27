export function TaskTrackerCreatePage() {
  return (
    <section>
      <h2>Create Task</h2>
      <p>Route: /app/tasks/create</p>
      <form>
        <label>
          Title
          <input name="title" placeholder="Task title" />
        </label>
        <br />
        <label>
          Description
          <textarea name="description" placeholder="Task description" rows={4} />
        </label>
        <br />
        <button type="button">Create (placeholder)</button>
      </form>
    </section>
  );
}
