interface LoginResponse {
  accessToken?: string;
}
interface CsrfResponse {
  csrfHeaderName?: string;
  requestToken?: string;
}

async function fetchCsrfToken(): Promise<{ headerName: string; token: string } | null> {
  try {
    const response = await fetch("/api/public/security/csrf", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as CsrfResponse;
    if (!payload.requestToken) {
      return null;
    }

    return {
      headerName: payload.csrfHeaderName || "X-CSRF-TOKEN",
      token: payload.requestToken
    };
  } catch {
    return null;
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: string;
      title?: string;
      errors?: Record<string, string[]> | string[];
    };
    if (payload.error) {
      if (payload.error === "mailru_app_password_required") {
        return "Для mail.ru нужен пароль приложения (не обычный пароль почты). Обновите EmailVerification__SmtpPassword.";
      }
      return payload.error;
    }

    if (payload.title === "CSRF validation failed") {
      return "Сессия устарела. Обновите страницу и попробуйте снова.";
    }

    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      return payload.errors[0] || "Ошибка валидации запроса.";
    }

    if (payload.errors && typeof payload.errors === "object") {
      const firstError = Object.values(payload.errors)[0]?.[0];
      if (firstError) {
        return firstError;
      }
    }

    if (payload.title) {
      return payload.title;
    }
  } catch {
    // ignore
  }

  if (response.status === 401) {
    return "Неверный логин или пароль.";
  }

  if (response.status === 429) {
    return "Слишком много попыток входа. Повторите позже.";
  }

  return "Ошибка запроса.";
}

export async function loginAdmin(userName: string, password: string): Promise<string> {
  const csrf = await fetchCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrf) {
    headers[csrf.headerName] = csrf.token;
  }
  const response = await fetch("/api/public/auth/login", {
    method: "POST",
    headers,
    credentials: "same-origin",
    body: JSON.stringify({ userName, password })
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = (await response.json()) as LoginResponse;
  if (!payload.accessToken) {
    throw new Error("Сервер не вернул access token.");
  }

  return payload.accessToken;
}

export async function logoutAdmin(accessToken?: string): Promise<void> {
  await fetch("/api/app/auth/logout", {
    method: "POST",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    credentials: "same-origin"
  });
}

export async function requestPasswordEmailCode(email: string, accessToken: string): Promise<string | undefined> {
  const response = await fetch("/api/app/auth/request-email-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    credentials: "same-origin",
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = (await response.json()) as { debugCode?: string };
  return payload.debugCode;
}

export async function changeAdminPassword(
  oldPassword: string,
  newPassword: string,
  emailCode: string,
  accessToken: string
): Promise<void> {
  const response = await fetch("/api/app/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    credentials: "same-origin",
    body: JSON.stringify({ oldPassword, newPassword, emailCode })
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}
