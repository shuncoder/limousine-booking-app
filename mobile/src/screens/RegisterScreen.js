import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { register } from '../services/api';

export default function RegisterScreen({ navigation, route }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const firebaseToken = route?.params?.firebaseToken || '';

  const handleRegister = async () => {
    try {
      await register(firebaseToken, name);
      navigation.replace('Home');
    } catch (err) {
      setError('Đăng ký thất bại');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nhập họ tên để đăng ký</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput placeholder="Họ và tên" value={name} onChangeText={setName} style={styles.input} />
      <Button title="Đăng ký" onPress={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 10, padding: 10, borderRadius: 5 },
  error: { color: 'red', marginBottom: 10 }
});
