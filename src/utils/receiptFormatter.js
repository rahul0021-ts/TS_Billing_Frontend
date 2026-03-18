export function formatAsText(bill, shopInfo = {}) {
    const shopName = shopInfo.shopName || 'Supekar Garments'
    const shopAddress = shopInfo.shopAddress || ''
    const shopPhone = shopInfo.shopPhone || ''
    const date = new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
    const time = new Date(bill.createdAt || Date.now()).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    })
  
    const lines = []
    lines.push(shopName)
    if (shopAddress) lines.push(shopAddress)
    if (shopPhone) lines.push(`Ph: ${shopPhone}`)
    lines.push('─'.repeat(36))
    lines.push(`Bill No: ${bill.billNo || '---'}`)
    lines.push(`Date: ${date} ${time}`)
    if (bill.customer?.name && bill.customer.name !== 'Walk-in Customer') {
      lines.push(`Customer: ${bill.customer.name}`)
    }
    if (bill.customer?.phone) lines.push(`Phone: ${bill.customer.phone}`)
    lines.push('─'.repeat(36))
  
    const header = `${'#'.padEnd(3)} ${'Item'.padEnd(16)} ${'Sz'.padEnd(6)} ${'Qty'.padStart(3)} ${'Rate'.padStart(5)} ${'Amt'.padStart(6)}`
    lines.push(header)
    lines.push('─'.repeat(36))
  
    bill.items.forEach((item, idx) => {
      const n = String(idx + 1).padEnd(3)
      const name = (item.name || '').substring(0, 15).padEnd(16)
      const sz = String(item.size || '').substring(0, 5).padEnd(6)
      const qty = String(item.qty).padStart(3)
      const rate = String(item.rate).padStart(5)
      const amt = String(Math.round(item.qty * item.rate)).padStart(6)
      lines.push(`${n} ${name} ${sz} ${qty} ${rate} ${amt}`)
    })
  
    lines.push('─'.repeat(36))
    lines.push(`${'Subtotal'.padEnd(28)} ${String(bill.subtotal || 0).padStart(6)}`)
    if (bill.discount > 0) {
      lines.push(`${'Discount'.padEnd(28)} -${String(bill.discount).padStart(5)}`)
    }
    lines.push(`${'TOTAL'.padEnd(28)} ₹${String(bill.total || 0).padStart(5)}`)
    lines.push('─'.repeat(36))
    lines.push(`Payment: ${bill.paymentMethod || 'Cash'}`)
    lines.push('')
    lines.push('Thank you for shopping!')
    lines.push(shopName)
  
    return lines.join('\n')
  }
  
  export function formatForWhatsApp(bill, shopInfo = {}) {
    const shopName = shopInfo.shopName || 'Supekar Garments'
    const shopAddress = shopInfo.shopAddress || ''
    const date = new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  
    const lines = []
    lines.push(`*${shopName}*`)
    if (shopAddress) lines.push(`_${shopAddress}_`)
    lines.push('')
    lines.push(`*Bill No:* ${bill.billNo || '---'}`)
    lines.push(`*Date:* ${date}`)
    if (bill.customer?.name && bill.customer.name !== 'Walk-in Customer') {
      lines.push(`*Customer:* ${bill.customer.name}`)
    }
    lines.push('')
    lines.push('*Items:*')
  
    bill.items.forEach((item, idx) => {
      const amt = Math.round(item.qty * item.rate)
      lines.push(`${idx + 1}. ${item.name} (${item.size}) × ${item.qty} @ ₹${item.rate} = *₹${amt}*`)
    })
  
    lines.push('')
    if (bill.discount > 0) {
      lines.push(`Subtotal: ₹${bill.subtotal}`)
      lines.push(`Discount: -₹${bill.discount}`)
    }
    lines.push(`*Total: ₹${bill.total}*`)
    lines.push(`Payment: ${bill.paymentMethod || 'Cash'}`)
    lines.push('')
    lines.push('_Thank you for shopping! 🛍️_')
  
    return lines.join('\n')
  }