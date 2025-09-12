import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper"
import "./globals.css"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Privacy",
  description: "Created with v0",
  generator: "Next.js",
  icons: {
    icon: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.pixelId = "68bbb307ea01199edd38cf55";`,
          }}
        />
        <script src="https://cdn.utmify.com.br/scripts/utms/latest.js" async defer />
        <script src="https://cdn.utmify.com.br/scripts/pixel/pixel.js" async defer />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '3440749759401294');
              fbq('track', 'PageView');
            `,
          }}
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </Suspense>
        <Analytics />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=3440749759401294&ev=PageView&noscript=1"
          />
        </noscript>
      </body>
    </html>
  )
}
