import { createContext, useContext, useReducer } from 'react'

const BillContext = createContext(null)

const initialState = {
  items: [],
  billNo: null,
  customerName: '',
  customerPhone: '',
}

function billReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item } = action
      const existIdx = state.items.findIndex(
        i => i.productId === item.productId && i.size === item.size && item.productId
      )
      if (existIdx >= 0) {
        // Already in bill — increment qty by 1
        const items = [...state.items]
        items[existIdx] = { ...items[existIdx], qty: items[existIdx].qty + 1 }
        return { ...state, items }
      }
      const startQty = item.defaultQty && item.defaultQty > 0 ? item.defaultQty : 1
      return {
        ...state,
        items: [
          ...state.items,
          {
            ...item,
            qty:        startQty,   // fixed: always a valid number
            defaultQty: startQty,
            id:         Date.now() + Math.random(),
          },
        ],
      }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.id) }
    case 'SET_QTY': {
      const items = state.items.map(i => i.id === action.id ? { ...i, qty: action.qty } : i)
      return { ...state, items }
    }
    case 'SET_CUSTOMER':
      return { ...state, customerName: action.name || '', customerPhone: action.phone || '' }
    case 'SET_BILL_NO':
      return { ...state, billNo: action.billNo }
    case 'CLEAR_BILL':
      return { ...initialState }
    default:
      return state
  }
}

export function BillProvider({ children }) {
  const [state, dispatch] = useReducer(billReducer, initialState)
  const subtotal = state.items.reduce((sum, i) => sum + Math.round(i.qty * i.rate), 0)

  return (
    <BillContext.Provider value={{ ...state, subtotal, dispatch }}>
      {children}
    </BillContext.Provider>
  )
}

export function useBillContext() {
  const ctx = useContext(BillContext)
  if (!ctx) throw new Error('useBillContext must be used inside BillProvider')
  return ctx
}
