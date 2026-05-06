"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import {
  createTrip,
  deleteTrip,
  Driver,
  listDrivers,
  listTrips,
  PickupArea,
  PickupPoint,
  Trip,
  updateTrip,
} from "@/lib/api";
import { getToken } from "@/lib/auth";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function toTimeInputValue(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

type DuplicateState = {
  trip: Trip;
  date: string;
  time: string;
  swap: boolean;
};

type DraftPoint = {
  name: string;
  address: string;
  lat: string;
  lng: string;
};

type DraftArea = {
  areaId: string;
  name: string;
  featured: boolean;
  points: DraftPoint[];
};

const emptyPoint = (): DraftPoint => ({ name: "", address: "", lat: "", lng: "" });

const emptyArea = (): DraftArea => ({
  areaId: "",
  name: "",
  featured: false,
  points: [emptyPoint()],
});

function slugify(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildAreaPayload(areas: DraftArea[]): PickupArea[] {
  const cleaned: PickupArea[] = [];
  for (const area of areas) {
    const name = area.name.trim();
    const areaIdRaw = area.areaId.trim() || slugify(name);
    if (!name || !areaIdRaw) continue;

    const points: PickupPoint[] = [];
    for (const point of area.points) {
      const pointName = point.name.trim();
      const address = point.address.trim();
      const lat = Number(point.lat);
      const lng = Number(point.lng);
      if (!pointName || !address || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      points.push({ name: pointName, address, lat, lng, areaId: areaIdRaw });
    }

    cleaned.push({ areaId: areaIdRaw, name, featured: area.featured, points });
  }
  return cleaned;
}

export default function TripsPage() {
  const [items, setItems] = React.useState<Trip[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [duplicateState, setDuplicateState] = React.useState<DuplicateState | null>(null);
  const [duplicating, setDuplicating] = React.useState(false);
  const [duplicateError, setDuplicateError] = React.useState<string | null>(null);

  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [assigningTripId, setAssigningTripId] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    routeFrom: "",
    routeTo: "",
    departureAt: "",
    vehicleName: "",
    basePrice: "",
    driverId: "",
    rowCount: "10",
    leftCount: "2",
    rightCount: "2",
  });

  const [pickupAreas, setPickupAreas] = React.useState<DraftArea[]>([emptyArea()]);
  const [dropoffAreas, setDropoffAreas] = React.useState<DraftArea[]>([emptyArea()]);

  const load = React.useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listTrips(token);
      setItems(res.items || []);
    } catch (e: unknown) {
      const msg = (e as { msg?: string })?.msg || "Không tải được danh sách chuyến";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const token = getToken();
    if (!token) return;
    listDrivers(token)
      .then((res) => setDrivers(res.items || []))
      .catch(() => undefined);
  }, []);

  const driverById = React.useMemo(() => {
    const map = new Map<string, Driver>();
    for (const d of drivers) map.set(d._id, d);
    return map;
  }, [drivers]);

  const onAssignDriver = async (tripId: string, driverId: string | null) => {
    const token = getToken();
    if (!token) return;
    setAssigningTripId(tripId);
    setError(null);
    try {
      await updateTrip(token, tripId, { driverId });
      setItems((prev) =>
        prev.map((t) => (t._id === tripId ? { ...t, driverId } : t))
      );
    } catch (e: unknown) {
      const msg = (e as { msg?: string })?.msg || "Không gán được tài xế";
      setError(msg);
    } finally {
      setAssigningTripId(null);
    }
  };

  const onCreate = async () => {
    const token = getToken();
    if (!token) return;

    const cleanedPickup = buildAreaPayload(pickupAreas);
    const cleanedDropoff = buildAreaPayload(dropoffAreas);

    if (!cleanedPickup.length || cleanedPickup.every((a) => a.points.length === 0)) {
      setError("Cần ít nhất 1 khu vực đón hợp lệ với điểm chi tiết.");
      return;
    }
    if (!cleanedDropoff.length || cleanedDropoff.every((a) => a.points.length === 0)) {
      setError("Cần ít nhất 1 khu vực trả hợp lệ với điểm chi tiết.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createTrip(token, {
        routeFrom: form.routeFrom,
        routeTo: form.routeTo,
        departureAt: new Date(form.departureAt).toISOString(),
        basePrice: Number(form.basePrice || 0),
        vehicleName: form.vehicleName || undefined,
        driverId: form.driverId || null,
        seatLayoutConfig: {
          rowCount: Number(form.rowCount || 10),
          leftCount: Number(form.leftCount || 2),
          rightCount: Number(form.rightCount || 2),
        },
        pickupAreas: cleanedPickup,
        dropoffAreas: cleanedDropoff,
      });

      setForm((f) => ({
        ...f,
        routeFrom: "",
        routeTo: "",
        departureAt: "",
        vehicleName: "",
        basePrice: "",
        driverId: "",
      }));
      setPickupAreas([emptyArea()]);
      setDropoffAreas([emptyArea()]);
      await load();
    } catch (e: unknown) {
      const msg = (e as { msg?: string })?.msg || "Tạo chuyến thất bại";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (tripId: string) => {
    const token = getToken();
    if (!token) return;

    const ok = window.confirm("Bạn có chắc chắn muốn xóa chuyến này?");
    if (!ok) return;

    setDeletingId(tripId);
    setError(null);
    try {
      await deleteTrip(token, tripId);
      await load();
    } catch (e: unknown) {
      const msg = (e as { msg?: string })?.msg || "Xóa chuyến thất bại";
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const openDuplicate = (trip: Trip) => {
    const original = new Date(trip.departureAt);
    const tomorrow = addDays(original, 1);
    setDuplicateError(null);
    setDuplicateState({
      trip,
      date: toDateInputValue(tomorrow),
      time: toTimeInputValue(original),
      swap: false,
    });
  };

  const closeDuplicate = () => {
    setDuplicateState(null);
    setDuplicateError(null);
  };

  const shiftDuplicateDate = (days: number) => {
    setDuplicateState((prev) => {
      if (!prev) return prev;
      const current = new Date(`${prev.date}T${prev.time || "00:00"}`);
      const next = addDays(current, days);
      return { ...prev, date: toDateInputValue(next) };
    });
  };

  const onConfirmDuplicate = async () => {
    if (!duplicateState) return;
    const token = getToken();
    if (!token) return;

    const { trip, date, time, swap } = duplicateState;
    if (!date || !time) {
      setDuplicateError("Vui lòng chọn đầy đủ ngày và giờ.");
      return;
    }

    const departure = new Date(`${date}T${time}`);
    if (Number.isNaN(departure.getTime())) {
      setDuplicateError("Ngày/giờ không hợp lệ.");
      return;
    }

    const routeFrom = swap ? trip.routeTo : trip.routeFrom;
    const routeTo = swap ? trip.routeFrom : trip.routeTo;
    const pickupAreas = swap ? trip.dropoffAreas : trip.pickupAreas;
    const dropoffAreas = swap ? trip.pickupAreas : trip.dropoffAreas;

    setDuplicating(true);
    setDuplicateError(null);
    try {
      await createTrip(token, {
        routeFrom,
        routeTo,
        departureAt: departure.toISOString(),
        basePrice: trip.basePrice,
        currency: trip.currency || "VND",
        vehicleName: trip.vehicleName ?? undefined,
        seatLayoutConfig: {
          rowCount: trip.seatLayout?.meta?.rowCount,
          leftCount: trip.seatLayout?.meta?.leftCount,
          rightCount: trip.seatLayout?.meta?.rightCount,
        },
        dynamicPricing: trip.dynamicPricing,
        pickupAreas: pickupAreas || [],
        dropoffAreas: dropoffAreas || [],
      });
      await load();
      closeDuplicate();
    } catch (e: unknown) {
      const msg = (e as { msg?: string })?.msg || "Lặp lại chuyến thất bại";
      setDuplicateError(msg);
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Chuyến xe" />

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="text-base font-semibold text-gray-800 dark:text-white/90">Tạo chuyến mới</div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <Label>Điểm đi</Label>
            <Input placeholder="VD: TP.HCM" value={form.routeFrom} onChange={(e) => setForm((f) => ({ ...f, routeFrom: e.target.value }))} />
          </div>
          <div>
            <Label>Điểm đến</Label>
            <Input placeholder="VD: Vũng Tàu" value={form.routeTo} onChange={(e) => setForm((f) => ({ ...f, routeTo: e.target.value }))} />
          </div>
          <div>
            <Label>Giờ khởi hành</Label>
            <Input type="datetime-local" value={form.departureAt} onChange={(e) => setForm((f) => ({ ...f, departureAt: e.target.value }))} />
          </div>
          <div>
            <Label>Tên xe (tuỳ chọn)</Label>
            <Input placeholder="VD: Limousine 9 chỗ" value={form.vehicleName} onChange={(e) => setForm((f) => ({ ...f, vehicleName: e.target.value }))} />
          </div>
          <div>
            <Label>Giá cơ bản</Label>
            <Input type="number" placeholder="VD: 250000" value={form.basePrice} onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))} />
          </div>
          <div>
            <Label>Số hàng ghế</Label>
            <Input type="number" value={form.rowCount} onChange={(e) => setForm((f) => ({ ...f, rowCount: e.target.value }))} />
          </div>
          <div>
            <Label>Ghế bên trái</Label>
            <Input type="number" value={form.leftCount} onChange={(e) => setForm((f) => ({ ...f, leftCount: e.target.value }))} />
          </div>
          <div>
            <Label>Ghế bên phải</Label>
            <Input type="number" value={form.rightCount} onChange={(e) => setForm((f) => ({ ...f, rightCount: e.target.value }))} />
          </div>
          <div>
            <Label>Tài xế phụ trách (tuỳ chọn)</Label>
            <select
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              value={form.driverId}
              onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}
            >
              <option value="">— Chưa gán —</option>
              {drivers.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name || d.email} {d.phone ? `(${d.phone})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <AreasEditor
          title="Khu vực đón và điểm đón chi tiết"
          areas={pickupAreas}
          setAreas={setPickupAreas}
          accent="primary"
        />

        <AreasEditor
          title="Khu vực trả và điểm trả chi tiết"
          areas={dropoffAreas}
          setAreas={setDropoffAreas}
          accent="success"
        />

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={onCreate} disabled={loading || !form.routeFrom || !form.routeTo || !form.departureAt || !form.basePrice}>
            Tạo chuyến
          </Button>
          {error ? <div className="text-sm text-error-600">{error}</div> : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Tuyến</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Khởi hành</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Số ghế</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Giá</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Khu vực đón</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Khu vực trả</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Tài xế</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {items.map((t) => (
                <TableRow key={t._id}>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                    {t.routeFrom} → {t.routeTo}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    {new Date(t.departureAt).toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{t.totalSeats ?? "-"}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    {t.basePrice} {t.currency}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-xs text-gray-500 dark:text-gray-400">
                    {(t.pickupAreas || []).map((area) => `${area.name} (${area.points?.length ?? 0})`).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-xs text-gray-500 dark:text-gray-400">
                    {(t.dropoffAreas || []).map((area) => `${area.name} (${area.points?.length ?? 0})`).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col gap-1">
                      <select
                        className="h-9 w-full min-w-[180px] rounded-md border border-gray-300 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                        value={t.driverId || ""}
                        disabled={assigningTripId === t._id}
                        onChange={(e) => onAssignDriver(t._id, e.target.value || null)}
                      >
                        <option value="">— Chưa gán —</option>
                        {drivers.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name || d.email}
                          </option>
                        ))}
                      </select>
                      {t.driverId && driverById.has(t.driverId) ? (
                        <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                          {driverById.get(t.driverId)?.phone || ""}
                        </span>
                      ) : null}
                      {assigningTripId === t._id ? (
                        <span className="text-theme-xs text-brand-500">Đang lưu...</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDuplicate(t)}
                        disabled={loading || duplicating}
                      >
                        Lặp lại
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(t._id)}
                        disabled={loading || deletingId === t._id}
                        className="text-error-600 ring-error-200 hover:bg-error-50 dark:text-error-300 dark:ring-error-800 dark:hover:bg-error-950/30"
                      >
                        {deletingId === t._id ? "Đang xóa..." : "Xóa"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!items.length ? (
                <TableRow>
                  <TableCell className="px-5 py-6 text-theme-sm text-gray-500 dark:text-gray-400" isHeader={false}>
                    {loading ? "Đang tải..." : "Chưa có chuyến"}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

      <DuplicateTripModal
        state={duplicateState}
        onChange={setDuplicateState}
        onClose={closeDuplicate}
        onConfirm={onConfirmDuplicate}
        onShiftDate={shiftDuplicateDate}
        loading={duplicating}
        error={duplicateError}
      />
    </div>
  );
}

function DuplicateTripModal({
  state,
  onChange,
  onClose,
  onConfirm,
  onShiftDate,
  loading,
  error,
}: {
  state: DuplicateState | null;
  onChange: React.Dispatch<React.SetStateAction<DuplicateState | null>>;
  onClose: () => void;
  onConfirm: () => void;
  onShiftDate: (days: number) => void;
  loading: boolean;
  error: string | null;
}) {
  const isOpen = !!state;

  const previewFrom = state?.swap ? state.trip.routeTo : state?.trip.routeFrom;
  const previewTo = state?.swap ? state.trip.routeFrom : state?.trip.routeTo;

  const previewDateTime = React.useMemo(() => {
    if (!state) return "";
    const d = new Date(`${state.date}T${state.time || "00:00"}`);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("vi-VN");
  }, [state]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[560px] m-4">
      <div className="p-6 lg:p-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Lặp lại chuyến</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tạo nhanh một chuyến mới dựa trên chuyến đã có. Có thể đảo chiều, đổi giờ, đổi ngày.
        </p>

        {state ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/[0.05] dark:bg-white/[0.02]">
              <div className="font-semibold text-gray-800 dark:text-white/90">
                {previewFrom} → {previewTo}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                Khởi hành mới: {previewDateTime || "—"}
              </div>
              <div className="text-xs text-gray-400">
                Chuyến gốc: {new Date(state.trip.departureAt).toLocaleString("vi-VN")} (
                {state.trip.routeFrom} → {state.trip.routeTo})
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Ngày đi</Label>
                <Input
                  type="date"
                  value={state.date}
                  onChange={(e) =>
                    onChange((prev) => (prev ? { ...prev, date: e.target.value } : prev))
                  }
                />
              </div>
              <div>
                <Label>Giờ khởi hành</Label>
                <Input
                  type="time"
                  value={state.time}
                  onChange={(e) =>
                    onChange((prev) => (prev ? { ...prev, time: e.target.value } : prev))
                  }
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => onShiftDate(1)}>
                + Ngày hôm sau
              </Button>
              <Button size="sm" variant="outline" onClick={() => onShiftDate(7)}>
                + Tuần sau
              </Button>
              <Button size="sm" variant="outline" onClick={() => onShiftDate(-1)}>
                − 1 ngày
              </Button>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-white/80">
              <input
                type="checkbox"
                checked={state.swap}
                onChange={(e) =>
                  onChange((prev) => (prev ? { ...prev, swap: e.target.checked } : prev))
                }
              />
              Đảo chiều điểm đi / điểm đến (đồng thời đảo cả khu vực đón ↔ trả)
            </label>

            {error ? <div className="text-sm text-error-600">{error}</div> : null}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={onClose} disabled={loading}>
            Huỷ
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={loading || !state}>
            {loading ? "Đang tạo..." : "Tạo chuyến lặp lại"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AreasEditor({
  title,
  areas,
  setAreas,
  accent,
}: {
  title: string;
  areas: DraftArea[];
  setAreas: React.Dispatch<React.SetStateAction<DraftArea[]>>;
  accent: "primary" | "success";
}) {
  const updateArea = (index: number, patch: Partial<DraftArea>) => {
    setAreas((prev) => prev.map((area, idx) => (idx === index ? { ...area, ...patch } : area)));
  };

  const updatePoint = (areaIndex: number, pointIndex: number, patch: Partial<DraftPoint>) => {
    setAreas((prev) =>
      prev.map((area, idx) => {
        if (idx !== areaIndex) return area;
        const points = area.points.map((point, pIdx) => (pIdx === pointIndex ? { ...point, ...patch } : point));
        return { ...area, points };
      })
    );
  };

  const addArea = () => setAreas((prev) => [...prev, emptyArea()]);
  const removeArea = (index: number) =>
    setAreas((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const addPoint = (areaIndex: number) =>
    setAreas((prev) =>
      prev.map((area, idx) => (idx === areaIndex ? { ...area, points: [...area.points, emptyPoint()] } : area))
    );

  const removePoint = (areaIndex: number, pointIndex: number) =>
    setAreas((prev) =>
      prev.map((area, idx) => {
        if (idx !== areaIndex) return area;
        if (area.points.length === 1) return area;
        return { ...area, points: area.points.filter((_, p) => p !== pointIndex) };
      })
    );

  const accentBorder = accent === "primary" ? "border-brand-300" : "border-success-300";

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</div>
        <Button size="sm" variant="outline" onClick={addArea}>
          + Thêm khu vực
        </Button>
      </div>

      <div className="mt-3 space-y-4">
        {areas.map((area, areaIndex) => (
          <div
            key={areaIndex}
            className={`rounded-xl border ${accentBorder} bg-gray-50 p-4 dark:bg-white/[0.02]`}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <Label>Tên khu vực</Label>
                <Input
                  placeholder="VD: Quận 1, Trung tâm Hà Nội..."
                  value={area.name}
                  onChange={(e) => updateArea(areaIndex, { name: e.target.value })}
                />
              </div>
              <div>
                <Label>Mã khu vực (tự sinh nếu để trống)</Label>
                <Input
                  placeholder="VD: q1"
                  value={area.areaId}
                  onChange={(e) => updateArea(areaIndex, { areaId: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-white/80">
                  <input
                    type="checkbox"
                    checked={area.featured}
                    onChange={(e) => updateArea(areaIndex, { featured: e.target.checked })}
                  />
                  Nổi bật
                </label>
                <Button size="sm" variant="outline" onClick={() => removeArea(areaIndex)} disabled={areas.length === 1}>
                  Xoá khu vực
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase text-gray-500 dark:text-white/60">
                  Điểm đón / trả chi tiết (tuyến đường xe đi)
                </div>
                <Button size="sm" variant="outline" onClick={() => addPoint(areaIndex)}>
                  + Thêm điểm
                </Button>
              </div>

              <div className="mt-2 space-y-2">
                {area.points.map((point, pointIndex) => (
                  <div
                    key={pointIndex}
                    className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 bg-white p-3 md:grid-cols-12 dark:border-white/[0.05] dark:bg-white/[0.03]"
                  >
                    <div className="md:col-span-3">
                      <Label>Tên điểm</Label>
                      <Input
                        placeholder="VD: Bến xe Miền Đông"
                        value={point.name}
                        onChange={(e) => updatePoint(areaIndex, pointIndex, { name: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-4">
                      <Label>Địa chỉ</Label>
                      <Input
                        placeholder="VD: 292 Đinh Bộ Lĩnh, Bình Thạnh"
                        value={point.address}
                        onChange={(e) => updatePoint(areaIndex, pointIndex, { address: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Vĩ độ (lat)</Label>
                      <Input
                        type="number"
                        placeholder="10.815"
                        value={point.lat}
                        onChange={(e) => updatePoint(areaIndex, pointIndex, { lat: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Kinh độ (lng)</Label>
                      <Input
                        type="number"
                        placeholder="106.711"
                        value={point.lng}
                        onChange={(e) => updatePoint(areaIndex, pointIndex, { lng: e.target.value })}
                      />
                    </div>
                    <div className="flex items-end md:col-span-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removePoint(areaIndex, pointIndex)}
                        disabled={area.points.length === 1}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
