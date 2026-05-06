import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const USER_ROLE_KEY = "auth_user_role";
const USER_ID_KEY = "auth_user_id";

export async function setTokens(tokens) {
  if (typeof tokens === "string") {
    const token = tokens.trim();
    if (token) await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
    return;
  }

  const { accessToken, refreshToken } = tokens || {};
  if (accessToken) await AsyncStorage.setItem(ACCESS_TOKEN_KEY, String(accessToken));
  if (refreshToken) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, String(refreshToken));
}

export async function getAccessToken() {
  return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function setUserSession({ role, id } = {}) {
  if (role) await AsyncStorage.setItem(USER_ROLE_KEY, String(role));
  if (id) await AsyncStorage.setItem(USER_ID_KEY, String(id));
}

export async function getUserRole() {
  return await AsyncStorage.getItem(USER_ROLE_KEY);
}

export async function getUserId() {
  return await AsyncStorage.getItem(USER_ID_KEY);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_ROLE_KEY,
    USER_ID_KEY,
  ]);
}
