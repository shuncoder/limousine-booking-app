import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getProfile } from '../services/api';
import { colors, spacing, radius } from "../theme/theme";

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getProfile();
      setProfile(data);
    };
    fetchProfile();
  }, []);

  if (!profile) {
    return (
      <View style={styles.screen}>
        <Text style={styles.loading}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Hồ sơ</Text>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
  loading: { color: colors.muted, fontWeight: "700" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "900", marginBottom: spacing.lg },
  row: { marginBottom: spacing.md },
  label: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  value: { color: colors.text, marginTop: spacing.xs, fontSize: 15, fontWeight: "700" },
});
