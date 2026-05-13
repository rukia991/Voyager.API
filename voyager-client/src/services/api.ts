import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Vite proxy handles this in development
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token in headers
api.interceptors.request.use(
  (config) => {
    const savedUser = localStorage.getItem('voyager_user');
    if (savedUser) {
      try {
        const { token } = JSON.parse(savedUser);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Silently fail if JSON is malformed
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
