import api from './axiosInstance'

// Search / Get Customers
export const getAll = (q) =>
  api
    .get('/customers', {
      params: q ? { q } : {},
    })
    .then((r) => r.data.data)

// Get Single Customer
export const getByPhone = (phone) =>
  api
    .get(`/customers/${phone}`)
    .then((r) => r.data.data)

// Create Customer
export const create = (data) =>
  api
    .post('/customers', data)
    .then((r) => r.data.data)

// Update Customer
export const update = (phone, data) =>
  api
    .put(`/customers/${phone}`, data)
    .then((r) => r.data.data)

// Delete Customer
export const remove = (phone) =>
  api
    .delete(`/customers/${phone}`)
    .then((r) => r.data.data)