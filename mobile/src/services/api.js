import api from './axiosWithRefresh';
import { API_ORIGIN } from './axiosWithRefresh';
import { getAccessToken, setTokens, clearTokens } from './tokenStorage';
import { disconnectSocket } from './socket';

function normalizeTokens(data) {
  if (data.accessToken && data.refreshToken) {
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  }
  if (data.token) {
    return { accessToken: data.token, refreshToken: null };
  }
  return null;
}

export async function authHeaders() {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidOtp(otp) {
  return /^\d{6}$/.test(String(otp));
}

export const startEmailOtp = async (email) => {
  console.log("Call to API:", email); 
  if (!email || !isValidEmail(email)) throw new Error('Email không hợp lệ');
  const res = await api.post('/auth/email/start', { email });
  return res.data;
};

export const verifyEmailOtp = async (email, otp) => {
  if (!email || !isValidEmail(email)) throw new Error('Email không hợp lệ');
  if (!otp || !isValidOtp(otp)) throw new Error('OTP phải gồm 6 chữ số');
  const res = await api.post('/auth/email/verify', { email, otp });
  const tokens = normalizeTokens(res.data);
  if (tokens) await setTokens(tokens);
  return res.data;
};

export const completeProfile = async (name, phone) => {
  if (!name || name.trim().length < 2) throw new Error('Tên phải có ít nhất 2 ký tự');
  if (!phone || !/^[0-9+\-\s]{8,15}$/.test(phone)) throw new Error('Số điện thoại không hợp lệ');
  const res = await api.post('/auth/email/complete', { name, phone }, { headers: await authHeaders() });
  const tokens = normalizeTokens(res.data);
  if (tokens) await setTokens(tokens);
  return res.data;
};

export const getProfile = async () => {
  const res = await api.get('/users/profile', { headers: await authHeaders() });
  return res.data;
};

export const updateProfile = async (name, phone) => {
  if (!name || name.trim().length < 2) throw new Error('Tên phải có ít nhất 2 ký tự');
  if (!phone || !/^[0-9+\-\s]{8,15}$/.test(phone)) throw new Error('Số điện thoại không hợp lệ');
  const res = await api.put('/users/profile', { name, phone }, { headers: await authHeaders() });
  return res.data;
};

export const deleteAccount = async () => {
  const res = await api.delete('/users/profile', { headers: await authHeaders() });
  await clearTokens();
  return res.data;
};

export const getTripSeats = async (tripId) => {
  if (!tripId) throw new Error('Thiếu tripId');
  const res = await api.get(`/trips/${tripId}/seats`, { headers: await authHeaders() });
  return res.data;
};

export const getTripPricePreview = async (tripId) => {
  if (!tripId) throw new Error('Thiếu tripId');
  const res = await api.get(`/trips/${tripId}/price`, { headers: await authHeaders() });
  return res.data;
};

export const listTrips = async (params = {}, signal = null) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  if (!searchParams.has('page')) searchParams.set('page', '1');
  if (!searchParams.has('limit')) searchParams.set('limit', '20');

  const query = searchParams.toString();
  const res = await api.get(`/trips${query ? `?${query}` : ''}`, {
    headers: await authHeaders(),
    signal,
  });

  return {
    items: Array.isArray(res.data?.items) ? res.data.items : [],
    total: Number.isFinite(Number(res.data?.total)) ? Number(res.data.total) : 0,
    page: Number.isFinite(Number(res.data?.page)) ? Number(res.data.page) : Number(searchParams.get('page') || 1),
    limit: Number.isFinite(Number(res.data?.limit)) ? Number(res.data.limit) : Number(searchParams.get('limit') || 20),
  };
};

export const holdSeat = async (tripId, seatId, holdMinutes = 5) => {
  if (!tripId || !seatId) throw new Error('Thiếu tripId hoặc seatId');
  const res = await api.post(`/trips/${tripId}/hold`, { seatId, holdMinutes }, { headers: await authHeaders() });
  return res.data;
};

export const releaseSeat = async (tripId, seatId) => {
  if (!tripId || !seatId) throw new Error('Thiếu tripId hoặc seatId');
  const res = await api.delete(`/trips/${tripId}/hold/${seatId}`, { headers: await authHeaders() });
  return res.data;
};

export const createTicket = async (
  tripId, seatId, promoCode, pickupAreaId, pickupPoint, dropoffAreaId, dropoffPoint
) => {
  if (!tripId || !seatId) throw new Error('Thiếu thông tin chuyến hoặc ghế');
  const res = await api.post(`/tickets`, { tripId, seatId, promoCode, pickupAreaId, pickupPoint, dropoffAreaId, dropoffPoint }, { headers: await authHeaders() });
  return res.data;
};

export const createBatchTickets = async ({
  tripId,
  seatIds,
  promoCode,
  pickupAreaId,
  pickupPoint,
  dropoffAreaId,
  dropoffPoint,
  expectedSeatCount,
  pendingMinutes,
}) => {
  if (!tripId) throw new Error('Thiếu tripId');
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    throw new Error('Vui lòng chọn ít nhất 1 ghế');
  }
  const res = await api.post(
    `/tickets/batch`,
    {
      tripId,
      seatIds,
      promoCode: promoCode || undefined,
      pickupAreaId,
      pickupPoint,
      dropoffAreaId,
      dropoffPoint,
      expectedSeatCount,
      pendingMinutes,
    },
    { headers: await authHeaders() }
  );
  return res.data;
};

export const quoteTrip = async ({ tripId, seatCount, promoCode }) => {
  if (!tripId) throw new Error('Thiếu tripId');
  const res = await api.post(
    `/tickets/quote/${tripId}`,
    { seatCount, promoCode: promoCode || undefined },
    { headers: await authHeaders() }
  );
  return res.data;
};

export const payTicket = async (ticketId) => {
  if (!ticketId) throw new Error('Thiếu ticketId');
  const res = await api.post(`/tickets/${ticketId}/pay`, {}, { headers: await authHeaders() });
  return res.data;
};

export const cancelTicket = async (ticketId, reason) => {
  if (!ticketId) throw new Error('Thiếu ticketId');
  const res = await api.post(`/tickets/${ticketId}/cancel`, { reason }, { headers: await authHeaders() });
  return res.data;
};

export const getTicketRoutePlan = async (ticketId) => {
  if (!ticketId) throw new Error('Thiếu ticketId');
  const res = await api.get(`/tickets/${ticketId}/route-plan`, {
    headers: await authHeaders(),
  });
  return res.data;
};

export const runAstarRoute = async ({ from, to }) => {
  if (
    !from ||
    !to ||
    !Number.isFinite(Number(from.lat)) ||
    !Number.isFinite(Number(from.lng)) ||
    !Number.isFinite(Number(to.lat)) ||
    !Number.isFinite(Number(to.lng))
  ) {
    throw new Error('Toạ độ không hợp lệ');
  }
  const res = await api.post(
    '/routing/astar',
    { from: { lat: Number(from.lat), lng: Number(from.lng) }, to: { lat: Number(to.lat), lng: Number(to.lng) } },
    { headers: await authHeaders() }
  );
  return res.data;
};

export const listMyTickets = async ({ status, page = 1, limit = 50 } = {}) => {
  const params = new URLSearchParams();
  if (status) params.set('status', String(status));
  params.set('page', String(page));
  params.set('limit', String(limit));

  const res = await api.get(`/tickets/me?${params.toString()}`, {
    headers: await authHeaders(),
  });
  return {
    items: Array.isArray(res.data?.items) ? res.data.items : [],
    total: Number(res.data?.total || 0),
    page: Number(res.data?.page || page),
    limit: Number(res.data?.limit || limit),
  };
};

export const listMyDriverTrips = async ({ upcoming = false, status, page = 1, limit = 50 } = {}) => {
  const params = new URLSearchParams();
  if (upcoming) params.set('upcoming', 'true');
  if (status) params.set('status', String(status));
  params.set('page', String(page));
  params.set('limit', String(limit));

  const res = await api.get(`/trips/driver/me?${params.toString()}`, {
    headers: await authHeaders(),
  });
  return {
    items: Array.isArray(res.data?.items) ? res.data.items : [],
    total: Number(res.data?.total || 0),
    page: Number(res.data?.page || page),
    limit: Number(res.data?.limit || limit),
  };
};

export const getTripPassengers = async (tripId) => {
  if (!tripId) throw new Error('Thiếu tripId');
  const res = await api.get(`/trips/${tripId}/passengers`, {
    headers: await authHeaders(),
  });
  return res.data;
};

export const listNotifications = async ({ page = 1, limit = 30, unread = false } = {}) => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (unread) params.set('unread', 'true');

  const res = await api.get(`/notifications?${params.toString()}`, {
    headers: await authHeaders(),
  });
  return {
    items: Array.isArray(res.data?.items) ? res.data.items : [],
    total: Number(res.data?.total || 0),
    unreadCount: Number(res.data?.unreadCount || 0),
    page: Number(res.data?.page || page),
    limit: Number(res.data?.limit || limit),
  };
};

export const markNotificationRead = async (notificationId) => {
  if (!notificationId) throw new Error('Thiếu notificationId');
  const res = await api.post(`/notifications/${notificationId}/read`, {}, {
    headers: await authHeaders(),
  });
  return res.data;
};

export const markAllNotificationsRead = async () => {
  const res = await api.post('/notifications/read-all', {}, {
    headers: await authHeaders(),
  });
  return res.data;
};

export const getNotificationUnreadCount = async () => {
  const res = await api.get('/notifications/unread-count', {
    headers: await authHeaders(),
  });
  return Number(res.data?.unreadCount || 0);
};

export const resolveAssetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_ORIGIN.replace(/\/$/, '');
  const relative = path.replace(/^\//, '');
  return `${base}/${relative}`;
};

export const getActiveBanners = async () => {
  const res = await api.get('/banners?active=true');
  const items = Array.isArray(res.data?.items) ? res.data.items : [];
  return items.map((item) => ({ ...item, fullImageUrl: resolveAssetUrl(item.imageUrl) }));
};

export const createComplaint = async ({ subject, message, ticketId, tripId } = {}) => {
  if (!subject?.trim()) throw new Error('Vui lòng nhập tiêu đề khiếu nại');
  if (!message?.trim()) throw new Error('Vui lòng nhập nội dung khiếu nại');
  const res = await api.post(
    '/complaints',
    {
      subject: subject.trim(),
      message: message.trim(),
      ticketId: ticketId || undefined,
      tripId: tripId || undefined,
    },
    { headers: await authHeaders() }
  );
  return res.data;
};

export const listMyComplaints = async ({ page = 1, limit = 50, status } = {}) => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (status) params.set('status', String(status));

  const res = await api.get(`/complaints/me?${params.toString()}`, {
    headers: await authHeaders(),
  });
  return {
    items: Array.isArray(res.data?.items) ? res.data.items : [],
    total: Number(res.data?.total || 0),
    page: Number(res.data?.page || page),
    limit: Number(res.data?.limit || limit),
  };
};

export const getMyComplaint = async (complaintId) => {
  if (!complaintId) throw new Error('Thiếu mã khiếu nại');
  const res = await api.get(`/complaints/me/${complaintId}`, {
    headers: await authHeaders(),
  });
  return {
    complaint: res.data?.complaint || null,
    history: Array.isArray(res.data?.history) ? res.data.history : [],
  };
};

export const logout = async () => {
  try {
    await api.post('/auth/logout', {}, { headers: await authHeaders() });
  } catch (e) {
  }
  try {
    disconnectSocket();
  } catch (e) {
  }
  await clearTokens();
};


export default api;