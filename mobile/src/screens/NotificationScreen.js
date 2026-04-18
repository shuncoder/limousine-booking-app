import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from "../theme/theme";

export default function NotificationScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Thông báo</Text>
        <Text style={styles.subtitle}>Hiện chưa có thông báo nào.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "900" },
  subtitle: { color: colors.muted, marginTop: spacing.sm, fontWeight: "600" },
});
