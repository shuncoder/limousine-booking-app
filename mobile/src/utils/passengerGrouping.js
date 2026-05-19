/**
 * Pure helpers for turning a flat list of tickets into per-customer groups.
 * Used by the driver passenger list (so 1 customer with N seats = 1 row).
 * No React imports – this module is UI-agnostic.
 */

import { formatPointDetail } from './bookingFormatters';

export function compareSeatId(a, b) {
  const numA = Number(a);
  const numB = Number(b);
  if (Number.isFinite(numA) && Number.isFinite(numB)) return numA - numB;
  return String(a).localeCompare(String(b));
}

function pointKey(point) {
  if (!point) return '';
  return [point.name, point.address, point.lat, point.lng]
    .map((v) => String(v ?? ''))
    .join('|');
}

/**
 * Gom các vé theo từng khách hàng.
 *  - Cùng `userId._id` → cùng 1 nhóm (1 dòng trong UI).
 *  - Vé thiếu user thì mỗi vé tách thành nhóm riêng để tránh gộp nhầm.
 *
 * Mỗi nhóm trả về:
 *   key, customerId, customer, tickets[], seatIds[] (đã sort), totalAmount,
 *   currency, paidCount, pendingCount, samePickup, sameDropoff,
 *   firstPickup, firstDropoff, statusKey ('paid' | 'pending' | 'partial').
 */
export function groupTicketsByCustomer(tickets) {
  const groups = new Map();

  for (const ticket of tickets || []) {
    const customer =
      ticket.userId && typeof ticket.userId === 'object' ? ticket.userId : null;
    const customerId = customer?._id ? String(customer._id) : null;
    const key = customerId || `anon:${ticket._id}`;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        customerId,
        customer,
        tickets: [],
        seatIds: [],
        totalAmount: 0,
        currency: ticket.currency || 'VND',
        paidCount: 0,
        pendingCount: 0,
        pickupKey: pointKey(ticket.pickupPoint),
        dropoffKey: pointKey(ticket.dropoffPoint),
        samePickup: true,
        sameDropoff: true,
        firstPickup: ticket.pickupPoint || null,
        firstDropoff: ticket.dropoffPoint || null,
      });
    }

    const group = groups.get(key);
    group.tickets.push(ticket);
    group.seatIds.push(String(ticket.seatId));
    group.totalAmount += Number(ticket.totalAmount || 0);
    if (ticket.status === 'paid') group.paidCount += 1;
    else if (ticket.status === 'pending') group.pendingCount += 1;

    if (group.pickupKey !== pointKey(ticket.pickupPoint)) group.samePickup = false;
    if (group.dropoffKey !== pointKey(ticket.dropoffPoint)) group.sameDropoff = false;
  }

  return Array.from(groups.values()).map((group) => {
    group.seatIds.sort(compareSeatId);
    let statusKey = 'pending';
    if (group.paidCount > 0 && group.pendingCount === 0) statusKey = 'paid';
    else if (group.paidCount > 0 && group.pendingCount > 0) statusKey = 'partial';
    group.statusKey = statusKey;
    return group;
  });
}

export { formatPointDetail };
