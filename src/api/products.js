import api from './axiosInstance'

export const getAll = (sectionId) => api.get('/products', { params: sectionId ? { sectionId } : {} }).then(r => r.data.data)
export const search = (q) => api.get('/products/search', { params: { q } }).then(r => r.data.data)
export const getById = (id) => api.get(`/products/${id}`).then(r => r.data.data)
export const create = (data) => api.post('/products', data).then(r => r.data.data)
export const update = (id, data) => api.put(`/products/${id}`, data).then(r => r.data.data)
export const toggle = (id) => api.patch(`/products/${id}/toggle`).then(r => r.data.data)
export const remove = (id) => api.delete(`/products/${id}`).then(r => r.data.data)