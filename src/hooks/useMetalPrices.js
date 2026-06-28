import { useState, useEffect, useCallback } from 'react'

const CACHE_KEY = 'srk_metal_prices'
const REFRESH_KEY = 'srk_refresh_count'
const TODAY = () => new Date().toISOString().split('T')[0]

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data.date === TODAY()) return data
    return null
  } catch { return null }
}

function saveCache(gold10g, silverKg) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ gold10g, silverKg, date: TODAY(), updatedAt: new Date().toISOString() }))
}

function getRefreshCount() {
  try {
    const raw = localStorage.getItem(REFRESH_KEY)
    if (!raw) return 0
    const data = JSON.parse(raw)
    if (data.date === TODAY()) return data.count
    return 0
  } catch { return 0 }
}

function incrementRefreshCount() {
  const count = getRefreshCount() + 1
  localStorage.setItem(REFRESH_KEY, JSON.stringify({ date: TODAY(), count }))
  return count
}

async function fetchMCXRate(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed: ${ticker}`)
  const data = await res.json()
  return data.chart.result[0].meta.regularMarketPrice
}

async function fetchFromAPI() {
  // MCX Gold is quoted in INR per 10g; MCX Silver in INR per kg
  // These are Indian market rates including all duties — matches local jewellery market
  const [gold10g, silverKg] = await Promise.all([
    fetchMCXRate('GOLD.MCX'),
    fetchMCXRate('SILVER.MCX'),
  ])
  return { gold10g: Math.round(gold10g), silverKg: Math.round(silverKg) }
}

export function useMetalPrices() {
  const cached = loadCache()
  const [prices, setPrices] = useState({
    gold10g: cached?.gold10g ?? null,
    silverKg: cached?.silverKg ?? null,
    loading: !cached,
    error: null,
    updatedAt: cached?.updatedAt ? new Date(cached.updatedAt) : null,
  })
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (cached) return
    fetchFromAPI()
      .then(({ gold10g, silverKg }) => {
        saveCache(gold10g, silverKg)
        incrementRefreshCount()
        setPrices({ gold10g, silverKg, loading: false, error: null, updatedAt: new Date() })
      })
      .catch(() => {
        setPrices(p => ({ ...p, loading: false, error: 'Could not fetch prices' }))
      })
  }, [])

  const refresh = useCallback(async () => {
    const count = getRefreshCount()
    if (count >= 2) { setShowWarning(true); return }
    setPrices(p => ({ ...p, loading: true, error: null }))
    try {
      const { gold10g, silverKg } = await fetchFromAPI()
      const newCount = incrementRefreshCount()
      saveCache(gold10g, silverKg)
      setPrices({ gold10g, silverKg, loading: false, error: null, updatedAt: new Date() })
      if (newCount >= 2) setShowWarning(true)
    } catch {
      setPrices(p => ({ ...p, loading: false, error: 'Could not fetch prices' }))
    }
  }, [])

  return { ...prices, refresh, showWarning, dismissWarning: () => setShowWarning(false) }
}
