import axios from 'axios';

// En producción el panel está servido por FastAPI, así que la API está en el mismo host.
// En desarrollo, Vite corre en otro puerto, por lo que usamos la URL base absoluta (ej. http://localhost:8000)
const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: baseURL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('panel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('panel_token');
      window.location.href = '/panel/login';
    }
    return Promise.reject(error);
  }
);

export default api;
