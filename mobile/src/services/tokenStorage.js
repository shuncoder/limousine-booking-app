import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";

// Lưu cả access token và refresh token
export async function setTokens(tokens) {
  // Backward compatible:
  // - setTokens({ accessToken, refreshToken })
  // - setTokens("<jwt>")
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

export async function clearTokens() {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

