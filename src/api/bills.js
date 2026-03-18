import api from './axiosInstance'

export const getAll = (params) => api.get('/bills', { params }).then(r => r.data.data)
export const getById = (id) => api.get(`/bills/${id}`).then(r => r.data.data)
export const create = (data) => api.post('/bills', data).then(r => r.data.data)
export const getStats = () => api.get('/bills/stats').then(r => r.data.data)
export const markWhatsapp = (id) => api.patch(`/bills/${id}/whatsapp`).then(r => r.data.data)
export const remove = (id) => api.delete(`/bills/${id}`).then(r => r.data.data)