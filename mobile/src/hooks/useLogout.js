import { logout as apiLogout } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

export const useLogout = () => {
  const navigation = useNavigation();

  const logout = useCallback(async () => {
    await apiLogout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }, [navigation]);

  return { logout };
};