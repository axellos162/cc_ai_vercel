import { Cormorant_Garamond, Archivo } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-display',
})

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-body',
})

export const metadata = {
  title: 'CONCEPT COMMERCE',
  description: 'A refined, editorial fashion search application with a clean, minimal aesthetic',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body className={`${cormorantGaramond.variable} ${archivo.variable}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
