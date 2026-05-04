'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

const MIN_INITIAL_MS = 400
const MIN_NAV_MS = 200
/** If navigation never settles in React, force-hide (e.g. odd back-stack cases). */
const SAFETY_MS = 3500

function buildRouteKey(pathname: string, search: string) {
  const s = search.replace(/^\?/, '')
  return s ? `${pathname}?${s}` : pathname
}

function windowRouteKey() {
  return buildRouteKey(window.location.pathname, window.location.search)
}

function PageLoadOverlayInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [initialDone, setInitialDone] = useState(false)
  const [routePending, setRoutePending] = useState(false)
  const routePendingRef = useRef(false)
  const navStartRef = useRef<number | null>(null)
  const routeKeyRef = useRef<string | null>(null)
  const hideTimerRef = useRef<number | null>(null)
  const safetyTimerRef = useRef<number | null>(null)

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const scheduleHideNav = useCallback(() => {
    clearHideTimer()
    const start = navStartRef.current ?? performance.now()
    const elapsed = performance.now() - start
    const wait = Math.max(0, MIN_NAV_MS - elapsed)
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null
      routePendingRef.current = false
      setRoutePending(false)
      navStartRef.current = null
    }, wait)
  }, [clearHideTimer])

  useEffect(() => {
    routePendingRef.current = routePending
  }, [routePending])

  // First full page load
  useEffect(() => {
    const started = performance.now()
    const finish = () => {
      const wait = Math.max(0, MIN_INITIAL_MS - (performance.now() - started))
      window.setTimeout(() => setInitialDone(true), wait)
    }
    if (document.readyState === 'complete') finish()
    else window.addEventListener('load', finish, { once: true })
  }, [])

  const startRouteTransition = useCallback(() => {
    if (safetyTimerRef.current) {
      window.clearTimeout(safetyTimerRef.current)
      safetyTimerRef.current = null
    }
    navStartRef.current = performance.now()
    routePendingRef.current = true
    setRoutePending(true)
    safetyTimerRef.current = window.setTimeout(() => {
      safetyTimerRef.current = null
      routePendingRef.current = false
      setRoutePending(false)
      navStartRef.current = null
      routeKeyRef.current = windowRouteKey()
    }, SAFETY_MS)
  }, [])

  // Internal link clicks → show overlay until URL changes
  useEffect(() => {
    const onClickCapture = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a) return
      const href = a.getAttribute('href')
      if (!href || href.startsWith('#')) return
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return
      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      const next = url.pathname + url.search
      const cur = window.location.pathname + window.location.search
      if (next === cur) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (e.button !== 0) return
      startRouteTransition()
    }

    document.addEventListener('click', onClickCapture, true)
    return () => document.removeEventListener('click', onClickCapture, true)
  }, [startRouteTransition])

  // Back / forward: always schedule hide (React pathname can lag behind the URL bar).
  useEffect(() => {
    const onPopState = () => {
      startRouteTransition()
      window.setTimeout(() => {
        if (routePendingRef.current) scheduleHideNav()
      }, 0)
      window.setTimeout(() => {
        if (routePendingRef.current) scheduleHideNav()
      }, 120)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [startRouteTransition, scheduleHideNav])

  // React router reported URL changed (Link navigations + when Next syncs after popstate)
  useEffect(() => {
    const sp = searchParams?.toString() ?? ''
    const key = buildRouteKey(pathname ?? '', sp ? `?${sp}` : '')

    if (routeKeyRef.current === null) {
      routeKeyRef.current = key
      return
    }

    if (routeKeyRef.current === key) {
      return
    }

    routeKeyRef.current = key

    if (!routePendingRef.current) return

    if (safetyTimerRef.current) {
      window.clearTimeout(safetyTimerRef.current)
      safetyTimerRef.current = null
    }
    scheduleHideNav()
    return () => clearHideTimer()
  }, [pathname, searchParams, scheduleHideNav, clearHideTimer])

  const visible = !initialDone || routePending
  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/45 backdrop-blur-md transition-opacity duration-300"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div
        className="h-12 w-12 rounded-full border-[3px] border-primary border-t-transparent animate-[spin_0.4s_linear_infinite] motion-reduce:animate-none motion-reduce:border-primary/50"
        aria-hidden
      />
    </div>
  )
}

/** Suspense boundary required by `useSearchParams` in Next.js App Router. */
export function PageLoadOverlay() {
  return (
    <Suspense fallback={null}>
      <PageLoadOverlayInner />
    </Suspense>
  )
}
