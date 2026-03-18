import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Generate a bill PDF and return the jsPDF doc instance.
 */
export function generateBillPDF(bill, shop = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' })

  const pageW   = doc.internal.pageSize.getWidth()
  const margin  = 12
  const centerX = pageW / 2

  // colours
  const GREEN       = [29, 158, 117]
  const DARK_GREEN  = [8,  80,  65]
  const LIGHT_GRAY  = [245, 245, 243]
  const MID_GRAY    = [150, 150, 148]
  const BLACK       = [30,  30,  28]

  let y = 0

  // ── Green header band ──────────────────────────────────────────────────────
  doc.setFillColor(...GREEN)
  doc.rect(0, 0, pageW, 24, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(shop.shopName || 'Supekar Garments', centerX, 10, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const subLine = [shop.shopAddress, shop.shopPhone].filter(Boolean).join('  |  ')
  if (subLine) doc.text(subLine, centerX, 17, { align: 'center' })

  y = 30

  // ── Bill meta bar ──────────────────────────────────────────────────────────
  const date    = new Date(bill.createdAt || Date.now())
  const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  doc.setFillColor(...LIGHT_GRAY)
  doc.roundedRect(margin, y, pageW - margin * 2, 14, 2, 2, 'F')

  doc.setTextColor(...BLACK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(`Bill No: #${bill.billNo || '---'}`, margin + 4, y + 5.5)
  doc.text(`${dateStr}  ${timeStr}`, pageW - margin - 4, y + 5.5, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const customerName  = bill.customer?.name  || bill.customerName  || 'Walk-in Customer'
  const customerPhone = bill.customer?.phone || bill.customerPhone || ''
  const customerLine  = customerPhone ? `${customerName}  |  ${customerPhone}` : customerName
  doc.text(`Customer: ${customerLine}`, margin + 4, y + 11)

  y += 20

  // ── GST number (optional) ──────────────────────────────────────────────────
  if (shop.gstNumber) {
    doc.setFontSize(7.5)
    doc.setTextColor(...MID_GRAY)
    doc.text(`GSTIN: ${shop.gstNumber}`, margin, y)
    y += 6
  }

  // ── Items table ────────────────────────────────────────────────────────────
  const items     = bill.items || []
  const tableRows = items.map((item, i) => [
    i + 1,
    item.name + (item.nameHindi ? '\n' + item.nameHindi : ''),
    item.size,
    item.qty,
    `Rs.${item.rate}`,
    `Rs.${Math.round(item.qty * item.rate)}`,
  ])

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Product', 'Size', 'Qty', 'Rate', 'Amount']],
    body: tableRows,
    styles: {
      font:        'helvetica',
      fontSize:    8,
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      textColor:   BLACK,
      lineColor:   [220, 220, 218],
      lineWidth:   0.2,
    },
    headStyles: {
      fillColor:  DARK_GREEN,
      textColor:  [255, 255, 255],
      fontStyle:  'bold',
      fontSize:   8,
    },
    alternateRowStyles: {
      fillColor: LIGHT_GRAY,
    },
    columnStyles: {
      0: { cellWidth: 8,      halign: 'center' },
      1: { cellWidth: 'auto'                   },
      2: { cellWidth: 16,     halign: 'center' },
      3: { cellWidth: 10,     halign: 'center' },
      4: { cellWidth: 20,     halign: 'right'  },
      5: { cellWidth: 22,     halign: 'right', fontStyle: 'bold' },
    },
    didParseCell(data) {
      if (data.column.index === 5 && data.section === 'body') {
        data.cell.styles.textColor = GREEN
      }
    },
  })

  y = doc.lastAutoTable.finalY + 4

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totalsX = pageW - margin - 60
  const totalsW = 60

  if (bill.discount > 0) {
    doc.setFontSize(8.5)
    doc.setTextColor(...MID_GRAY)
    doc.setFont('helvetica', 'normal')
    doc.text('Subtotal', totalsX + 2, y + 5)
    doc.text(`Rs.${bill.subtotal}`, pageW - margin - 2, y + 5, { align: 'right' })

    doc.setTextColor(200, 60, 60)
    doc.text('Discount', totalsX + 2, y + 11)
    doc.text(`- Rs.${bill.discount}`, pageW - margin - 2, y + 11, { align: 'right' })
    y += 8
  }

  // total green band
  doc.setFillColor(...GREEN)
  doc.roundedRect(totalsX, y + 3, totalsW, 12, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL', totalsX + 4, y + 11)
  doc.text(`Rs.${bill.total}`, pageW - margin - 3, y + 11, { align: 'right' })

  y += 20

  // payment method
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MID_GRAY)
  doc.text(`Payment: ${bill.paymentMethod || 'Cash'}`, margin, y)

  y += 10

  // ── Footer ─────────────────────────────────────────────────────────────────
  doc.setDrawColor(...GREEN)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageW - margin, y)

  y += 5
  doc.setFontSize(8)
  doc.setTextColor(...MID_GRAY)
  doc.setFont('helvetica', 'italic')
  doc.text('Thank you for shopping!', centerX, y, { align: 'center' })

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK_GREEN)
  doc.text(shop.shopName || 'Supekar Garments', centerX, y, { align: 'center' })

  return doc
}

/**
 * Download PDF directly to device.
 */
export function downloadBillPDF(bill, shop) {
  const doc = generateBillPDF(bill, shop)
  doc.save(`Bill_${bill.billNo || 'draft'}.pdf`)
}

/**
 * Open PDF preview in a new browser tab.
 */
export function previewBillPDF(bill, shop) {
  const doc = generateBillPDF(bill, shop)
  const url = doc.output('bloburl')
  window.open(url, '_blank')
}

/**
 * Get PDF as a Blob (used internally for sharing).
 */
export function getBillPDFBlob(bill, shop) {
  const doc = generateBillPDF(bill, shop)
  return doc.output('blob')
}

/**
 * Share PDF via WhatsApp.
 *
 * On Android/iPhone  → uses Web Share API → native share sheet → tap WhatsApp → PDF attaches
 * On Desktop/fallback → downloads PDF + opens wa.me link in browser
 */
export async function sharePDFWhatsApp(bill, shop, phone) {
  const fileName = `Bill_${bill.billNo || 'draft'}.pdf`
  const blob     = getBillPDFBlob(bill, shop)

  // mobile: Web Share API
  if (navigator.canShare) {
    const file        = new File([blob], fileName, { type: 'application/pdf' })
    const canShareFile = navigator.canShare({ files: [file] })

    if (canShareFile) {
      try {
        await navigator.share({
          title: `Bill #${bill.billNo} - ${shop?.shopName || 'Supekar Garments'}`,
          text:  `Bill #${bill.billNo}\nTotal: Rs.${bill.total}`,
          files: [file],
        })
        return { method: 'webshare' }
      } catch (err) {
        if (err.name === 'AbortError') return { method: 'cancelled' }
        // fall through to download
      }
    }
  }

  // desktop / fallback: download + open WhatsApp
  downloadBillPDF(bill, shop)

  if (phone) {
    const clean = String(phone).replace(/\D/g, '')
    const num   = clean.startsWith('91') ? clean : '91' + clean
    const msg   = encodeURIComponent(
      `Bill #${bill.billNo} - Total: Rs.${bill.total}\n(PDF downloaded to your device)`
    )
    setTimeout(() => window.open(`https://wa.me/${num}?text=${msg}`, '_blank'), 800)
  }

  return { method: 'download' }
}
