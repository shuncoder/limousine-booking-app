import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import socket from '../services/socket';

export default function SocketExample() {
  useEffect(() => {
    socket.on('ride_request', (data) => {
      console.log('Ride requested:', data);
    });
    socket.emit('ride_request', { pickupLocation: 'A', dropoffLocation: 'B' });
    return () => {
      socket.off('ride_request');
    };
  }, []);

  return (
    <View>
      <Text>Socket.IO Example</Text>
    </View>
  );
}
