const DEFAULT_STEPS = [1, 2, 3, 6, 9, 12, 15, 18, 21, 24]

export function getNextStep(current, steps = DEFAULT_STEPS) {
  const sorted = [...steps].sort((a, b) => a - b)
  const next = sorted.find(s => s > current)
  return next !== undefined ? next : current
}

export function getPrevStep(current, steps = DEFAULT_STEPS) {
  const sorted = [...steps].sort((a, b) => a - b)
  const prev = [...sorted].reverse().find(s => s < current)
  return prev !== undefined ? prev : Math.max(1, current - 1)
}

export function clampQty(val) {
  const n = parseInt(val, 10)
  if (isNaN(n) || n < 1) return 1
  if (n > 9999) return 9999
  return n
}