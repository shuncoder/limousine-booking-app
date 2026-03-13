import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const register = async (name, email, password, role) => {
  const res = await api.post('/auth/register', { name, email, password, role });
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

export const getRideById = async (token, id) => {
  const res = await api.get(`/rides/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export default api;
