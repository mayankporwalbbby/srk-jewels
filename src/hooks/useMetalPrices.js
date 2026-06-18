import { useState, useEffect, useCallback } from 'react'

const API_KEY = 'goldapi-eb1c9d785fdecfd1d3ebed7719f1e3a0-io'
const CACHE_KEY = 'srk_metal_prices'
const REFRESH_KEY = 'srk_refresh_count'
const TODAY = () => new Date().toISOString().split('T')[0]

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    // valid only if cached today
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

async function fetchFromAPI() {
  const [goldRes, silverRes] = await Promise.all([
    fetch('https://www.goldapi.io/api/XAU/INR', { headers: { 'x-access-token': API_KEY } }),
    fetch('https://www.goldapi.io/api/XAG/INR', { headers: { 'x-access-token': API_KEY } }),
  ])
  const gold = await goldRes.json()
  const silver = await silverRes.json()

  // price is per troy oz in INR
  const gold10g = Math.round((gold.price / 31.1035) * 10)
  const silverKg = Math.round((silver.price / 31.1035) * 1000)
  return { gold10g, silverKg }
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

  // Fetch on mount only if no cache for today
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
    if (count >= 2) {
      setShowWarning(true)
      return
    }
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
