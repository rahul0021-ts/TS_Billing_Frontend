import { useBill } from '../hooks/useBill'

export default function CustomerForm() {
  const { customerName, customerPhone, setCustomer } = useBill()

  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Customer name"
        value={customerName}
        onChange={e => setCustomer(e.target.value, customerPhone)}
        className="input flex-1 text-sm"
      />
      <input
        type="tel"
        placeholder="WhatsApp no."
        value={customerPhone}
        onChange={e => setCustomer(customerName, e.target.value)}
        className="input w-36 text-sm font-mono"
        maxLength={10}
      />
    </div>
  )
}