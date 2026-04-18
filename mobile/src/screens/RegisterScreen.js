import React, { useState } from 'react';
import { View, Text, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { completeProfile } from '../services/api';
import { colors, spacing, radius } from "../theme/theme";
import PrimaryButton from "../components/ui/PrimaryButton";
import TextField from "../components/ui/TextField";
import { setToken } from "../services/tokenStorage";

export default function RegisterScreen({ navigation, route }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const onboardingToken = route?.params?.onboardingToken || '';

  const handleRegister = async () => {
    try {
      setLoading(true);
      const res = await completeProfile(onboardingToken, name, phone);
      await setToken(res.token);
      navigation.replace('Home');
    } catch (err) {
      setError('Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.screen}>
        <View style={styles.card}>
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
            title="Đăng ký"
            onPress={handleRegister}
            loading={loading}
            disabled={!name || !phone || !onboardingToken}
            variant="success"
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  subtitle: { color: colors.muted, marginTop: spacing.xs, marginBottom: spacing.lg },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
    fontWeight: "600",
  },
});
