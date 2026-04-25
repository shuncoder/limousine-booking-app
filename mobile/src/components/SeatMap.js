import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

/**
 * seat.status:
 * - available
 * - held
 * - booked
 * - paid
 * seat.heldByMe: boolean
 */

function getSeatState(seat, selectedSeatId, seatId) {
  const status = seat?.status || "available";
  const heldByMe = !!seat?.heldByMe;

  if (seatId === selectedSeatId) {
    return { type: "selected", disabled: false };
  }

  if (status === "available") {
    return { type: "available", disabled: false };
  }

  if (status === "held") {
    return heldByMe
      ? { type: "heldByMe", disabled: false }
      : { type: "disabled", disabled: true };
  }

  if (status === "booked" || status === "paid") {
    return { type: "disabled", disabled: true };
  }

  return { type: "disabled", disabled: true };
}

export default function SeatMap({
  seatLayout,
  seats = {},
  selectedSeatId,
  onPressSeat,
}) {
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
            const seat = seats[seatId] || {};
            const state = getSeatState(seat, selectedSeatId, seatId);

            return (
              <TouchableOpacity
                key={seatId}
                disabled={state.disabled}
                onPress={() => onPressSeat?.(seatId, seat)}
                activeOpacity={0.7}
                style={[
                  styles.seat,
                  styles[state.type],
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
        <LegendItem label="Trống" style={styles.available} />
        <LegendItem label="Đã chọn" style={styles.selected} />
        <LegendItem label="Giữ (của bạn)" style={styles.heldByMe} />
        <LegendItem label="Đã đặt" style={styles.disabled} />
      </View>
    </View>
  );
}

function LegendItem({ label, style }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendBox, style]} />
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
    gap: 8,
  },

  aisle: {
    width: 20,
  },

  seat: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  text: {
    fontWeight: "700",
    fontSize: 12,
  },
  available: {
    backgroundColor: "#ffffff",
    borderColor: "#d1d5db",
  },

  selected: {
    backgroundColor: "#f97316",
    borderColor: "#f97316",
  },

  heldByMe: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },

  disabled: {
    backgroundColor: "#9ca3af",
    borderColor: "#9ca3af",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 10,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
  },

  legendText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
});