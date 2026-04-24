import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

export default function AppBackground({ children }) {
  return (
    <ImageBackground
      source={require('../../assets/images/main_bg.png')}
      style={styles.background}
      imageStyle={{ opacity: 1 }}
      resizeMode="cover"
    >
      <View style={styles.overlay}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 20, 0.55)',
  },
});
