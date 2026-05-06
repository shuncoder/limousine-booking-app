import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import DriverTripsScreen from '../screens/driver/DriverTripsScreen';
import DriverTripDetailScreen from '../screens/driver/DriverTripDetailScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/theme';
import { useUnreadNotificationsCount } from '../hooks/useNotifications';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TripsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: 'rgba(7, 14, 26, 0.95)' },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '900' },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="DriverTrips"
        component={DriverTripsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DriverTripDetail"
        component={DriverTripDetailScreen}
        options={{ title: 'Hành khách' }}
      />
    </Stack.Navigator>
  );
}

export default function DriverTabNavigator() {
  const { count } = useUnreadNotificationsCount();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Tổng quan') iconName = 'speedometer';
          else if (route.name === 'Chuyến') iconName = 'car-sport';
          else if (route.name === 'Thông Báo') iconName = 'notifications';
          else if (route.name === 'Hồ Sơ') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#EAF0FF',
        tabBarInactiveTintColor: 'rgba(234,240,255,0.62)',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Tổng quan" component={DriverHomeScreen} />
      <Tab.Screen name="Chuyến" component={TripsStack} />
      <Tab.Screen
        name="Thông Báo"
        component={NotificationScreen}
        options={{
          tabBarBadge: count > 0 ? (count > 99 ? '99+' : count) : undefined,
          tabBarBadgeStyle: { backgroundColor: '#EF4444', color: '#fff' },
        }}
      />
      <Tab.Screen name="Hồ Sơ" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(9, 16, 30, 0.92)',
    borderTopColor: 'rgba(255,255,255,0.2)',
    borderTopWidth: 1,
    elevation: 0,
  },
  tabBarLabel: {
    fontWeight: '700',
    fontSize: 11,
    paddingBottom: 2,
  },
});
