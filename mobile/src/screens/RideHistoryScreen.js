import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getRideHistory } from '../services/api';
import { colors, spacing, radius } from "../theme/theme";

export default function RideHistoryScreen() {
  const [rides, setRides] = useState([]);

  useEffect(() => {
    const fetchRides = async () => {
      const data = await getRideHistory();
      setRides(data);
    };
    fetchRides();
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Lịch sử chuyến</Text>
      <FlatList
        data={rides}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.rideItem}>
            <Text style={styles.label}>Điểm đón</Text>
            <Text style={styles.value}>{item.pickupLocation}</Text>
            <Text style={[styles.label, { marginTop: spacing.sm }]}>Điểm đến</Text>
            <Text style={styles.value}>{item.dropoffLocation}</Text>
            <Text style={styles.meta}>Trạng thái: {item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  list: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  rideItem: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  value: { color: colors.text, marginTop: spacing.xs, fontSize: 15, fontWeight: "700" },
  meta: { color: colors.muted, marginTop: spacing.md, fontWeight: "600" },
});
