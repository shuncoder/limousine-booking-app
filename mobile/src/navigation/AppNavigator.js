import React from 'react';
import { Pressable, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainTabNavigator from './MainTabNavigator';
import BookRideScreen from '../screens/BookRideScreen';
import SeatSelectionScreen from '../screens/SeatSelectionScreen';
import { colors } from "../theme/theme";

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={({ navigation, route }) => ({
          headerStyle: { backgroundColor: 'rgba(7, 14, 26, 0.95)' },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "800" },
          headerBackTitleVisible: false,
          headerLeft: () => {
            const hide = route.name === 'Login' || route.name === 'Main';
            if (hide) return null;
            return (
              <Pressable
                onPress={() => {
                  if (navigation.canGoBack()) navigation.goBack();
                  else navigation.replace('Main');
                }}
                style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                hitSlop={10}
              >
                <Text style={{ color: colors.text, fontWeight: '900' }}>{'←'}</Text>
              </Pressable>
            );
          },
        })}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="BookRide" component={BookRideScreen} />
        <Stack.Screen name="SeatSelection" component={SeatSelectionScreen} options={{ title: 'Quản lý ghế' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
