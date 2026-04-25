import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Keyboard,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import AppBackground from '../components/ui/AppBackground';
import { getTripSeats, listTrips } from '../services/api';
import { colors, spacing } from '../theme/theme';
import PrimaryButton from '../components/ui/PrimaryButton';
import TextField from '../components/ui/TextField';
import GlassCard from '../components/ui/GlassCard';

const TRIP_PAGE_LIMIT = 100;
const MAX_TRIP_PAGES = 50;

function formatCurrency(value, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatTime(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function toISODateString(date) {
  return date.toISOString().slice(0, 10);
}

async function getAllTrips() {
  const allTrips = [];
  let page = 1;
  let total = 0;

  do {
    const response = await listTrips({ page, limit: TRIP_PAGE_LIMIT });
    const items = Array.isArray(response?.items) ? response.items : [];
    allTrips.push(...items);
    total = Number(response?.total) || allTrips.length;
    page += 1;
  } while (allTrips.length < total && page <= MAX_TRIP_PAGES);

  return allTrips;
}

export default function BookRideScreen({ navigation }) {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [travelDate, setTravelDate] = useState(toISODateString(new Date()));
  const [passengers, setPassengers] = useState('1');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [allTrips, setAllTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [pickupHighlights, setPickupHighlights] = useState([]);
  const [selectedPickupHighlight, setSelectedPickupHighlight] = useState('');
  const [sortBy, setSortBy] = useState('time');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setMessage('');
      try {
        const trips = await getAllTrips();
        if (!mounted) return;
        setAllTrips(trips);

        const routeFromOptions = [...new Set(
          trips
            .map((trip) => String(trip?.routeFrom || '').trim())
            .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b, 'vi'));

        const routeToOptions = [...new Set(
          trips
            .map((trip) => String(trip?.routeTo || '').trim())
            .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b, 'vi'));

        if (routeFromOptions.length) setPickup((prev) => prev || routeFromOptions[0]);
        if (routeToOptions.length) setDropoff((prev) => prev || routeToOptions[0]);
      } catch {
        if (!mounted) return;
        setMessage('Không tải được danh sách chuyến.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const sortedTrips = useMemo(() => {
    const data = [...filteredTrips];
    if (sortBy === 'price') {
      data.sort((a, b) => Number(a.basePrice || 0) - Number(b.basePrice || 0));
      return data;
    }

    data.sort((a, b) => new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime());
    return data;
  }, [filteredTrips, sortBy]);

  const handleSwap = () => {
    setPickup(dropoff);
    setDropoff(pickup);
    setSelectedPickupHighlight('');
  };

  const handleSearchTrips = async () => {
    Keyboard.dismiss();
    setLoading(true);
    setMessage('');

    try {
      const requestedPassengers = Math.max(1, Number.parseInt(passengers, 10) || 1);

      const baseMatchedTrips = allTrips.filter((trip) => {
        const routeFrom = String(trip?.routeFrom || '').trim().toLowerCase();
        const routeTo = String(trip?.routeTo || '').trim().toLowerCase();
        const tripDate = toISODateString(new Date(trip?.departureAt || Date.now()));

        return routeFrom === pickup.trim().toLowerCase()
          && routeTo === dropoff.trim().toLowerCase()
          && tripDate === travelDate;
      });

      const enrichedTrips = await Promise.all(
        baseMatchedTrips.map(async (trip) => {
          try {
            const seatsPayload = await getTripSeats(trip._id);
            const seats = Object.values(seatsPayload?.seats || {});
            const availableSeats = seats.filter((seat) => seat?.status === 'available').length;
            return { ...trip, availableSeats };
          } catch {
            return { ...trip, availableSeats: trip.totalSeats || 0 };
          }
        })
      );

      const matched = enrichedTrips.filter((trip) => Number(trip.availableSeats || 0) >= requestedPassengers);
      setFilteredTrips(matched);

      const highlights = [...new Set(
        matched
          .map((trip) => String(trip?.routeFrom || '').trim())
          .filter(Boolean)
      )].slice(0, 5);
      setPickupHighlights(highlights);

      if (!matched.length) {
        setMessage('Không tìm thấy chuyến phù hợp. Vui lòng đổi tiêu chí tìm kiếm.');
      }
    } catch {
      setMessage('Không tải được danh sách chuyến.');
    } finally {
      setLoading(false);
    }
  };

  const shownTrips = selectedPickupHighlight
    ? sortedTrips.filter((trip) => String(trip.routeFrom || '').trim() === selectedPickupHighlight)
    : sortedTrips;

  return (
    <AppBackground>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
          <GlassCard style={styles.card}>
            <Text style={styles.title}>Chọn chuyến đi</Text>

            <TextField
              label="Điểm đi"
              placeholder="Ví dụ: Hà Nội"
              value={pickup}
              onChangeText={setPickup}
              returnKeyType="next"
            />

            <View style={styles.swapWrap}>
              <TouchableOpacity style={styles.swapButton} onPress={handleSwap} activeOpacity={0.8}>
                <Text style={styles.swapText}>↕</Text>
              </TouchableOpacity>
            </View>

            <TextField
              label="Điểm đến"
              placeholder="Ví dụ: Thái Bình"
              value={dropoff}
              onChangeText={setDropoff}
              returnKeyType="next"
            />

            <TextField
              label="Ngày đi (YYYY-MM-DD)"
              placeholder="2026-04-25"
              value={travelDate}
              onChangeText={setTravelDate}
              returnKeyType="next"
            />

            <TextField
              label="Số khách"
              placeholder="1"
              value={passengers}
              onChangeText={setPassengers}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />

            <PrimaryButton
              title="Tìm chuyến"
              onPress={handleSearchTrips}
              loading={loading}
              disabled={!pickup || !dropoff || !travelDate || !passengers}
            />

            {pickupHighlights.length > 0 ? (
              <View style={styles.highlightsWrap}>
                <Text style={styles.sectionTitle}>Điểm đón nổi bật</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.highlightRow}>
                    {pickupHighlights.map((point) => {
                      const active = point === selectedPickupHighlight;
                      return (
                        <TouchableOpacity
                          key={point}
                          style={[styles.highlightChip, active ? styles.highlightChipActive : null]}
                          onPress={() => setSelectedPickupHighlight(active ? '' : point)}
                          activeOpacity={0.85}
                        >
                          <Text style={[styles.highlightText, active ? styles.highlightTextActive : null]}>{point}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            ) : null}

            {shownTrips.length > 0 ? (
              <View style={styles.sortWrap}>
                <TouchableOpacity
                  onPress={() => setSortBy('time')}
                  style={[styles.sortBtn, sortBy === 'time' ? styles.sortBtnActive : null]}
                >
                  <Text style={styles.sortBtnText}>Theo giờ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSortBy('price')}
                  style={[styles.sortBtn, sortBy === 'price' ? styles.sortBtnActive : null]}
                >
                  <Text style={styles.sortBtnText}>Theo giá</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.tripListWrap}>
              {shownTrips.map((trip) => (
                <TouchableOpacity
                  key={trip._id}
                  style={styles.tripCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    navigation.navigate('SeatSelection', {
                      trip,
                      passengers: Math.max(1, Number.parseInt(passengers, 10) || 1),
                      travelDate,
                      pickupPoint: selectedPickupHighlight || pickup,
                    });
                  }}
                >
                  <View style={styles.tripTopRow}>
                    <View style={styles.tripTimeWrap}>
                      <Text style={styles.tripTime}>{formatTime(trip.departureAt)}</Text>
                      <Text style={styles.tripRoute}>{trip.routeFrom} → {trip.routeTo}</Text>
                    </View>
                    <Text style={styles.tripPrice}>{formatCurrency(trip.basePrice, trip.currency)}</Text>
                  </View>
                  <Text style={styles.tripSeats}>Còn {Number(trip.availableSeats || 0)} ghế</Text>
                </TouchableOpacity>
              ))}
            </View>

            {message ? <Text style={styles.message}>{message}</Text> : null}
          </GlassCard>
        </ScrollView>
      </TouchableWithoutFeedback>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  card: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: spacing.lg,
  },
  swapWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  swapButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79,124,255,0.3)',
  },
  swapText: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
  },
  highlightsWrap: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  highlightRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  highlightChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  highlightChipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  highlightText: {
    color: colors.text,
    fontWeight: '700',
  },
  highlightTextActive: {
    color: '#fff',
  },
  sortWrap: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  sortBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  sortBtnActive: {
    backgroundColor: 'rgba(79,124,255,0.35)',
    borderColor: colors.brand,
  },
  sortBtnText: {
    color: colors.text,
    fontWeight: '700',
  },
  tripListWrap: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  tripCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 18,
    padding: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tripTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  tripTimeWrap: {
    flex: 1,
  },
  tripTime: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  tripRoute: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  tripPrice: {
    color: colors.brand,
    fontWeight: '900',
    fontSize: 20,
    textAlign: 'right',
  },
  tripSeats: {
    color: colors.text,
    textAlign: 'right',
    marginTop: spacing.md,
    fontWeight: '800',
  },
  message: {
    marginTop: spacing.md,
    color: '#FECACA',
    fontWeight: '700',
  },
});
