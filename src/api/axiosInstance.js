import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 15000,
})

axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('garment_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosInstance.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('garment_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default axiosInstance