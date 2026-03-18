import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

export const verifyPhone = async (firebaseToken) => {
  const res = await api.post('/auth/verify-phone', { firebaseToken });
  return res.data;
};

export const register = async (firebaseToken, name) => {
  const res = await api.post('/auth/register', { firebaseToken, name });
  return res.data;
};

export const getProfile = async (token) => {
  const res = await api.get('/users/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const bookRide = async (token, pickupLocation, dropoffLocation) => {
  const res = await api.post(
    '/rides/book',
    { pickupLocation, dropoffLocation },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const getRideHistory = async (token) => {
  const res = await api.get('/rides/history', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export default api;