import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokenStorage';

export const API_URL = 'http://172.20.10.3:5000/api';
export const API_ORIGIN = API_URL.replace(/\/api$/, '');

const api = axios.create({
  baseURL: API_URL,
});

// Hàm gọi refresh token
export async function refreshTokenRequest() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');
  const res = await api.post('/auth/refresh-token', { refreshToken });
  return res.data; // { accessToken, refreshToken }
}

// Interceptor tự động refresh token khi hết hạn
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const data = await refreshTokenRequest();
        await setTokens(data);
        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (err) {
        await clearTokens();
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
