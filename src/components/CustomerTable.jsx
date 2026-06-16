export default function CustomerTable({
    customers,
    onEdit,
    onDelete,
  }) {
    if (!customers.length) {
      return (
        <div className="card p-6 text-center text-ink-500">
          No customers found
        </div>
      )
    }
  
    return (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-800">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Phone</th>
                <th className="text-left p-3">City</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
  
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.phone}
                  className="border-t border-ink-700"
                >
                  <td className="p-3">
                    {customer.name}
                  </td>
  
                  <td className="p-3 font-mono">
                    {customer.phone}
                  </td>
  
                  <td className="p-3">
                    {customer.city || '-'}
                  </td>
  
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(customer)}
                        className="btn-ghost text-xs"
                      >
                        Edit
                      </button>
  
                      <button
                        onClick={() => onDelete(customer)}
                        className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg text-white text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }