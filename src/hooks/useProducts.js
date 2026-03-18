import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as productsApi from '../api/products'
import * as settingsApi from '../api/settings'

export function useProducts(sectionId) {
  return useQuery({
    queryKey: ['products', sectionId],
    queryFn: () => productsApi.getAll(sectionId),
    staleTime: 60000,
  })
}

export function useAllProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
    staleTime: 60000,
  })
}

export function useProductSearch(q) {
  return useQuery({
    queryKey: ['products', 'search', q],
    queryFn: () => productsApi.search(q),
    enabled: !!q && q.length >= 1,
    staleTime: 10000,
  })
}

export function useSections() {
  return useQuery({
    queryKey: ['sections'],
    queryFn: settingsApi.getSections,
    staleTime: 300000,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => productsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useToggleProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: productsApi.toggle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}