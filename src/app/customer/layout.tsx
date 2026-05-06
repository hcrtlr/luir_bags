import type { Metadata } from "next"
import { DM_Sans, Cormorant_Garamond } from "next/font/google"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import "../globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://www.luirbags.com"),
  title: "Luir Bags",
  description: "Premium canta ve valizler.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={dmSans.variable + " " + cormorant.variable}>
        <Navbar />
        <div style={{ paddingTop: "110px" }}>
          {children}
        </div>
        <Footer />
      </body>
    </html>
  )
}

