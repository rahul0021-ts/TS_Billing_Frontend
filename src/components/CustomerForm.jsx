import { useState, useEffect } from 'react'
import { useBill } from '../hooks/useBill'
import * as customersApi from '../api/customers'

export default function CustomerForm() {
  const {
    customerName,
    customerPhone,
    customerCity,
    setCustomer,
  } = useBill()

  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [showList, setShowList] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers(query = '') {
    try {
      setLoading(true)

      const data = await customersApi.getAll(query)

      setCustomers(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(value) {
    setSearch(value)

    if (!value.trim()) {
      loadCustomers()
      return
    }

    await loadCustomers(value)
  }

  function selectCustomer(customer) {
    setCustomer(
      customer.name || '',
      customer.phone || '',
      customer.city || ''
    )

    setShowList(false)
    setSearch('')
  }

  return (
    <div className="space-y-2">

      {/* Search Customer */}
      <div className="flex gap-2">

        <button
          type="button"
          onClick={() => setShowList(!showList)}
          className="px-3 rounded-lg bg-primary-500 text-white text-sm"
          title="Saved Customers"
        >
          👤
        </button>

        <input
          type="text"
          placeholder="Search customer by name or phone..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="input flex-1 text-sm"
        />

      </div>

      {/* Selected Customer */}
      <div className="flex gap-2">

        <input
          type="text"
          placeholder="Customer Name"
          value={customerName}
          readOnly
          className="input flex-1 text-sm bg-ink-800"
        />

        <input
          type="text"
          placeholder="Phone"
          value={customerPhone}
          readOnly
          className="input w-36 text-sm font-mono bg-ink-800"
        />

      </div>

      {/* Customer List */}
      {showList && (
        <div className="max-h-64 overflow-y-auto border border-ink-700 rounded-xl bg-ink-800 shadow-lg">

          {loading && (
            <div className="p-3 text-sm text-ink-400">
              Loading...
            </div>
          )}

          {!loading && customers.length === 0 && (
            <div className="p-3 text-sm text-ink-400">
              No customers found
            </div>
          )}

          {!loading &&
            customers.map(customer => (
              <button
                key={customer.phone}
                type="button"
                onClick={() => selectCustomer(customer)}
                className="w-full text-left p-3 border-b border-ink-700 hover:bg-ink-700 transition"
              >
                <div className="font-medium text-ink-100">
                  {customer.name}
                </div>

                <div className="text-xs text-ink-400">
                  {customer.phone}
                </div>

                {customer.city && (
                  <div className="text-xs text-primary-400">
                    {customer.city}
                  </div>
                )}
              </button>
            ))}
        </div>
      )}

    </div>
  )
}