'use client'

import Link from 'next/link'

type NoResultsReturnHomeProps = {
  term: string
  embedded?: boolean
}

export default function NoResultsReturnHome({ term, embedded }: NoResultsReturnHomeProps) {
  const display = term.trim() || '—'

  const inner = (
    <div className="max-w-lg w-full text-center">
      <p className="text-lg sm:text-xl text-wm-muted leading-relaxed">
        There were no search results for:{' '}
        <span className="font-semibold text-wm-ink break-words">{display}</span>
      </p>
      <div className="mt-10 flex justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  )

  if (embedded) {
    return inner
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16">
      {inner}
    </div>
  )
}
