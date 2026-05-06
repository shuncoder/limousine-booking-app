import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import RideHistoryScreen from '../screens/RideHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationScreen from '../screens/NotificationScreen';
import { Ionicons } from '@expo/vector-icons';
import { useUnreadNotificationsCount } from '../hooks/useNotifications';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { count } = useUnreadNotificationsCount();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Trang Chủ') {
            iconName = 'home';
          } else if (route.name === 'Lịch Sử Chuyến') {
            iconName = 'car';
          } else if (route.name === 'Thông Báo') {
            iconName = 'notifications';
          } else if (route.name === 'Hồ Sơ') {
            iconName = 'person';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#EAF0FF',
        tabBarInactiveTintColor: 'rgba(234,240,255,0.62)',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Trang Chủ" component={HomeScreen} />
      <Tab.Screen name="Lịch Sử Chuyến" component={RideHistoryScreen} />
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
