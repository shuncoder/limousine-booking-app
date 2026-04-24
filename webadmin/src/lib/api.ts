const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api";

const API_ORIGIN = API_URL.replace(/\/api$/, "");

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
    body: JSON.stringify({ username: email, password }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<{ token: string; user: { role: string } }>;
}

export async function getMe(token: string) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<{ id?: string; role?: string; name?: string; email?: string; username?: string }>;
}

async function apiFetch<T>(
  path: string,
  {
    token,
    method,
    body,
    isFormData,
  }: {
    token: string;
    method?: string;
    body?: unknown;
    isFormData?: boolean;
  }
) {
  const res = await fetch(`${API_URL}${path}`, {
    method: method || (body ? "POST" : "GET"),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(!isFormData && body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? (isFormData ? (body as BodyInit) : JSON.stringify(body)) : undefined,
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

export function resolveAssetUrl(path: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return `${API_ORIGIN}${path}`;
  return `${API_ORIGIN}/${path}`;
}

export type Trip = {
  _id: string;
  routeFrom: string;
  routeTo: string;
  departureAt: string;
  vehicleName?: string | null;
  totalSeats?: number;
  basePrice: number;
  currency: string;
  dynamicPricing?: { enabled?: boolean };
  status?: string;
};

export async function listTrips(token: string) {
  return apiFetch<{ items: Trip[] }>(`/trips?page=1&limit=100`, { token });
}

export async function createTrip(
  token: string,
  input: {
    routeFrom: string;
    routeTo: string;
    departureAt: string;
    basePrice: number;
    currency?: string;
    vehicleName?: string;
    seatLayoutConfig?: { rowCount?: number; leftCount?: number; rightCount?: number };
  }
) {
  return apiFetch<Trip>(`/trips`, { token, method: "POST", body: input });
}

export async function deleteTrip(token: string, tripId: string) {
  return apiFetch<{ ok: true; id: string }>(`/trips/${tripId}`, { token, method: "DELETE" });
}

export async function updateAdminProfile(token: string, input: { name: string }) {
  return apiFetch<{ ok: true; user: { id: string; name: string; email?: string; role?: string } }>(
    `/auth/admin/profile`,
    { token, method: "PATCH", body: input }
  );
}

export async function getTripSeats(token: string, tripId: string) {
  return apiFetch<{ seatLayout: any; seats: Record<string, any> }>(`/trips/${tripId}/seats`, { token });
}

export type Ticket = {
  _id: string;
  tripId: Trip | string;
  userId?: { name?: string; email?: string } | string;
  seatId: string;
  status: "pending" | "paid" | "cancelled" | "expired";
  totalAmount: number;
  currency: string;
  refundStatus?: string;
  createdAt: string;
};

export async function adminListTickets(token: string) {
  return apiFetch<{ items: Ticket[] }>(`/tickets/admin/list?page=1&limit=100`, { token });
}

export async function approveRefund(token: string, ticketId: string) {
  return apiFetch<Ticket>(`/tickets/admin/${ticketId}/refund/approve`, { token, method: "POST", body: {} });
}

export type Promo = {
  _id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  maxUses?: number | null;
  usedCount?: number;
};

export async function listPromos(token: string) {
  return apiFetch<{ items: Promo[] }>(`/promos?page=1&limit=100`, { token });
}

export async function createPromo(token: string, input: Omit<Promo, "_id" | "usedCount">) {
  return apiFetch<Promo>(`/promos`, { token, method: "POST", body: input });
}

export async function deletePromo(token: string, promoId: string) {
  return apiFetch<{ ok: true }>(`/promos/${promoId}`, { token, method: "DELETE" });
}

export async function updatePromo(token: string, promoId: string, patch: Partial<Promo>) {
  return apiFetch<Promo>(`/promos/${promoId}`, { token, method: "PATCH", body: patch });
}

export async function revenueByRoute(token: string) {
  return apiFetch<{ items: Array<{ routeFrom: string; routeTo: string; revenue: number; tickets: number }> }>(
    `/reports/revenue-by-route`,
    { token }
  );
}

export async function fillRateReport(token: string) {
  return apiFetch<{ items: any[] }>(`/reports/fill-rate`, { token });
}

export type Complaint = {
  _id: string;
  subject: string;
  message: string;
  status: string;
  resolutionNote?: string | null;
  userId?: { name?: string; email?: string } | string;
  createdAt: string;
};

export async function adminListComplaints(token: string) {
  return apiFetch<{ items: Complaint[] }>(`/complaints/admin/list?page=1&limit=100`, { token });
}

export async function updateComplaint(token: string, complaintId: string, patch: { status?: string; resolutionNote?: string }) {
  return apiFetch<Complaint>(`/complaints/admin/${complaintId}`, { token, method: "PATCH", body: patch });
}

export type User = {
  _id: string;
  name?: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
};

export async function listUsers(token: string) {
  return apiFetch<{ items: User[] }>(`/admin/users?page=1&limit=100`, { token });
}

export async function updateUserRole(token: string, userId: string, role: string) {
  return apiFetch<User>(`/admin/users/${userId}/role`, { token, method: "PATCH", body: { role } });
}

export type AdminNotification = {
  _id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string;
  createdAt: string;
  adminUserId?: {
    username?: string;
    email?: string;
    role?: string;
  };
};

export async function listAdminNotifications(token: string, page = 1, limit = 20) {
  return apiFetch<{ items: AdminNotification[]; page: number; limit: number; total: number }>(
    `/admin/notifications?page=${page}&limit=${limit}`,
    { token }
  );
}

export type BannerItem = {
  _id: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
};

export async function listBanners(token: string) {
  return apiFetch<{ items: BannerItem[] }>(`/banners`, { token });
}

export async function uploadBanner(token: string, file: File) {
  const formData = new FormData();
  formData.append("image", file);
  return apiFetch<BannerItem>(`/banners`, {
    token,
    method: "POST",
    body: formData,
    isFormData: true,
  });
}

export async function deleteBanner(token: string, bannerId: string) {
  return apiFetch<{ ok: true; id: string }>(`/banners/${bannerId}`, { token, method: "DELETE" });
}

