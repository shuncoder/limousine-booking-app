import { clearTokens } from '../services/tokenStorage';
import { useNavigation } from '@react-navigation/native';

export default function useLogout() {
  const navigation = useNavigation();

  return async function logout() {
    await clearTokens();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };
}
