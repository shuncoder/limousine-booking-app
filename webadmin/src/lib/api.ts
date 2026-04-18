const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api";

export type ApiError = { msg?: string } | { message?: string } | unknown;

async function parseError(res: Response) {
  try {
    return await res.json();
  } catch {
    return { msg: `Request failed (${res.status})` };
  }
}

export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<{ token: string; user: { role: string } }>;
}

export async function getMe(token: string) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<{ role?: string }>;
}

