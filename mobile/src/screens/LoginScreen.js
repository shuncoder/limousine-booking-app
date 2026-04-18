import React, { useState } from 'react';
import { View, Text, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { startEmailOtp, verifyEmailOtp } from '../services/api';
import { colors, spacing, radius } from "../theme/theme";
import PrimaryButton from "../components/ui/PrimaryButton";
import TextField from "../components/ui/TextField";
import { setToken } from "../services/tokenStorage";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const handleContinueEmail = async () => {
    try {
      setError("");
      setLoading(true);
      console.log("CALL API:", email);
      const res = await startEmailOtp(email);
      console.log("RESPONSE:", res);
      setIsNew(!!res.isNew);
      setStep(2);
    } catch (err) {
      console.log("ERROR:", err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || 'Không thể gửi OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setError("");
      setLoading(true);
      console.log("VERIFY:", email, otp);
      const res = await verifyEmailOtp(email, otp);
      console.log("VERIFY RESPONSE:", res);
      if (res.isNew) {
        navigation.replace("Register", { onboardingToken: res.token, email });
      } else {
        await setToken(res.token);
        navigation.replace("Home");
      }
    } catch (err) {
      console.log("ERROR VERIFY:", err.response?.data || err.message);
      setError(err.response?.data?.message || "OTP không hợp lệ hoặc đã hết hạn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.title}>Limousine Booking</Text>
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
                title="Tiếp tục"
                onPress={handleContinueEmail}
                loading={loading}
                disabled={!email}
              />
            </>
          ) : (
            <>
              <Text style={styles.helper}>
                {isNew ? "Email mới" : "Email đã tồn tại"} • Nhập OTP để tiếp tục
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
                onPress={handleVerifyOtp}
                loading={loading}
                disabled={!otp}
              />
            </>
          )}
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
  helper: { color: colors.muted, marginBottom: spacing.md, fontWeight: "600" },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
    fontWeight: "600",
  },
});