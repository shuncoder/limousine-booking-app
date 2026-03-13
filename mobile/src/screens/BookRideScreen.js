import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { bookRide } from '../services/api';

export default function BookRideScreen({ navigation }) {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [message, setMessage] = useState('');

  const handleBook = async () => {
    try {
      // Replace with actual token management
      const token = '';
      await bookRide(token, pickup, dropoff);
      setMessage('Ride booked!');
    } catch (err) {
      setMessage('Booking failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book a Ride</Text>
      <TextInput placeholder="Pickup Location" value={pickup} onChangeText={setPickup} style={styles.input} />
      <TextInput placeholder="Dropoff Location" value={dropoff} onChangeText={setDropoff} style={styles.input} />
      <Button title="Book Ride" onPress={handleBook} />
      {message ? <Text>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 10, padding: 10, borderRadius: 5 }
});
