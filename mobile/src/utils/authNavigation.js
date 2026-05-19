/**
 * Sau khi đăng nhập / đăng ký xong, lưu tokens + session, kết nối socket
 * rồi điều hướng sang stack chính phù hợp với role.
 *
 * Tách ra để Login/Register screens không phải lặp lại đoạn này.
 */

import { setTokens, setUserSession } from '../services/tokenStorage';
import { connectSocket } from '../services/socket';

export const ROLE_TO_STACK = {
  driver: 'DriverMain',
  // Mọi role khác (user, staff, admin...) đi vào stack mặc định.
  default: 'Main',
};

export function resolveHomeStack(role) {
  return ROLE_TO_STACK[role] || ROLE_TO_STACK.default;
}

/**
 * Persist auth state then navigate to the right home stack. Socket connect
 * failures are swallowed because the UI shouldn't block on them.
 */
export async function completeAuthAndNavigate({ token, user, navigation }) {
  if (!token) throw new Error('Missing auth token');
  await setTokens(token);

  const role = user?.role || 'user';
  await setUserSession({ role, id: user?.id });

  try {
    await connectSocket();
  } catch {
    // ignore socket errors – navigation should still proceed
  }

  navigation.replace(resolveHomeStack(role));
}
