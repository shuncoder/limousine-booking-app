import { useCallback, useState } from 'react';
import { completeProfile } from '../services/api';
import { completeAuthAndNavigate } from '../utils/authNavigation';

/**
 * Onboarding hook for the "complete profile" step right after a new email
 * verification. Owns name/phone state and the async submission. Screens stay
 * declarative.
 */
export default function useRegisterProfile({ navigation, onboardingToken }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = Boolean(name && phone && onboardingToken);

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    try {
      setError('');
      setLoading(true);

      const res = await completeProfile(name, phone);
      await completeAuthAndNavigate({
        token: res.token,
        user: res.user,
        navigation,
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  }, [canSubmit, name, phone, navigation]);

  return {
    name,
    setName,
    phone,
    setPhone,
    error,
    loading,
    canSubmit,
    submit,
  };
}
