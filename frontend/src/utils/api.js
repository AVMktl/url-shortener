import axios from 'axios';

const API_BASE = "https://urlshortenerapp1-hdanbrangkbddxb0.westeurope-01.azurewebsites.net";

export const createShortUrl = async (data) => {
  return axios.post(`${API_BASE}/shorten`, data);
};

export const getStats = async (alias, password) => {
  return axios.post(`${API_BASE}/api/stats`, { alias, password });
};