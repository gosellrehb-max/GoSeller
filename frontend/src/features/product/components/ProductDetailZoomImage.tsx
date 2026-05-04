'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

type Props = {
  src: string
  alt: string
  className?: string
  imgClassName?: string
}

const ZOOM_SCALE = 2.35

export function ProductDetailZoomImage({ src, alt, className, imgClassName }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [origin, setOrigin] = useState({ x: 50, y: 50 })
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setOrigin({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    })
  }, [])

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setLightboxOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [lightboxOpen])

  return (
    <>
      <div
        ref={wrapRef}
        className={`relative cursor-zoom-in overflow-hidden select-none ${className ?? ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false)
          setOrigin({ x: 50, y: 50 })
        }}
        onMouseMove={onMove}
        onClick={() => setLightboxOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="Product image — hover to zoom, click to enlarge"
        onKeyDown={(e) => e.key === 'Enter' && setLightboxOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className={imgClassName}
          style={{
            transformOrigin: `${origin.x}% ${origin.y}%`,
            transform: hovered ? `scale(${ZOOM_SCALE})` : 'scale(1)',
            transition: 'transform 0.22s ease-out',
            willChange: hovered ? 'transform' : undefined,
          }}
        />
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/35 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[92vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}
    </>
  )
}
