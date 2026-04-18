import React, { useState } from 'react';
import { View, Text, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { bookRide } from '../services/api';
import { colors, spacing, radius } from "../theme/theme";
import PrimaryButton from "../components/ui/PrimaryButton";
import TextField from "../components/ui/TextField";

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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.screen}>
        <View style={styles.card}>
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
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "900" },
  subtitle: { color: colors.muted, marginTop: spacing.xs, marginBottom: spacing.lg },
  message: { marginTop: spacing.lg, color: colors.muted, fontWeight: "600" },
});
