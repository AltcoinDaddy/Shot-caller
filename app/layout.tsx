import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { Providers } from "@/components/providers"

export const metadata: Metadata = {
  title: "ShotCaller - Fantasy Sports with NFTs",
  description: "Transform your Dapper NFTs into fantasy game assets",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  )
}
