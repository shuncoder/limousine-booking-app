import axios from 'axios';
import { getToken } from "./tokenStorage";

const API_URL = 'http://192.168.106.6:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

export const startEmailOtp = async (email) => {
  console.log("CALL API:", email);
  const res = await api.post("/auth/email/start", { email });
  return res.data; // { isNew, otpSent, devOtp? }
};

export const verifyEmailOtp = async (email, otp) => {
  const res = await api.post("/auth/email/verify", { email, otp });
  return res.data; // { isNew, token, user }
};

export const completeProfile = async (token, name, phone) => {
  const res = await api.post(
    "/auth/email/complete",
    { name, phone },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data; // { token, user }
};

async function authHeaders() {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getProfile = async () => {
  const res = await api.get('/users/profile', {
    headers: await authHeaders(),
  });
  return res.data;
};

export const bookRide = async (pickupLocation, dropoffLocation) => {
  const res = await api.post(
    '/rides/book',
    { pickupLocation, dropoffLocation },
    { headers: await authHeaders() }
  );
  return res.data;
};

export const getRideHistory = async () => {
  const res = await api.get('/rides/history', {
    headers: await authHeaders(),
  });
  return res.data;
};

export default api;