import api from './axiosInstance'

export const getSettings = () => api.get('/settings').then(r => r.data.data)
export const updateSettings = (data) => api.put('/settings', data).then(r => r.data.data)
export const getSections = () => api.get('/sections').then(r => r.data.data)
export const sendWhatsApp = (data) => api.post('/whatsapp/send', data).then(r => r.data.data)