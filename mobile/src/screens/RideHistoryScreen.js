import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getRideHistory } from '../services/api';
import { colors, spacing } from "../theme/theme";
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';

export default function RideHistoryScreen({ navigation }) {
  const [rides, setRides] = useState([]);

  useEffect(() => {
    const fetchRides = async () => {
      const data = await getRideHistory();
      setRides(data);
    };
    fetchRides();
  }, []);

  return (
    <AppBackground>
      <View style={styles.screen}>
        <GlassCard style={styles.mainCard}>
          <View style={styles.headerRow}>
            {navigation && navigation.canGoBack && navigation.canGoBack() && (
              <Text style={styles.backBtn} onPress={() => navigation.goBack()}>{'←'}</Text>
            )}
            <Text style={styles.title}>Lịch sử chuyến</Text>
          </View>
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
            ListEmptyComponent={<Text style={styles.empty}>Chưa có chuyến đi nào.</Text>}
          />
        </GlassCard>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    marginRight: 12,
    padding: 4,
  },
  screen: { flex: 1, padding: spacing.xl },
  mainCard: { flex: 1 },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  list: {
    paddingTop: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  rideItem: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
    borderRadius: 14,
    padding: spacing.lg,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  value: { color: colors.text, marginTop: spacing.xs, fontSize: 15, fontWeight: "700" },
  meta: { color: colors.muted, marginTop: spacing.md, fontWeight: "600" },
  empty: {
    color: "rgba(234,240,255,0.78)",
    textAlign: "center",
    marginTop: spacing.lg,
    fontWeight: "600",
  },
});
