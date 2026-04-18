import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "auth_token";

export async function setToken(token) {
  await AsyncStorage.setItem(KEY, token);
}

export async function getToken() {
  return await AsyncStorage.getItem(KEY);
}

export async function clearToken() {
  await AsyncStorage.removeItem(KEY);
}

