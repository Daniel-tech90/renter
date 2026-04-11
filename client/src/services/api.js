import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const path = window.location.pathname;
      const isLoginPage = path === '/login' || path === '/renter-login';
      if (!isLoginPage) {
        const isRenterRoute = path.startsWith('/renter');
        localStorage.removeItem(isRenterRoute ? 'renterToken' : 'token');
        localStorage.removeItem(isRenterRoute ? 'renterInfo' : 'admin');
        window.location.href = isRenterRoute ? '/renter-login' : '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
