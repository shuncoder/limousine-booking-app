import React, { useState } from 'react';
import { View, Text, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import AppBackground from '../components/ui/AppBackground';
import { bookRide } from '../services/api';
import { colors, spacing } from "../theme/theme";
import PrimaryButton from "../components/ui/PrimaryButton";
import TextField from "../components/ui/TextField";
import GlassCard from '../components/ui/GlassCard';

export default function BookRideScreen({ navigation }) {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    try {
      setLoading(true);
      await bookRide(pickup, dropoff);
      setMessage('Đặt chuyến thành công!');
    } catch (err) {
      setMessage('Đặt chuyến thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBackground>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.screen}>
          <GlassCard style={styles.card}>
            <Text style={styles.badge}>Quick Booking</Text>
            <Text style={styles.title}>Đặt chuyến</Text>
            <Text style={styles.subtitle}>Nhập điểm đón và điểm đến</Text>
            <TextField
              label="Điểm đón"
              placeholder="Ví dụ: Sân bay Tân Sơn Nhất"
              value={pickup}
              onChangeText={setPickup}
              returnKeyType="next"
            />
            <TextField
              label="Điểm đến"
              placeholder="Ví dụ: Quận 1, TP.HCM"
              value={dropoff}
              onChangeText={setDropoff}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <PrimaryButton
              title="Đặt chuyến"
              onPress={handleBook}
              loading={loading}
              disabled={!pickup || !dropoff}
            />
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </GlassCard>
        </View>
      </TouchableWithoutFeedback>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.xl },
  card: {
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    marginTop: spacing.xl,
  },
  badge: {
    color: "rgba(234,240,255,0.95)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "900" },
  subtitle: { color: "rgba(234,240,255,0.78)", marginTop: spacing.xs, marginBottom: spacing.lg },
  message: {
    marginTop: spacing.lg,
    color: "rgba(234,240,255,0.92)",
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
});
