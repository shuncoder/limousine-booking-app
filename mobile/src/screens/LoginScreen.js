import React, { useState } from 'react';
import { View, Text, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { startEmailOtp, verifyEmailOtp } from '../services/api';
import { colors, spacing } from "../theme/theme";
import PrimaryButton from "../components/ui/PrimaryButton";
import TextField from "../components/ui/TextField";
import { setTokens, setUserSession } from "../services/tokenStorage";
import { connectSocket } from "../services/socket";
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';

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
        navigation.navigate("Register", { onboardingToken: res.token, email });
      } else {
        await setTokens(res.token);
        const role = res.user?.role || 'user';
        await setUserSession({ role, id: res.user?.id });
        try {
          await connectSocket();
        } catch {
          // ignore
        }
        navigation.replace(role === 'driver' ? 'DriverMain' : 'Main');
      }
    } catch (err) {
      console.log("ERROR VERIFY:", err.response?.data || err.message);
      setError(err.response?.data?.message || "OTP không hợp lệ hoặc đã hết hạn");
    } finally {
      setLoading(false);
    }
  };

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
                  onPress={handleContinueEmail}
                  loading={loading}
                  disabled={!email || loading}
                />
              </>
            ) : (
              <>
                <Text style={styles.helper}>
                  {isNew ? "Xin Chào " : "Chào Mừng Quý Khách Trở Lại"} • Nhập OTP để tiếp tục
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
  helper: { color: colors.muted, marginBottom: spacing.md, fontWeight: "600" },
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