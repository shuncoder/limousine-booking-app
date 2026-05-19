import { useCallback, useState } from 'react';
import { startEmailOtp, verifyEmailOtp } from '../services/api';
import { completeAuthAndNavigate } from '../utils/authNavigation';

/**
 * Encapsulates the 2-step email-OTP login flow:
 *   step 1 → request OTP for an email
 *   step 2 → verify OTP, then either complete profile (new user) or navigate
 *            to the role-appropriate home stack.
 *
 * Screens only need to render fields and bind to the returned handlers; no
 * tokens, no role routing, no socket logic should leak into the UI.
 */
export default function useEmailLogin({ navigation }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const requestOtp = useCallback(async () => {
    if (!email) return;
    try {
      setError('');
      setLoading(true);
      const res = await startEmailOtp(email);
      setIsNew(Boolean(res?.isNew));
      setStep(2);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || 'Không thể gửi OTP'
      );
    } finally {
      setLoading(false);
    }
  }, [email]);

  const verifyOtp = useCallback(async () => {
    if (!otp) return;
    try {
      setError('');
      setLoading(true);
      const res = await verifyEmailOtp(email, otp);

      if (res?.isNew) {
        navigation.navigate('Register', {
          onboardingToken: res.token,
          email,
        });
        return;
      }

      await completeAuthAndNavigate({
        token: res.token,
        user: res.user,
        navigation,
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'OTP không hợp lệ hoặc đã hết hạn'
      );
    } finally {
      setLoading(false);
    }
  }, [email, otp, navigation]);

  return {
    email,
    setEmail,
    otp,
    setOtp,
    step,
    isNew,
    error,
    loading,
    requestOtp,
    verifyOtp,
  };
}
