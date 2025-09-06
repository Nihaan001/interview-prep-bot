import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              const originalConsoleError = console.error;
              console.error = function(...args) {
                const message = args[0];
                if (typeof message === 'string' && 
                    (message.includes('ResizeObserver loop') || 
                     message.includes('ResizeObserver loop completed') ||
                     message.includes('ResizeObserver loop limit exceeded'))) {
                  return;
                }
                originalConsoleError.apply(console, args);
              };

              window.addEventListener('error', function(e) {
                if (e.message && (
                    e.message.includes('ResizeObserver loop') ||
                    e.message === 'ResizeObserver loop completed with undelivered notifications.' || 
                    e.message === 'ResizeObserver loop limit exceeded')) {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                  return false;
                }
              });

              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.message && 
                    e.reason.message.includes('ResizeObserver loop')) {
                  e.preventDefault();
                  return false;
                }
              });
            `,
          }}
        />
        {children}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
