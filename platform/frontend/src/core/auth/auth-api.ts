interface LoginResponse {
  accessToken?: string;
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload.error) {
      return payload.error;
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
  const response = await fetch("/api/public/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

export async function requestPasswordEmailCode(email: string, accessToken: string): Promise<void> {
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
