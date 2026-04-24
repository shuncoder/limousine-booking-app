import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, radius } from "../theme/theme";

function getSeatVisual(seat) {
  const status = seat?.status || "available";
  const heldByMe = Boolean(seat?.heldByMe);

  if (status === "available") {
    return { bg: colors.surface2, border: colors.border, text: colors.text, disabled: false };
  }

  if (status === "held") {
    if (heldByMe) {
      return { bg: colors.brand2, border: colors.brand2, text: colors.bg, disabled: false };
    }
    return { bg: colors.surface, border: colors.border, text: colors.muted, disabled: true };
  }

  if (status === "pending") {
    return { bg: colors.surface, border: colors.border, text: colors.muted, disabled: true };
  }

  if (status === "paid") {
    return { bg: colors.surface, border: colors.brand2, text: colors.muted, disabled: true };
  }

  return { bg: colors.surface, border: colors.border, text: colors.muted, disabled: true };
}

export default function SeatMap({ seatLayout, seats, selectedSeatId, onPressSeat }) {
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
            const seat = seats?.[seatId] || { status: "available" };
            const visual = getSeatVisual(seat);
            const isSelected = selectedSeatId === seatId;

            return (
              <TouchableOpacity
                key={`seat-${seatId}`}
                disabled={visual.disabled}
                onPress={() => onPressSeat?.(seatId, seat)}
                style={[
                  styles.seat,
                  { backgroundColor: visual.bg, borderColor: visual.border },
                  isSelected ? styles.selected : null,
                ]}
              >
                <Text style={[styles.seatText, { color: visual.text }]}>{seatId}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <View style={styles.legend}>
        <LegendItem label="Trống" bg={colors.surface2} />
        <LegendItem label="Giữ (của bạn)" bg={colors.brand2} />
        <LegendItem label="Đã giữ/đặt" bg={colors.surface} />
      </View>
    </View>
  );
}

function LegendItem({ label, bg }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: bg }]} />
      <Text style={styles.legendText}>{label}</Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    alignItems: "center",
    justifyContent: "center",
  },
  selected: {
    borderColor: colors.brand,
    borderWidth: 2,
  },
  seatText: {
    fontWeight: "900",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "700",
    fontSize: 12,
  },
});
