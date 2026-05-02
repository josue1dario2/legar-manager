import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
}

export const registrosService = {
  list: (params) => api.get('/registros', { params }),
  get: (id) => api.get(`/registros/${id}`),
  create: (data) => api.post('/registros', data),
  update: (id, data) => api.put(`/registros/${id}`, data),
  delete: (id) => api.delete(`/registros/${id}`),
  stats: () => api.get('/registros/stats'),
}

export const alertasService = {
  list: (params) => api.get('/alertas', { params }),
  markRead: (id) => api.put(`/alertas/${id}/read`),
  markAllRead: () => api.put('/alertas/read-all'),
}

export const adminService = {
  listUsers: (params) => api.get('/admin/users', { params }),
  listRegistros: (params) => api.get('/admin/registros', { params }),
  stats: () => api.get('/admin/stats'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
}

export default api