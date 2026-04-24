import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useLogout from '../utils/useLogout';
import { getProfile } from '../services/api';
import { colors, spacing } from "../theme/theme";
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import PrimaryButton from '../components/ui/PrimaryButton';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const logout = useLogout();

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getProfile();
      setProfile(data);
    };
    fetchProfile();
  }, []);

  if (!profile) {
    return (
      <AppBackground>
        <View style={styles.screen}>
          <GlassCard>
            <Text style={styles.loading}>Đang tải...</Text>
          </GlassCard>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <View style={styles.screen}>
        <GlassCard style={styles.card}>
          <View style={styles.headerRow}>
            {navigation && navigation.canGoBack && navigation.canGoBack() && (
              <Text style={styles.backBtn} onPress={() => navigation.goBack()}>{'←'}</Text>
            )}
            <Text style={styles.title}>Hồ sơ</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Họ tên</Text>
            <Text style={styles.value}>{profile.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{profile.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Vai trò</Text>
            <Text style={styles.value}>{profile.role}</Text>
          </View>
          <PrimaryButton title="Đăng xuất" onPress={logout} variant="brand" />
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
  loading: { color: colors.muted, fontWeight: "700", textAlign: "center" },
  card: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "900", marginBottom: spacing.lg },
  row: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.18)",
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  value: { color: colors.text, marginTop: spacing.xs, fontSize: 15, fontWeight: "700" },
});
