import React from 'react';
import { View, Text, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { colors, spacing } from '../theme/theme';
import PrimaryButton from '../components/ui/PrimaryButton';
import TextField from '../components/ui/TextField';
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import useRegisterProfile from '../hooks/useRegisterProfile';

export default function RegisterScreen({ navigation, route }) {
  const onboardingToken = route?.params?.onboardingToken || '';

  const {
    name,
    setName,
    phone,
    setPhone,
    error,
    loading,
    canSubmit,
    submit,
  } = useRegisterProfile({ navigation, onboardingToken });

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
              onPress={submit}
              loading={loading}
              disabled={!canSubmit || loading}
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
