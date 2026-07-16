import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Cairo, Tajawal } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", display: "swap" })
const tajawal = Tajawal({ subsets: ["arabic", "latin"], weight: ["400", "500", "700"], variable: "--font-tajawal", display: "swap" })

export const metadata: Metadata = {
  title: { default: "دفتر الخياط", template: "%s | دفتر الخياط" },
  description: "تطبيق عربي احترافي لإدارة عمليات الخياطة والعملاء والمستحقات والنسخ الاحتياطي.",
  applicationName: "دفتر الخياط",
  generator: "v0.app",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "دفتر الخياط", statusBarStyle: "default" },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f7f3eb" }, { media: "(prefers-color-scheme: dark)", color: "#102824" }],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl" suppressHydrationWarning className="bg-background"><body className={`${cairo.variable} ${tajawal.variable} font-sans antialiased`}><Providers>{children}</Providers>{process.env.NODE_ENV === "production" && <Analytics />}</body></html>
}
