import { Geist, Geist_Mono, Sora } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

// Texto: Geist · Títulos: Sora · Código y cifras animadas: Geist Mono
const fontSans = Geist({ subsets: ["latin"], variable: "--font-sans" })
const fontDisplay = Sora({ subsets: ["latin"], variable: "--font-display" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata = {
  title: "Presupuesta mi web",
  description: "Calcula el presupuesto de tu web con las tarifas de la agencia",
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontSans.variable,
        fontDisplay.variable,
        fontMono.variable,
        "font-sans"
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
