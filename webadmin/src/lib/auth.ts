export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin";
  avatar?: string | null;
};

const TOKEN_KEY = "xeadmin_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

