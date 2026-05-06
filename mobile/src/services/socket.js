import { io } from 'socket.io-client';
import { API_ORIGIN } from './axiosWithRefresh';
import { getAccessToken } from './tokenStorage';

const SOCKET_OPTIONS = {
  transports: ['websocket'],
  autoConnect: false,
};

let sharedSocket = null;

async function buildAuthOptions() {
  const token = await getAccessToken();
  return {
    ...SOCKET_OPTIONS,
    auth: token ? { token } : {},
  };
}

export const getSocket = () => sharedSocket;

export const connectSocket = async () => {
  const options = await buildAuthOptions();

  if (!sharedSocket) {
    sharedSocket = io(API_ORIGIN, options);
  } else {
    sharedSocket.auth = options.auth;
  }

  if (!sharedSocket.connected) {
    sharedSocket.connect();
  }

  return sharedSocket;
};

export const disconnectSocket = () => {
  if (sharedSocket) {
    sharedSocket.disconnect();
  }
};

export const createTripSocket = async () => {
  const options = await buildAuthOptions();
  return io(API_ORIGIN, { ...options, autoConnect: true });
};

export default {
  getSocket,
  connectSocket,
  disconnectSocket,
  createTripSocket,
};
