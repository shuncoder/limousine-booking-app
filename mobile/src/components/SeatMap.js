import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';

function getSeatVisual(seat, isSelected) {
  if (isSelected) {
    return {
      bg: colors.brand,
      border: colors.brand,
      text: '#fff',
      disabled: false,
    };
  }

  const status = seat?.status || 'available';
  const heldByMe = Boolean(seat?.heldByMe);

  if (status === 'available') {
    return { bg: '#FFFFFF', border: '#FFFFFF', text: '#111827', disabled: false };
  }

  if (status === 'held' && heldByMe) {
    return { bg: '#FFFFFF', border: colors.brand2, text: '#111827', disabled: false };
  }

  return { bg: '#EF4444', border: '#EF4444', text: '#FFFFFF', disabled: true };
}

export default function SeatMap({ seatLayout, seats, selectedSeatIds = [], onPressSeat }) {
  const rows = seatLayout?.rows || [];

  return (
    <View style={styles.map}>
      {rows.map((row, rIdx) => (
        <View key={`row-${rIdx}`} style={styles.row}>
          {row.map((cell, cIdx) => {
            if (!cell) {
              return <View key={`aisle-${rIdx}-${cIdx}`} style={styles.aisle} />;
            }

            const seatId = String(cell);
            const seat = seats?.[seatId] || { status: 'available' };
            const isSelected = selectedSeatIds.includes(seatId);
            const visual = getSeatVisual(seat, isSelected);

            return (
              <TouchableOpacity
                key={`seat-${seatId}`}
                disabled={visual.disabled}
                onPress={() => onPressSeat?.(seatId, seat)}
                style={[
                  styles.seat,
                  { backgroundColor: visual.bg, borderColor: visual.border },
                ]}
              >
                <Text style={[styles.seatText, { color: visual.text }]}>{seatId}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <View style={styles.legend}>
        <LegendItem label="Ghế trống" bg="#FFFFFF" text="#111827" />
        <LegendItem label="Đã đặt" bg="#EF4444" text="#FFFFFF" />
        <LegendItem label="Bạn chọn" bg={colors.brand} text="#FFFFFF" />
      </View>
    </View>
  );
}

function LegendItem({ label, bg, text }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: bg }]} />
      <Text style={[styles.legendText, { color: text === '#111827' ? colors.text : colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  aisle: {
    width: 20,
    height: 42,
  },
  seat: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatText: {
    fontWeight: '900',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendText: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 12,
  },
});
