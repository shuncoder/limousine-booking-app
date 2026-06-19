import React from 'react';
import { Pressable, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainTabNavigator from './MainTabNavigator';
import DriverTabNavigator from './DriverTabNavigator';
import BookRideScreen from '../screens/BookRideScreen';
import SeatSelectionScreen from '../screens/SeatSelectionScreen';
import CustomerInfoScreen from '../screens/CustomerInfoScreen';
import PaymentScreen from '../screens/PaymentScreen';
import RouteVisualizationScreen from '../screens/RouteVisualizationScreen';
import CreateComplaintScreen from '../screens/CreateComplaintScreen';
import ComplaintDetailScreen from '../screens/ComplaintDetailScreen';
import { colors } from '../theme/theme';

const Stack = createStackNavigator();

const ROOT_ROUTES = new Set(['Login', 'Main', 'DriverMain']);

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={({ navigation, route }) => ({
          headerStyle: { backgroundColor: 'rgba(7, 14, 26, 0.95)' },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '800' },
          headerBackTitleVisible: false,
          headerLeft: () => {
            if (ROOT_ROUTES.has(route.name)) return null;
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
        <Stack.Screen
          name="DriverMain"
          component={DriverTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="BookRide" component={BookRideScreen} options={{ title: 'Chọn chuyến' }} />
        <Stack.Screen name="SeatSelection" component={SeatSelectionScreen} options={{ title: 'Chọn ghế' }} />
        <Stack.Screen name="CustomerInfo" component={CustomerInfoScreen} options={{ title: 'Thông tin khách hàng' }} />
        <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Thanh toán' }} />
        <Stack.Screen
          name="RouteVisualization"
          component={RouteVisualizationScreen}
          options={{ title: 'Định tuyến A*' }}
        />
        <Stack.Screen
          name="CreateComplaint"
          component={CreateComplaintScreen}
          options={{ title: 'Gửi khiếu nại' }}
        />
        <Stack.Screen
          name="ComplaintDetail"
          component={ComplaintDetailScreen}
          options={{ title: 'Chi tiết khiếu nại' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
