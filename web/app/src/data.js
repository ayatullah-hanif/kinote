import Papa from 'papaparse'

const cache = {}

export function loadCsv(name) {
  if (!cache[name]) {
    cache[name] = fetch('/data/' + name)
      .then((r) => {
        if (!r.ok) throw new Error('Could not load ' + name)
        return r.text()
      })
      .then((t) => {
        if (t.trim().startsWith('<')) throw new Error(name + ' was not found in public/data')
        return Papa.parse(t, { header: true, dynamicTyping: true, skipEmptyLines: true }).data
      })
  }
  return cache[name]
}

// Turns "NaN", empty and missing values into null
export function num(v) {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}