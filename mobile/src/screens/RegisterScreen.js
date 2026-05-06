import React, { useState } from 'react';
import { View, Text, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { completeProfile } from '../services/api';
import { colors, spacing } from "../theme/theme";
import PrimaryButton from "../components/ui/PrimaryButton";
import TextField from "../components/ui/TextField";
import { setTokens, setUserSession } from "../services/tokenStorage";
import { connectSocket } from "../services/socket";
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';

export default function RegisterScreen({ navigation, route }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const onboardingToken = route?.params?.onboardingToken || '';

  const handleRegister = async () => {
    try {
      setLoading(true);
      const res = await completeProfile(name, phone);
      await setTokens(res.token);
      const role = res.user?.role || 'user';
      await setUserSession({ role, id: res.user?.id });
      try {
        await connectSocket();
      } catch {
        // ignore
      }
      navigation.replace(role === 'driver' ? 'DriverMain' : 'Main');
    } catch (err) {
      setError('Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBackground>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.screen}>
          <GlassCard style={styles.card}>
            <Text style={styles.badge}>Complete Profile</Text>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>Nhập thông tin để hoàn tất đăng ký</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TextField
              label="Họ và tên"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
            />
            <TextField
              label="Số điện thoại"
              placeholder="Ví dụ: 0901234567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <PrimaryButton
              title="Hoàn tất đăng ký"
              onPress={handleRegister}
              loading={loading}
              disabled={!name || !phone || !onboardingToken}
              variant="success"
            />
          </GlassCard>
        </View>
      </TouchableWithoutFeedback>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  badge: {
    color: "rgba(234,240,255,0.95)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  subtitle: { color: "rgba(234,240,255,0.78)", marginTop: spacing.xs, marginBottom: spacing.lg },
  error: {
    color: "#FFD6DA",
    backgroundColor: "rgba(239,68,68,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,208,214,0.6)",
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    fontWeight: "600",
  },
});
