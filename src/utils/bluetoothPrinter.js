// bluetoothPrinter.js
//
// Same shape as your original: module-level connection state, two plain
// exported functions. Two fixes applied:
//   1. Write method now matches what the characteristic actually
//      supports (writeValueWithoutResponse vs writeValue) instead of
//      always calling writeValue.
//   2. A gattserverdisconnected listener resets state cleanly if the
//      printer drops mid-session, instead of leaving a stale reference
//      that fails with a confusing GATT error on the next print.
//
// Also: printBluetoothReceipt now accepts either a plain string (same
// as before — chunked by character, then encoded, same approach you
// had) OR a raw Uint8Array of ESC/POS bytes (e.g. from an escpos.js
// formatter), sliced directly since that's already byte-safe. This
// means you can start with plain text now and switch to real ESC/POS
// formatting (bold header, centered shop name, auto-cut) later without
// touching this file.
//
// COMPATIBILITY REMINDER: this only works if your printer exposes a BLE
// GATT service. A lot of "Bluetooth 5.0" 80mm printers are actually
// classic Bluetooth SPP under the hood, which Web Bluetooth can't see
// at all — if requestDevice() never finds your printer, that's almost
// certainly why, and a bridge app (e.g. RawBT) is the fallback.

let printerDevice = null
let printerCharacteristic = null

function handleDisconnected() {
  printerDevice = null
  printerCharacteristic = null
}

export async function connectBluetoothPrinter() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        0xFFE0,
        '000018f0-0000-1000-8000-00805f9b34fb'
      ]
    })

    device.addEventListener('gattserverdisconnected', handleDisconnected)

    const server = await device.gatt.connect()

    const services = await server.getPrimaryServices()

    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics()

        for (const char of characteristics) {
          if (
            char.properties.write ||
            char.properties.writeWithoutResponse
          ) {
            printerDevice = device
            printerCharacteristic = char

            return {
              success: true,
              name: device.name || 'Printer Connected'
            }
          }
        }
      } catch {
        continue
      }
    }

    throw new Error('No writable characteristic found')
  } catch (err) {
    console.error(err)

    return {
      success: false,
      error: err.message
    }
  }
}

export function disconnectBluetoothPrinter() {
  if (printerDevice?.gatt?.connected) {
    printerDevice.gatt.disconnect()
  }
  handleDisconnected()
}

export function isPrinterConnected() {
  return Boolean(printerCharacteristic)
}

// Writes one chunk using whichever write method this characteristic
// actually supports — writeValue on a write-without-response-only
// characteristic (or vice versa) can throw on some browser/OS combos.
async function writeChunk(chunk) {
  if (printerCharacteristic.properties.writeWithoutResponse) {
    await printerCharacteristic.writeValueWithoutResponse(chunk)
  } else {
    await printerCharacteristic.writeValue(chunk)
  }
}

// `payload` can be:
//   - a plain string (chunked by character, then encoded — same
//     approach as your original, safe against splitting multi-byte
//     characters mid-boundary)
//   - a Uint8Array of raw bytes (e.g. pre-built ESC/POS commands),
//     sliced directly since it's already byte-safe
export async function printBluetoothReceipt(payload) {
  if (!printerCharacteristic) {
    throw new Error('Printer not connected')
  }

  const encoder = new TextEncoder()
  const isBytes = payload instanceof Uint8Array

  const chunks = isBytes
    ? sliceBytes(payload, 100)
    : (payload.match(/.{1,100}/gs) || []).map((c) => encoder.encode(c))

  for (const chunk of chunks) {
    await writeChunk(chunk)
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  if (!isBytes) {
    await writeChunk(encoder.encode('\n\n\n'))
  }
}

function sliceBytes(bytes, size) {
  const out = []
  for (let offset = 0; offset < bytes.length; offset += size) {
    out.push(bytes.slice(offset, offset + size))
  }
  return out
}