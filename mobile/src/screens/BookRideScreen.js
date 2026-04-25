import React, { useState } from 'react';
import { View, Text, StyleSheet, Keyboard, TouchableWithoutFeedback, TouchableOpacity, ScrollView } from 'react-native';
import AppBackground from '../components/ui/AppBackground';
import { bookRide, listTrips } from '../services/api';
import { colors, spacing } from "../theme/theme";
import PrimaryButton from "../components/ui/PrimaryButton";
import TextField from "../components/ui/TextField";
import GlassCard from '../components/ui/GlassCard';

const DROPDOWN_Z_INDEX = 20;
// Default API page size used by backend trip listing.
const TRIP_PAGE_LIMIT = 100;
// Safety cap to prevent an endless loop if backend pagination metadata is inconsistent.
const MAX_TRIP_PAGES = 50;

export default function BookRideScreen({ navigation }) {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [destinationError, setDestinationError] = useState('');

  React.useEffect(() => {
    let mounted = true;

    const loadDestinations = async () => {
      setLoadingDestinations(true);
      setDestinationError('');
      try {
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

        const uniqueDestinations = [...new Set(
          allTrips
            .map((trip) => String(trip?.routeTo || '').trim())
            .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b, 'vi'));

        if (mounted) {
          setDestinationOptions(uniqueDestinations);
        }
      } catch (error) {
        console.error('Không tải được danh sách điểm đến:', error);
        if (mounted) {
          setDestinationOptions([]);
          setDestinationError('Không tải được điểm đến, vui lòng nhập thủ công.');
        }
      } finally {
        if (mounted) setLoadingDestinations(false);
      }
    };

    loadDestinations();
    return () => {
      mounted = false;
    };
  }, []);

  const handleBook = async () => {
    try {
      setLoading(true);
      const result = await bookRide(pickup, dropoff);
      // result có thể là ride hoặc trip, tuỳ backend
      const tripId = result?.tripId || result?.trip?._id || result?.tripId || result?._id;
      if (tripId) {
        setMessage('Đặt chuyến thành công!');
        // Chuyển sang màn hình chọn ghế, truyền tripId
        navigation.navigate('SeatSelection', { tripId });
      } else {
        setMessage('Không lấy được thông tin chuyến, vui lòng thử lại.');
      }
    } catch (err) {
      setMessage('Đặt chuyến thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onSelectDestination = (value) => {
    setDropoff(value);
    setDestinationOpen(false);
  };

  return (
    <AppBackground>
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          setDestinationOpen(false);
        }}
        accessible={false}
      >
        <View style={styles.screen}>
          <GlassCard style={styles.card}>
            <Text style={styles.badge}>Quick Booking</Text>
            <Text style={styles.title}>Đặt chuyến</Text>
            <Text style={styles.subtitle}>Nhập điểm đón và điểm đến</Text>
            <TextField
              label="Điểm đón"
              placeholder="Ví dụ: Sân bay Tân Sơn Nhất"
              value={pickup}
              onChangeText={setPickup}
              returnKeyType="next"
            />
            {destinationOptions.length > 0 ? (
              <View style={styles.dropdownWrap}>
                <Text style={styles.dropdownLabel}>Điểm đến</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.dropdownTrigger}
                  onPress={() => setDestinationOpen((prev) => !prev)}
                >
                  <Text style={[styles.dropdownValue, !dropoff ? styles.dropdownPlaceholder : null]}>
                    {loadingDestinations ? 'Đang tải điểm đến...' : (dropoff || 'Chọn điểm đến')}
                  </Text>
                </TouchableOpacity>
                {destinationOpen ? (
                  <View style={styles.dropdownList}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      {destinationOptions.map((destination) => (
                        <TouchableOpacity
                          key={destination}
                          style={[
                            styles.dropdownItem,
                            dropoff === destination ? styles.dropdownItemActive : null,
                          ]}
                          activeOpacity={0.8}
                          onPress={() => onSelectDestination(destination)}
                        >
                          <Text style={styles.dropdownItemText}>{destination}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </View>
            ) : (
              <TextField
                label="Điểm đến"
                placeholder={loadingDestinations ? 'Đang tải điểm đến...' : 'Ví dụ: Quận 1, TP.HCM'}
                value={dropoff}
                onChangeText={setDropoff}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            )}
            {destinationError ? <Text style={styles.destinationError}>{destinationError}</Text> : null}
            <PrimaryButton
              title="Đặt chuyến"
              onPress={handleBook}
              loading={loading}
              disabled={!pickup || !dropoff}
            />
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </GlassCard>
        </View>
      </TouchableWithoutFeedback>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.xl },
  card: {
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    marginTop: spacing.xl,
  },
  badge: {
    color: "rgba(234,240,255,0.95)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "900" },
  subtitle: { color: "rgba(234,240,255,0.78)", marginTop: spacing.xs, marginBottom: spacing.lg },
  dropdownWrap: {
    marginBottom: spacing.md,
    zIndex: DROPDOWN_Z_INDEX,
  },
  dropdownLabel: {
    color: "rgba(234,240,255,0.88)",
    marginBottom: spacing.xs,
    fontSize: 13,
    fontWeight: "700",
  },
  dropdownTrigger: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  dropdownValue: {
    color: colors.text,
    fontSize: 15,
  },
  dropdownPlaceholder: {
    color: colors.muted,
  },
  dropdownList: {
    marginTop: spacing.xs,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(11,18,32,0.95)",
    maxHeight: 180,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  dropdownItemActive: {
    backgroundColor: "rgba(79,124,255,0.2)",
  },
  dropdownItemText: {
    color: colors.text,
    fontWeight: "600",
  },
  destinationError: {
    color: "#FCA5A5",
    marginBottom: spacing.md,
    fontWeight: "600",
  },
  message: {
    marginTop: spacing.lg,
    color: "rgba(234,240,255,0.92)",
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
});
