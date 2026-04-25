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
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((cell, colIndex) => {
           
            if (cell === null) {
              return <View key={`aisle-${colIndex}`} style={styles.aisle} />;
            }

            const seatId = String(cell);
            const seat = seats?.[seatId] || { status: "available" };
            const visual = getSeatVisual(seat);
            const isSelected = selectedSeatId === seatId;

            return (
              <TouchableOpacity
                key={seatId}
                disabled={state.disabled}
                onPress={() => onPressSeat?.(seatId, seat)}
                activeOpacity={0.7}
                style={[
                  styles.seat,
                  { backgroundColor: visual.bg, borderColor: visual.border },
                  isSelected ? styles.selected : null,
                ]}
              >
                <Text style={styles.text}>{seatId}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Legend */}
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
  container: {
    alignItems: "center",
    gap: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  aisle: {
    width: 20,
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

  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
  },

  legendText: {
    color: colors.muted,
    fontWeight: "700",
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
});