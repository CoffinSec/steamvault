import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StreamVault — Progressive Video Streaming',
  description: 'Paste any direct video URL and stream it instantly as it downloads.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
