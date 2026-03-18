import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { verifyPhone } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  // Giả lập lấy firebaseToken từ OTP
  const getFirebaseToken = async (phone, otp) => {
    // TODO: Tích hợp Firebase Auth để lấy token
    return 'firebaseToken';
  };

  const handleVerify = async () => {
    try {
      const firebaseToken = await getFirebaseToken(phone, otp);
      const res = await verifyPhone(firebaseToken);
      if (res.isNew) {
        navigation.replace('Register', { firebaseToken });
      } else {
        // Save token, chuyển sang Home
        navigation.replace('Home');
      }
    } catch (err) {
      setError('Xác thực thất bại');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng nhập bằng số điện thoại</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput placeholder="Số điện thoại" value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
      <TextInput placeholder="OTP" value={otp} onChangeText={setOtp} style={styles.input} keyboardType="number-pad" />
      <Button title="Tiếp tục" onPress={handleVerify} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 10, padding: 10, borderRadius: 5 },
  error: { color: 'red', marginBottom: 10 }
});
