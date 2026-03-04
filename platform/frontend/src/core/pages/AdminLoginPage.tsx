import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginAdmin } from "../auth/auth-api";
import { useAuthSession } from "../auth/auth-session";

interface LocationState {
  from?: { pathname?: string };
}

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuthSession();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const accessToken = await loginAdmin(userName.trim(), password);
      auth.signIn({ role: "Admin", accessToken });
      const state = location.state as LocationState | null;
      const redirectTo = state?.from?.pathname?.startsWith("/app") ? state.from.pathname : "/app";
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось войти.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page">
      <article className="auth-card">
        <h1>Вход в админ-панель</h1>
        <p className="admin-muted">Введите логин и пароль администратора.</p>
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Логин
            <input
              autoComplete="username"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="adminuser"
              required
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? "Вход..." : "Войти"}
          </button>
        </form>
        {error ? <p className="admin-error">{error}</p> : null}
      </article>
    </section>
  );
}
