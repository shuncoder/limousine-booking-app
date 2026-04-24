import api from './axiosWithRefresh';
import { API_ORIGIN } from './axiosWithRefresh';
import { getAccessToken, setTokens, clearTokens } from "./tokenStorage";

export const startEmailOtp = async (email) => {
  console.log("CALL API:", email);
  const res = await api.post("/auth/email/start", { email });
  return res.data; // { isNew, otpSent, devOtp? }
};

export const verifyEmailOtp = async (email, otp) => {
  const res = await api.post("/auth/email/verify", { email, otp });
  // Backend currently returns { token, user, isNew }
  if (res.data.token) {
    await setTokens({ accessToken: res.data.token });
  } else if (res.data.accessToken || res.data.refreshToken) {
    await setTokens({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken });
  }
  return res.data;
};

export const completeProfile = async (token, name, phone) => {
  const res = await api.post(
    "/auth/email/complete",
    { name, phone },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.data.token) {
    await setTokens({ accessToken: res.data.token });
  } else if (res.data.accessToken || res.data.refreshToken) {
    await setTokens({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken });
  }
  return res.data;
};

async function authHeaders() {
  const token = await getAccessToken();
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

// --- Seat selection / Trips ---
export const getTripSeats = async (tripId) => {
  const res = await api.get(`/trips/${tripId}/seats`, {
    headers: await authHeaders(),
  });
  return res.data;
};

export const holdSeat = async (tripId, seatId, holdMinutes = 5) => {
  const res = await api.post(
    `/trips/${tripId}/hold`,
    { seatId, holdMinutes },
    { headers: await authHeaders() }
  );
  return res.data;
};

export const releaseSeat = async (tripId, seatId) => {
  const res = await api.delete(`/trips/${tripId}/hold/${seatId}`, {
    headers: await authHeaders(),
  });
  return res.data;
};

// --- Tickets ---
export const createTicket = async (tripId, seatId, promoCode) => {
  const res = await api.post(
    `/tickets`,
    { tripId, seatId, promoCode },
    { headers: await authHeaders() }
  );
  return res.data;
};

export const payTicket = async (ticketId) => {
  const res = await api.post(`/tickets/${ticketId}/pay`, {}, { headers: await authHeaders() });
  return res.data;
};

export const cancelTicket = async (ticketId, reason) => {
  const res = await api.post(
    `/tickets/${ticketId}/cancel`,
    { reason },
    { headers: await authHeaders() }
  );
  return res.data;
};

export const resolveAssetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return `${API_ORIGIN}${path}`;
  return `${API_ORIGIN}/${path}`;
};

export const getActiveBanners = async () => {
  const res = await api.get('/banners?active=true');
  const items = Array.isArray(res.data?.items) ? res.data.items : [];
  return items.map((item) => ({
    ...item,
    fullImageUrl: resolveAssetUrl(item.imageUrl),
  }));
};

export default api;