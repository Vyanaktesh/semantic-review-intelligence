/**
 * API helpers — all requests go through Vite's `/api` proxy in dev
 * and through VITE_API_BASE_URL in production.
 */
export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    let detail = ''
    try { detail = (await res.json()).error || '' } catch { /* ignore */ }
    throw new Error(detail || `Request failed with ${res.status}`)
  }
  return res.json() as Promise<T>
}

// Shared types that mirror the backend response shapes
export interface Distribution { positive: number; neutral: number; negative: number }

export interface Theme { label: string; count: number; avgPolarity: number; example?: { text: string; polarity: number } | null }

export interface ProductSummary {
  asin: string
  productName?: string
  total: number
  avgRating: number | null
  avgPolarity: number
  distribution: Distribution
  topThemes: Theme[]
}

export interface ProductListItem {
  asin: string
  productName?: string
  count: number
  avgRating: number | null
  positiveRatio: number
  negativeRatio: number
}

export interface Overview {
  total: number
  products: number
  avgPolarity: number
  avgRating: number | null
  distribution: Distribution
  topThemes: { label: string; count: number }[]
}

export interface TimelinePoint {
  period: string
  count: number
  avgPolarity: number
  avgRating: number | null
  positive: number
  neutral: number
  negative: number
}

export interface AlertItem {
  asin: string
  productName?: string
  period: string
  severity: 'high' | 'medium'
  baselineNegativeRatio: number
  currentNegativeRatio: number
  delta: number
  reviewCount: number
  message: string
}

export interface Insights {
  summary: ProductSummary
  positiveThemes: Theme[]
  negativeThemes: Theme[]
  positiveQuotes: { text: string; polarity: number }[]
  negativeQuotes: { text: string; polarity: number }[]
  insights: { headline: string[]; recommendations: string[] }
}
