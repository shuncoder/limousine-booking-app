import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from "../theme/theme";
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';

export default function NotificationScreen({ navigation }) {
  return (
    <AppBackground>
      <View style={styles.screen}>
        <GlassCard style={styles.card}>
          <View style={styles.headerRow}>
            {navigation && navigation.canGoBack && navigation.canGoBack() && (
              <Text style={styles.backBtn} onPress={() => navigation.goBack()}>{'←'}</Text>
            )}
            <Text style={styles.title}>Thông báo</Text>
          </View>
          <Text style={styles.subtitle}>Hiện chưa có thông báo nào.</Text>
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
  screen: { flex: 1, padding: spacing.xl, justifyContent: "center" },
  card: {
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "900" },
  subtitle: { color: "rgba(234,240,255,0.84)", marginTop: spacing.sm, fontWeight: "600" },
});
