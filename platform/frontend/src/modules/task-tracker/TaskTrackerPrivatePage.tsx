import { Link } from "react-router-dom";

export function TaskTrackerPrivatePage() {
  return (
    <section>
      <h1>TaskTracker</h1>
      <p>Private workspace for owner-scoped tasks.</p>
      <nav>
        <Link to="/app/tasks">Overview</Link> | <Link to="/app/tasks/board">Board</Link> |{" "}
        <Link to="/app/tasks/create">Create Task</Link>
      </nav>
      <ul>
        <li>Ownership checks are enforced in backend private API.</li>
        <li>AdminOnly guard is enforced by application routing.</li>
      </ul>
    </section>
  );
}
