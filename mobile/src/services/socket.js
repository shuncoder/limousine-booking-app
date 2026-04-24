import { io } from 'socket.io-client';

const SOCKET_URL = 'http://192.168.1.13:5000';

const socket = io(SOCKET_URL, { transports: ['websocket'] });

export default socket;
