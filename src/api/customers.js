import api from './axiosInstance'

export const getAll = (q) => api.get('/customers', { params: q ? { q } : {} }).then(r => r.data.data)
export const getByPhone = (phone) => api.get(`/customers/${phone}`).then(r => r.data.data)
export const update = (phone, data) => api.put(`/customers/${phone}`, data).then(r => r.data.data)