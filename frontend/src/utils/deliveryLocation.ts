'use client'

import { usersAPI } from '@/services/api'

export const DELIVERY_LOCATION_STORAGE_KEY = 'gosellr_delivery_location_v1'

export type DeliveryLocation = {
  address: string
  lat: number
  lng: number
}

type GeoLikeError = {
  code?: number
  message?: string
}

export function readDeliveryLocation(): DeliveryLocation | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DELIVERY_LOCATION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DeliveryLocation> | null
    if (!parsed || typeof parsed.address !== 'string') return null
    if (!Number.isFinite(Number(parsed.lat)) || !Number.isFinite(Number(parsed.lng))) return null
    return {
      address: parsed.address.trim(),
      lat: Number(parsed.lat),
      lng: Number(parsed.lng),
    }
  } catch {
    return null
  }
}

export function saveDeliveryLocation(location: DeliveryLocation): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DELIVERY_LOCATION_STORAGE_KEY, JSON.stringify(location))
}

function compactAddress(parts: Array<string | undefined | null>): string {
  return parts
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean)
    .slice(0, 4)
    .join(', ')
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(
    lng,
  )}&format=jsonv2&addressdetails=1`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  })
  if (!response.ok) return ''
  const data = (await response.json()) as {
    display_name?: string
    address?: {
      road?: string
      suburb?: string
      city?: string
      town?: string
      village?: string
      state?: string
      country?: string
    }
  }
  const a = data.address
  const short =
    compactAddress([a?.road, a?.suburb, a?.city ?? a?.town ?? a?.village, a?.state]) ||
    (typeof data.display_name === 'string' ? data.display_name : '')
  return short || ''
}

export async function getCurrentDeliveryLocation(): Promise<DeliveryLocation> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    throw new Error('Geolocation is not supported by this browser')
  }
  const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    })
  })
  const lat = Number(pos.coords.latitude)
  const lng = Number(pos.coords.longitude)
  let address = ''
  try {
    address = await reverseGeocode(lat, lng)
  } catch {
    // Keep lat/lng even if reverse geocoding fails.
  }
  if (!address) address = `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`
  return { address, lat, lng }
}

export function getGeoErrorMessage(error: unknown): string {
  const e = (error ?? {}) as GeoLikeError
  // GeolocationPositionError codes: 1 PERMISSION_DENIED, 2 POSITION_UNAVAILABLE, 3 TIMEOUT
  if (e.code === 1) {
    return 'Location permission is blocked. Enable location access for this site and try again.'
  }
  if (e.code === 2) {
    return 'Your location is unavailable right now. Please check GPS/network and try again.'
  }
  if (e.code === 3) {
    return 'Location request timed out. Move to an open area and try again.'
  }
  if (typeof e.message === 'string' && e.message.trim()) return e.message
  return 'Unable to get your location. Please allow GPS and try again.'
}

export async function saveDeliveryLocationToDb(userId: string | undefined | null, location: DeliveryLocation): Promise<void> {
  const id = String(userId ?? '').trim()
  if (!id) return
  try {
    await usersAPI.update(id, {
      address: location.address,
      deliveryLocation: {
        address: location.address,
        lat: location.lat,
        lng: location.lng,
      },
    })
  } catch {
    // Best-effort: localStorage remains source of truth until backend schema includes this field.
  }
}

