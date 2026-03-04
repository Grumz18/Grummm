import { useState, type FormEvent } from "react";
import { changeAdminPassword, requestPasswordEmailCode } from "../auth/auth-api";
import { useAuthSession } from "../auth/auth-session";

const ADMIN_EMAIL = "serbul11@mail.ru";

export function AdminSecurityPage() {
  const auth = useAuthSession();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busyCode, setBusyCode] = useState(false);
  const [busyChange, setBusyChange] = useState(false);

  async function handleRequestCode(event: FormEvent) {
    event.preventDefault();
    setError("");
    setStatus("");
    if (!auth.accessToken) {
      setError("Нет access token. Повторно войдите в админ-панель.");
      return;
    }

    setBusyCode(true);
    try {
      const debugCode = await requestPasswordEmailCode(email.trim(), auth.accessToken);
      setStatus(debugCode ? `Почта отключена. Код подтверждения: ${debugCode}` : "Код отправлен на почту.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось отправить код.");
    } finally {
      setBusyCode(false);
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setError("");
    setStatus("");
    if (!auth.accessToken) {
      setError("Нет access token. Повторно войдите в админ-панель.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Новый пароль должен быть не короче 8 символов.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Подтверждение пароля не совпадает.");
      return;
    }

    setBusyChange(true);
    try {
      await changeAdminPassword(oldPassword, newPassword, emailCode.trim(), auth.accessToken);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setEmailCode("");
      setStatus("Пароль успешно изменен.");
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "Не удалось изменить пароль.");
    } finally {
      setBusyChange(false);
    }
  }

  return (
    <section className="admin-security">
      <article className="admin-card">
        <h1>Безопасность администратора</h1>
        <p className="admin-muted">
          Для смены пароля сначала запросите код подтверждения на почту, затем введите старый и новый пароль.
        </p>

        <form className="admin-form" onSubmit={handleRequestCode}>
          <label>
            Почта администратора
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <button type="submit" disabled={busyCode}>
            {busyCode ? "Отправка..." : "Получить код на почту"}
          </button>
        </form>

        <form className="admin-form" onSubmit={handleChangePassword}>
          <label>
            Старый пароль
            <input
              type="password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            Новый пароль
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label>
            Подтверждение нового пароля
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label>
            Код из письма
            <input
              value={emailCode}
              onChange={(event) => setEmailCode(event.target.value)}
              inputMode="numeric"
              pattern="[0-9]{4,12}"
              placeholder="123456"
              required
            />
          </label>
          <button type="submit" disabled={busyChange}>
            {busyChange ? "Изменение..." : "Сменить пароль"}
          </button>
        </form>

        {status ? <p className="admin-muted">{status}</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}
      </article>
    </section>
  );
}
