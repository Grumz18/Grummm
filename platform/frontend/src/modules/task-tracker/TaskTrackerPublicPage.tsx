export function TaskTrackerPublicPage() {
  return (
    <section>
      <h1>TaskTracker Module</h1>
      <p>
        TaskTracker is the first real module of the platform. It provides owner-scoped task
        management with backend ownership checks and audit-aware private API operations.
      </p>
      <ul>
        <li>Domain model: task lifecycle with completion state</li>
        <li>CQRS handlers for create/list/complete flows</li>
        <li>Private API endpoints under <code>/api/app/tasks/*</code></li>
      </ul>
    </section>
  );
}
