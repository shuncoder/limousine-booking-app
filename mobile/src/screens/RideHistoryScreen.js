import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getRideHistory } from '../services/api';

export default function RideHistoryScreen() {
  const [rides, setRides] = useState([]);

  useEffect(() => {
    const fetchRides = async () => {
      // Replace with actual token management
      const token = '';
      const data = await getRideHistory(token);
      setRides(data);
    };
    fetchRides();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ride History</Text>
      <FlatList
        data={rides}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.rideItem}>
            <Text>Pickup: {item.pickupLocation}</Text>
            <Text>Dropoff: {item.dropoffLocation}</Text>
            <Text>Status: {item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, marginBottom: 20, textAlign: 'center' },
  rideItem: { padding: 10, borderBottomWidth: 1, borderColor: '#eee' }
});
