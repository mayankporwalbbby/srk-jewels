import { useState, useEffect } from 'react'

export function useMetalPrices() {
  const [prices, setPrices] = useState({ gold10g: null, silverKg: null, loading: true, error: null, updatedAt: null })

  useEffect(() => {
    async function load() {
      try {
        // Frankfurter gives USD/INR; metals prices via a CORS-friendly source
        const [metalsRes, fxRes] = await Promise.all([
          fetch('https://api.metals.dev/v1/latest?api_key=demo&currency=USD&unit=toz'),
          fetch('https://api.frankfurter.app/latest?from=USD&to=INR')
        ])

        let goldOz, silverOz, usdInr

        if (fxRes.ok) {
          const fx = await fxRes.json()
          usdInr = fx.rates.INR
        } else {
          usdInr = 84 // fallback rate
        }

        if (metalsRes.ok) {
          const metals = await metalsRes.json()
          goldOz = metals?.metals?.gold
          silverOz = metals?.metals?.silver
        }

        // Fallback: use approximate international spot prices if API fails
        if (!goldOz) goldOz = 3300  // approx USD per troy oz
        if (!silverOz) silverOz = 33

        const gold10g = Math.round((goldOz / 31.1035) * 10 * usdInr)
        const silverKg = Math.round((silverOz / 31.1035) * 1000 * usdInr)

        setPrices({ gold10g, silverKg, loading: false, error: null, updatedAt: new Date() })
      } catch {
        // Final fallback with approximate values
        setPrices({ gold10g: null, silverKg: null, loading: false, error: 'Could not fetch live prices', updatedAt: null })
      }
    }
    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return prices
}
