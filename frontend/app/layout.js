import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import './globals.css'

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-display',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-body',
})

export const metadata = {
  title: 'CONCEPT COMMERCE',
  description: 'A dark, editorial fashion search application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body className={`${cormorantGaramond.variable} ${dmSans.variable}`}>
        {children}
      </body>
    </html>
  )
}
