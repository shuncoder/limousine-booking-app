import { useEffect, useMemo, useState } from 'react';
import { createBatchTickets, getProfile } from '../services/api';

/**
 * Owns the customer-info form state for the booking flow:
 *  - prefills name/phone from profile,
 *  - exposes pickup/dropoff cascading dropdowns,
 *  - validates and submits a multi-seat batch booking via the backend.
 */
export default function useCustomerBookingForm({
  trip,
  tripId,
  seatIds,
  expectedSeatCount,
}) {
  const pickupAreas = Array.isArray(trip?.pickupAreas) ? trip.pickupAreas : [];
  const dropoffAreas = Array.isArray(trip?.dropoffAreas) ? trip.dropoffAreas : [];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [pickupAreaId, setPickupAreaId] = useState(pickupAreas[0]?.areaId || '');
  const [dropoffAreaId, setDropoffAreaId] = useState(dropoffAreas[0]?.areaId || '');
  const [pickupPoint, setPickupPoint] = useState(null);
  const [dropoffPoint, setDropoffPoint] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getProfile();
        if (cancelled || !profile) return;
        if (profile.name) setName(profile.name);
        if (profile.phone) setPhone(profile.phone);
      } catch {
        // best-effort; user can still type manually
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pickupAreaOptions = useMemo(
    () => pickupAreas.map((a) => ({ label: a.name, value: a.areaId })),
    [pickupAreas]
  );
  const dropoffAreaOptions = useMemo(
    () => dropoffAreas.map((a) => ({ label: a.name, value: a.areaId })),
    [dropoffAreas]
  );

  const pickupAreaLabel = useMemo(
    () =>
      pickupAreaOptions.find((o) => String(o.value) === String(pickupAreaId))
        ?.label || '',
    [pickupAreaOptions, pickupAreaId]
  );
  const dropoffAreaLabel = useMemo(
    () =>
      dropoffAreaOptions.find((o) => String(o.value) === String(dropoffAreaId))
        ?.label || '',
    [dropoffAreaOptions, dropoffAreaId]
  );

  const pickupPoints = useMemo(
    () =>
      pickupAreas.find((a) => String(a.areaId) === String(pickupAreaId))?.points || [],
    [pickupAreas, pickupAreaId]
  );
  const dropoffPoints = useMemo(
    () =>
      dropoffAreas.find((a) => String(a.areaId) === String(dropoffAreaId))?.points || [],
    [dropoffAreas, dropoffAreaId]
  );

  // Re-init the picked point when the area changes.
  useEffect(() => {
    setPickupPoint(pickupPoints[0] || null);
  }, [pickupPoints]);
  useEffect(() => {
    setDropoffPoint(dropoffPoints[0] || null);
  }, [dropoffPoints]);

  function validate() {
    const requiredCount = Number(expectedSeatCount) || (seatIds?.length || 0);
    if (!tripId) return 'Thiếu thông tin chuyến.';
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return 'Vui lòng chọn ghế trước.';
    }
    if (requiredCount > 0 && seatIds.length !== requiredCount) {
      return `Bạn cần chọn đúng ${requiredCount} ghế.`;
    }
    if (!pickupAreaId || !pickupPoint) return 'Vui lòng chọn điểm đón.';
    if (!dropoffAreaId || !dropoffPoint) return 'Vui lòng chọn điểm trả.';
    if (!name?.trim() || !phone?.trim()) {
      return 'Vui lòng nhập họ tên và số điện thoại.';
    }
    return '';
  }

  async function submit() {
    const err = validate();
    if (err) {
      setErrorMessage(err);
      return null;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      const result = await createBatchTickets({
        tripId,
        seatIds,
        promoCode: promoCode || undefined,
        pickupAreaId,
        pickupPoint,
        dropoffAreaId,
        dropoffPoint,
        expectedSeatCount: Number(expectedSeatCount) || seatIds.length,
      });
      return result;
    } catch (err2) {
      setErrorMessage(
        err2?.response?.data?.msg || 'Không thể tạo vé, vui lòng thử lại.'
      );
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  return {
    name,
    setName,
    phone,
    setPhone,
    promoCode,
    setPromoCode,
    pickupAreaId,
    setPickupAreaId,
    dropoffAreaId,
    setDropoffAreaId,
    pickupPoint,
    setPickupPoint,
    dropoffPoint,
    setDropoffPoint,

    pickupAreaOptions,
    dropoffAreaOptions,
    pickupAreaLabel,
    dropoffAreaLabel,
    pickupPoints,
    dropoffPoints,

    submitting,
    errorMessage,
    setErrorMessage,
    submit,
  };
}
