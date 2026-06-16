import { useEffect, useState } from 'react'
import * as customersApi from '../api/customers'
import CustomerTable from '../components/CustomerTable'
import CustomerModal from '../components/CustomerModal'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers(query = '') {
    try {
      const data = await customersApi.getAll(query)
      setCustomers(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSearch(value) {
    setSearch(value)
    await loadCustomers(value)
  }

  function handleAdd() {
    setSelectedCustomer(null)
    setShowModal(true)
  }

  function handleEdit(customer) {
    setSelectedCustomer(customer)
    setShowModal(true)
  }

  async function handleSave(customerData) {
    try {
      if (selectedCustomer) {
        await customersApi.update(
          selectedCustomer.phone,
          customerData
        )
      } else {
        await customersApi.create(customerData)
      }

      setShowModal(false)
      loadCustomers(search)
    } catch (err) {
      alert(
        err.response?.data?.message ||
        'Failed to save customer'
      )
    }
  }

  async function handleDelete(customer) {
    const ok = window.confirm(
      `Delete ${customer.name}?`
    )

    if (!ok) return

    try {
      await customersApi.remove(customer.phone)

      loadCustomers(search)
    } catch (err) {
      alert(
        err.response?.data?.message ||
        'Failed to delete customer'
      )
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-100">
            Customers
          </h1>

          <p className="text-sm text-ink-500">
            Manage customer information
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="btn-primary"
        >
          + Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) =>
            handleSearch(e.target.value)
          }
          className="input w-full"
        />
      </div>

      {/* Table */}
      <CustomerTable
        customers={customers}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CustomerModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        customer={selectedCustomer}
      />
    </div>
  )
}