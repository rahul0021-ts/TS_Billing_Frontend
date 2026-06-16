import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useBillContext } from '../context/BillContext'
import * as billsApi from '../api/bills'
import { useSettings } from './useSettings'

export function useBill() {
  const ctx = useBillContext()
  const qc = useQueryClient()
  const { settings } = useSettings()

  const createBillMutation = useMutation({
    mutationFn: billsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bills'] }),
  })

  async function generateBill({ discount = 0, paymentMethod = 'cash' } = {}) {
    if (ctx.items.length === 0) throw new Error('Bill is empty')

    const payload = {
      customer: {
        name: ctx.customerName || 'Walk-in Customer',
        phone: ctx.customerPhone || '',
        city: ctx.customerCity || '',
      },
      items: ctx.items.map(i => ({
        productId: i.productId || undefined,
        name: i.name,
        nameHindi: i.nameHindi || '',
        sectionId: i.sectionId || '',
        size: i.size,
        qty: i.qty,
        rate: i.rate,
        amount: Math.round(i.qty * i.rate),
      })),
      discount,
      paymentMethod,
    }

    const bill = await createBillMutation.mutateAsync(payload)

    ctx.dispatch({
      type: 'SET_BILL_NO',
      billNo: bill.billNo,
    })

    return bill
  }

  function addItem(item) {
    ctx.dispatch({ type: 'ADD_ITEM', item })
  }

  function removeItem(id) {
    ctx.dispatch({ type: 'REMOVE_ITEM', id })
  }

  function setQty(id, qty) {
    ctx.dispatch({ type: 'SET_QTY', id, qty })
  }

  // UPDATED
  function setCustomer(name, phone, city = '') {
    ctx.dispatch({
      type: 'SET_CUSTOMER',
      name,
      phone,
      city,
    })
  }

  function clearBill() {
    ctx.dispatch({ type: 'CLEAR_BILL' })
  }

  const qtySteps =
    settings?.qtySteps || [1, 2, 3, 6, 9, 12, 15, 18, 21, 24]

  return {
    items: ctx.items,
    billNo: ctx.billNo,

    customerName: ctx.customerName,
    customerPhone: ctx.customerPhone,
    customerCity: ctx.customerCity, // NEW

    subtotal: ctx.subtotal,
    qtySteps,

    isGenerating: createBillMutation.isPending,

    generateBill,
    addItem,
    removeItem,
    setQty,
    setCustomer,
    clearBill,
  }
}