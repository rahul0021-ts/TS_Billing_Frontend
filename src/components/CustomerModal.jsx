import { useState, useEffect } from 'react'

export default function CustomerModal({
  open,
  onClose,
  onSave,
  customer = null,
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')

  useEffect(() => {
    if (customer) {
      setName(customer.name || '')
      setPhone(customer.phone || '')
      setCity(customer.city || '')
    } else {
      setName('')
      setPhone('')
      setCity('')
    }
  }, [customer])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()

    await onSave({
      name,
      phone,
      city,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-ink-800 border border-ink-700 rounded-2xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink-100">
            {customer ? 'Edit Customer' : 'Add Customer'}
          </h2>

          <button
            onClick={onClose}
            className="text-ink-400 hover:text-red-400"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Customer Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input w-full"
            required
          />

          <input
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input w-full"
            maxLength={10}
            required
          />

          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="input w-full"
          />

          <button
            type="submit"
            className="btn-primary w-full"
          >
            {customer ? 'Update Customer' : 'Save Customer'}
          </button>
        </form>
      </div>
    </div>
  )
}