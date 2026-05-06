import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/theme';
import SeatMap from '../components/SeatMap';
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import useSeatSelection from '../hooks/useSeatSelection';

export default function SeatSelectionScreen({ navigation, route }) {
  const { tripId, trip, passengers = 1, travelDate } = route.params || {};
  const requiredCount = Math.max(1, Number(passengers) || 1);

  const {
    loading,
    seatLayout,
    seats,
    error,
    selectedSeatIds,
    holdMessage,
    isComplete,
    busySeatId,
    toggleSeat,
  } = useSeatSelection({ tripId, trip, requiredCount });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary || '#fff'} />
        <Text style={{ color: colors.text, marginTop: 12 }}>
          Đang tải sơ đồ ghế...
        </Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#F00' }}>{error}</Text>
      </View>
    );
  }
  if (!seatLayout || !seatLayout.rows) {
    return (
      <View style={styles.center}>
        <Text>Không có dữ liệu sơ đồ ghế.</Text>
      </View>
    );
  }

  const handleContinue = () => {
    navigation.navigate('CustomerInfo', {
      trip,
      tripId: trip?._id || tripId,
      seatIds: selectedSeatIds,
      passengers: requiredCount,
      travelDate,
    });
  };

  return (
    <AppBackground>
      <View style={styles.screen}>
        <GlassCard style={styles.card}>
          <Text style={styles.title}>Chọn ghế</Text>
          <Text style={styles.subtitle}>
            {trip?.routeFrom} → {trip?.routeTo}
          </Text>
          {travelDate ? (
            <Text style={styles.subtle}>Ngày đi: {travelDate}</Text>
          ) : null}

          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              Đã chọn {selectedSeatIds.length} / {requiredCount} ghế
            </Text>
            {selectedSeatIds.length > 0 ? (
              <Text style={styles.progressSub}>
                {selectedSeatIds.join(', ')}
              </Text>
            ) : null}
          </View>

          <SeatMap
            seatLayout={seatLayout}
            seats={seats}
            selectedSeatIds={selectedSeatIds}
            onPressSeat={toggleSeat}
          />

          {holdMessage ? <Text style={styles.error}>{holdMessage}</Text> : null}

          <PrimaryButton
            title={
              isComplete
                ? 'Tiếp tục'
                : `Chọn thêm ${requiredCount - selectedSeatIds.length} ghế`
            }
            onPress={handleContinue}
            loading={Boolean(busySeatId)}
            disabled={!isComplete || Boolean(busySeatId)}
          />
        </GlassCard>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 20,
  },
  subtitle: {
    color: colors.text,
    fontWeight: '700',
  },
  subtle: {
    color: colors.muted,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: '#FECACA',
    fontWeight: '700',
    textAlign: 'center',
  },
  progressRow: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: spacing.sm,
    gap: 4,
  },
  progressText: {
    color: colors.text,
    fontWeight: '700',
  },
  progressSub: {
    color: colors.muted,
    fontWeight: '600',
  },
});
