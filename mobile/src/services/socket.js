import { io } from 'socket.io-client';
import { API_ORIGIN } from './axiosWithRefresh';

const SOCKET_OPTIONS = {
  transports: ['websocket'],
};

const socket = io(API_ORIGIN, SOCKET_OPTIONS);

export const createTripSocket = () => io(API_ORIGIN, SOCKET_OPTIONS);

export default socket;
