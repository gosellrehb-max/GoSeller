import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import GlobalSiteHeader from '@/components/layout/GlobalSiteHeader'

const gosellrIcon = '/images/GoSellrIcon.png'

export const metadata: Metadata = {
  title: 'GoSellr - World\'s Best E-commerce Platform',
  description: 'World\'s Best Level E-commerce Frontend - GoSellr',
  manifest: '/site.webmanifest',
  icons: {
    icon: [{ url: gosellrIcon, type: 'image/png' }],
    shortcut: gosellrIcon,
    apple: gosellrIcon,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <GlobalSiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  )
}
