import axios from 'axios';

// Detecta dinamicamente o IP do servidor para funcionar no PC e no celular via Wi-Fi
const getBaseUrl = () => {
  const host = window.location.hostname || '127.0.0.1';
  return `http://${host}:8000/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
