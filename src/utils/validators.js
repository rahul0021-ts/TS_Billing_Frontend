export function isValidPhone(phone) {
    return /^[6-9]\d{9}$/.test(String(phone).trim())
  }
  
  export function isValidRate(rate) {
    const n = Number(rate)
    return !isNaN(n) && n >= 0
  }
  
  export function parseSizeInput(input) {
    return input
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
  }
  
  export function buildRatesObject(sizes, ratesMap) {
    const result = {}
    sizes.forEach(size => {
      const v = ratesMap[size]
      if (v !== undefined && v !== '' && !isNaN(Number(v))) {
        result[size] = Number(v)
      }
    })
    return result
  }