import { useState, useEffect } from 'react'

export function useMetalPrices() {
  const [prices, setPrices] = useState({ gold10g: null, silverKg: null, loading: true, error: null, updatedAt: null })

  useEffect(() => {
    async function load() {
      try {
        const [metalsRes, fxRes] = await Promise.all([
          fetch('https://api.metals.live/v1/spot'),
          fetch('https://open.er-api.com/v6/latest/USD')
        ])
        const metals = await metalsRes.json()
        const fx = await fxRes.json()

        const usdInr = fx.rates.INR
        // metals.live returns [{gold: price}, {silver: price}, ...]
        const goldOz = metals.find(m => m.gold)?.gold
        const silverOz = metals.find(m => m.silver)?.silver

        const gold10g = Math.round((goldOz / 31.1035) * 10 * usdInr)
        const silverKg = Math.round((silverOz / 31.1035) * 1000 * usdInr)

        setPrices({ gold10g, silverKg, loading: false, error: null, updatedAt: new Date() })
      } catch {
        setPrices(p => ({ ...p, loading: false, error: 'Could not fetch live prices' }))
      }
    }
    load()
    const interval = setInterval(load, 5 * 60 * 1000) // refresh every 5 min
    return () => clearInterval(interval)
  }, [])

  return prices
}
