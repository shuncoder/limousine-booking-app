import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from "../theme/theme";
import PrimaryButton from "../components/ui/PrimaryButton";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Xin chào</Text>
        <Text style={styles.subtitle}>Bạn muốn làm gì hôm nay?</Text>
        <View style={styles.actions}>
          <PrimaryButton title="Đặt chuyến" onPress={() => navigation.navigate('BookRide')} />
          <PrimaryButton title="Lịch sử chuyến" onPress={() => navigation.navigate('RideHistory')} />
          <PrimaryButton title="Hồ sơ" onPress={() => navigation.navigate('Profile')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    justifyContent: "center",
  },
  title: { color: colors.text, fontSize: 22, fontWeight: "900" },
  subtitle: { color: colors.muted, marginTop: spacing.xs, marginBottom: spacing.xl },
  actions: { gap: spacing.md },
});
