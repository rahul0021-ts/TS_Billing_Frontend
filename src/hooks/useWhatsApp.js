import { useMutation } from '@tanstack/react-query'
import { sendWhatsApp } from '../api/settings'
import * as billsApi from '../api/bills'

export function useWhatsApp() {
  const apiMutation = useMutation({ mutationFn: sendWhatsApp })
  const markMutation = useMutation({ mutationFn: billsApi.markWhatsapp })

  function sendViaLink(phone, text) {
    const clean = String(phone).replace(/\D/g, '')
    const encoded = encodeURIComponent(text)
    window.open(`https://wa.me/91${clean}?text=${encoded}`, '_blank')
  }

  async function sendViaAPI(billId, phone, text) {
    const result = await apiMutation.mutateAsync({
      phone: String(phone).replace(/\D/g, ''),
      billText: text,
      billId,
    })
    return result
  }

  async function sendBill({ bill, phone, text, preferAPI = false }) {
    if (preferAPI) {
      try {
        await sendViaAPI(bill._id, phone, text)
        return { method: 'api' }
      } catch {
        sendViaLink(phone, text)
        return { method: 'link' }
      }
    } else {
      sendViaLink(phone, text)
      if (bill?._id) {
        await markMutation.mutateAsync(bill._id).catch(() => {})
      }
      return { method: 'link' }
    }
  }

  return {
    sendViaLink,
    sendViaAPI,
    sendBill,
    isSending: apiMutation.isPending,
  }
}