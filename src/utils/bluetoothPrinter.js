let printerDevice = null
let printerCharacteristic = null

export async function connectBluetoothPrinter() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        0xFFE0,
        '000018f0-0000-1000-8000-00805f9b34fb'
      ]
    })

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

export async function printBluetoothReceipt(text) {
  if (!printerCharacteristic) {
    throw new Error('Printer not connected')
  }

  const encoder = new TextEncoder()

  const chunks = text.match(/.{1,100}/gs) || []

  for (const chunk of chunks) {
    const data = encoder.encode(chunk)

    await printerCharacteristic.writeValue(data)

    await new Promise(resolve =>
      setTimeout(resolve, 50)
    )
  }

  await printerCharacteristic.writeValue(
    encoder.encode('\n\n\n')
  )
}