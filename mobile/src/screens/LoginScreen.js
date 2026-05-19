import React from 'react';
import { View, Text, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { colors, spacing } from '../theme/theme';
import PrimaryButton from '../components/ui/PrimaryButton';
import TextField from '../components/ui/TextField';
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import useEmailLogin from '../hooks/useEmailLogin';

export default function LoginScreen({ navigation }) {
  const {
    email,
    setEmail,
    otp,
    setOtp,
    step,
    isNew,
    error,
    loading,
    requestOtp,
    verifyOtp,
  } = useEmailLogin({ navigation });

  return (
    <AppBackground>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.screen}>
          <GlassCard style={styles.card}>
            <Text style={styles.badge}>Xin Chào Quý Khách !</Text>
            <Text style={styles.title}>Ứng Dụng Đặt Vé Xe Limousine Online</Text>
            <Text style={styles.subtitle}>Đăng nhập bằng email</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {step === 1 ? (
              <>
                <TextField
                  label="Gmail"
                  placeholder="example@gmail.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
                <PrimaryButton
                  title="Nhận mã OTP"
                  onPress={requestOtp}
                  loading={loading}
                  disabled={!email || loading}
                />
              </>
            ) : (
              <>
                <Text style={styles.helper}>
                  {isNew ? 'Xin Chào ' : 'Chào Mừng Quý Khách Trở Lại'} • Nhập OTP để tiếp tục
                </Text>
                <TextField
                  label="OTP"
                  placeholder="6 chữ số"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
                <PrimaryButton
                  title="Xác nhận OTP"
                  onPress={verifyOtp}
                  loading={loading}
                  disabled={!otp}
                />
              </>
            )}
          </GlassCard>
        </View>
      </TouchableWithoutFeedback>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  badge: {
    color: 'rgba(234,240,255,0.95)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: 'rgba(234,240,255,0.78)', marginTop: spacing.xs, marginBottom: spacing.lg },
  helper: { color: colors.muted, marginBottom: spacing.md, fontWeight: '600' },
  error: {
    color: '#FFD6DA',
    backgroundColor: 'rgba(239,68,68,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,208,214,0.6)',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
});
