import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function SeatMap({
  seatLayout,
  seats = {},
  selectedSeatId,
  onPressSeat,
}) {
  const rows = seatLayout?.rows || [];

  const getSeatStyle = (seatId) => {
    const seat = seats[seatId];
    if (!seatId) return styles.empty;

    if (seat?.status === "booked") {
      return [styles.seat, styles.booked];
    }

    if (seat?.status === "held" && !seat?.heldByMe) {
      return [styles.seat, styles.held];
    }

    if (seatId === selectedSeatId) {
      return [styles.seat, styles.selected];
    }

    return [styles.seat, styles.available];
  };

  const isDisabled = (seatId) => {
    const seat = seats[seatId];
    return (
      !seatId ||
      seat?.status === "booked" ||
      (seat?.status === "held" && !seat?.heldByMe)
    );
  };

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((seatId, colIndex) => {
            if (seatId === null) {
              return <View key={colIndex} style={styles.aisle} />;
            }

            return (
              <TouchableOpacity
                key={seatId}
                style={getSeatStyle(seatId)}
                disabled={isDisabled(seatId)}
                onPress={() => onPressSeat(seatId, seats[seatId])}
                activeOpacity={0.7}
              >
                <Text style={styles.text}>{seatId}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 10,
  },

  row: {
    flexDirection: "row",
    gap: 8,
  },

  seat: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  aisle: {
    width: 20, // lối đi
  },

  empty: {
    width: 36,
    height: 36,
  },

  text: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  // trạng thái
  available: {
    backgroundColor: "#334155",
  },

  selected: {
    backgroundColor: "#f97316",
  },

  booked: {
    backgroundColor: "#111827",
  },

  held: {
    backgroundColor: "#6b7280",
  },
});