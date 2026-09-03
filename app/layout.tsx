import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/providers/QueryProvider"
import { Toaster } from "sonner"
import { PwaInstaller } from "@/components/pwa/pwa-installer"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "BeSafe — Emergency Intelligence, Real-Time SOS & Command Portal",
  description:
    "AI-powered voice threat triage, one-touch SOS distress beacons, and tactical agency dispatch command center.",
  keywords: [
    "emergency response",
    "safety app",
    "threat detection",
    "dispatch command center",
    "safe chat",
    "sos alerts",
    "progressive web app",
  ],
  authors: [{ name: "BeSafe Command Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BeSafe",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#070B14",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BeSafe" />
        <meta name="theme-color" content="#070B14" />
      </head>
      <body className="root-body">
        <QueryProvider>
          {children}
          <PwaInstaller />
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              style: {
                background: "#0F172A",
                border: "1px solid #1E293B",
                color: "#F8FAFC",
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
