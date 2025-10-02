import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const createShortUrl = async (data) => {
  return axios.post(`${API_BASE}/shorten`, data);
};

export const getStats = async (alias, password) => {
  return axios.post(`${API_BASE}/api/stats`, { alias, password });
};