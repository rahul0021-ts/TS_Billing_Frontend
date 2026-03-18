import api from './axiosInstance'

export const login = async (username, password) => {
  const res = await api.post('/auth/login', { username, password })
  const { token } = res.data.data
  localStorage.setItem('garment_token', token)
  return res.data.data
}

export const logout = () => {
  localStorage.removeItem('garment_token')
  window.location.href = '/login'
}

export const getMe = () => api.get('/auth/me').then(r => r.data.data)