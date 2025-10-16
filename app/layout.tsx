import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { Providers } from "@/components/providers"
import { ErrorBoundary, AsyncErrorBoundary } from "@/components/error-boundary"
import { NetworkStatusBanner } from "@/components/network-status"

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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="font-sans antialiased touch-pan-y">
        <ErrorBoundary>
          <Providers>
            <AsyncErrorBoundary>
              <NetworkStatusBanner />
              <Navigation />
              <main className="min-h-screen pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
                {children}
              </main>
            </AsyncErrorBoundary>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
